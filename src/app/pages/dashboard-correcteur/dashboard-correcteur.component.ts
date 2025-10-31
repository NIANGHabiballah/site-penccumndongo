import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Cp2iApiService, User } from '../../services/cp2i-api.service';

@Component({
  selector: 'app-dashboard-correcteur',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard-correcteur.component.html',
  styleUrls: ['./dashboard-correcteur.component.css', './guide-styles.css']
})
export class DashboardCorrecteurComponent implements OnInit, OnDestroy {
  // Navigation
  currentView = 'textes-assignes';
  mobileMenuOpen = false;
  desktopMenuHidden = false;
  currentUser: User | null = null;
  
  // Données
  textesAssignes: any[] = [];
  stats = { assignes: 0, corriges: 0, enCours: 0, joursRestants: 0 };
  currentTexte: any = null;
  currentTexteIndex = 0;
  messages: any[] = [];
  historique: any[] = [];
  
  // Évaluation
  evaluationForm = {
    pertinence: 0,
    coherence: 0,
    correction: 0,
    presentation: 0,
    commentaire: '',
    statut: 'en_attente'
  };
  
  // Notifications
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';
  
  // Messages
  currentMessageFilter = 'all';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private cp2iApi: Cp2iApiService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.cp2iApi.isAuthenticated()) {
      this.router.navigate(['/cp2i']);
      return;
    }
    
    this.currentUser = this.cp2iApi.getCurrentUser();
    if (this.currentUser?.role !== 'correcteur') {
      this.router.navigate(['/cp2i']);
      return;
    }
    
    this.loadData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadData() {
    this.loadProfile();
    this.loadTextesAssignes();
    this.loadMessages();
    this.loadHistorique();
    this.calculateDeadline();
  }

  loadProfile() {
    this.cp2iApi.getProfile().subscribe({
      next: (data) => {
        if (data.profile) {
          this.currentUser = {
            id: data.profile.id,
            email: data.profile.email,
            nom: data.profile.nom,
            prenom: data.profile.prenom,
            role: data.profile.role
          };
        }
      },
      error: (error) => console.error('Erreur profil:', error)
    });
  }

  loadTextesAssignes() {
    this.cp2iApi.getCorrecteurTexts().subscribe({
      next: (data) => {
        this.textesAssignes = data.textes || [];
        this.calculerStats();
        if (this.textesAssignes.length > 0) {
          this.currentTexte = this.textesAssignes[0];
          this.loadEvaluationForm();
        }
      },
      error: (error) => {
        console.error('Erreur textes:', error);
        this.textesAssignes = [];
      }
    });
  }

  loadMessages() {
    console.log('Loading correcteur messages...');
    this.cp2iApi.getCorrecteurMessages().subscribe({
      next: (data) => {
        console.log('Messages received:', data);
        this.messages = data.messages || [];
      },
      error: (error) => {
        console.error('Erreur messages:', error);
        this.messages = [];
      }
    });
  }

  loadHistorique() {
    this.cp2iApi.getCorrecteurHistory().subscribe({
      next: (data) => {
        this.historique = data.history || [];
      },
      error: (error) => {
        console.error('Erreur historique:', error);
        this.historique = [];
      }
    });
  }

  calculerStats() {
    this.stats.assignes = this.textesAssignes.length;
    this.stats.corriges = this.textesAssignes.filter(t => t.statut === 'corrige' || (t.note && t.note > 0)).length;
    this.stats.enCours = this.stats.assignes - this.stats.corriges;
  }

  calculateDeadline() {
    // Date limite pour les corrections : 3 décembre 2025
    const deadline = new Date('2025-12-03');
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    this.stats.joursRestants = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Navigation
  setCurrentView(view: string) {
    this.currentView = view;
    // Empêcher toute redirection automatique
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }

  // Gestion des textes
  selectTexte(texte: any, index: number) {
    this.currentTexte = texte;
    this.currentTexteIndex = index;
    this.loadEvaluationForm();
    this.setCurrentView('interface-correction');
  }

  previousTexte() {
    if (this.currentTexteIndex > 0) {
      this.currentTexteIndex--;
      this.currentTexte = this.textesAssignes[this.currentTexteIndex];
      this.loadEvaluationForm();
    }
  }

  nextTexte() {
    if (this.currentTexteIndex < this.textesAssignes.length - 1) {
      this.currentTexteIndex++;
      this.currentTexte = this.textesAssignes[this.currentTexteIndex];
      this.loadEvaluationForm();
    }
  }

  loadEvaluationForm() {
    if (this.currentTexte) {
      // Charger les évaluations détaillées depuis l'API
      this.cp2iApi.getTextCorrections(this.currentTexte.id).subscribe({
        next: (data) => {
          console.log('📊 Évaluations reçues:', data);
          if (data && data.corrections && data.corrections.length > 0) {
            // Trouver l'évaluation du correcteur connecté
            const evaluation = data.corrections.find((c: any) => c.correcteur_id === this.currentUser?.id) || data.corrections[0];
            console.log('👤 Évaluation du correcteur:', evaluation);
            console.log('🔑 Propriétés disponibles:', Object.keys(evaluation));
            console.log('📊 Critères trouvés:', evaluation.criteres);
            console.log('📊 Note globale:', evaluation.note);
            
            const criteres = evaluation.criteres || {};
            this.evaluationForm = {
              pertinence: criteres.pertinence || 0,
              coherence: criteres.coherence || 0,
              correction: criteres.correction || 0,
              presentation: criteres.presentation || 0,
              commentaire: evaluation.commentaire || '',
              statut: this.currentTexte.statut || 'en_attente'
            };
          } else {
            // Pas d'évaluation trouvée, formulaire vide
            this.evaluationForm = {
              pertinence: 0,
              coherence: 0,
              correction: 0,
              presentation: 0,
              commentaire: '',
              statut: 'en_attente'
            };
          }
          console.log('📋 Formulaire final:', this.evaluationForm);
        },
        error: (error) => {
          console.log('❌ Erreur chargement évaluations:', error);
          // Formulaire vide en cas d'erreur
          this.evaluationForm = {
            pertinence: 0,
            coherence: 0,
            correction: 0,
            presentation: 0,
            commentaire: '',
            statut: 'en_attente'
          };
        }
      });
    }
  }

  // Évaluation
  validateNote(field: string, event: any) {
    const value = parseInt(event.target.value);
    if (value > 5) {
      (this.evaluationForm as any)[field] = 5;
      event.target.value = 5;
      this.showToast('La note maximum est de 5 points par critère', 'error');
    } else if (value < 0) {
      (this.evaluationForm as any)[field] = 0;
      event.target.value = 0;
    }
  }

  calculateTotal(): number {
    return this.evaluationForm.pertinence + this.evaluationForm.coherence + 
           this.evaluationForm.correction + this.evaluationForm.presentation;
  }

  saveDraft() {
    if (!this.currentTexte) return;
    
    const evaluationData = {
      texte_id: this.currentTexte.id,
      pertinence: this.evaluationForm.pertinence,
      coherence: this.evaluationForm.coherence,
      correction: this.evaluationForm.correction,
      presentation: this.evaluationForm.presentation,
      note: this.calculateTotal(),
      commentaire: this.evaluationForm.commentaire,
      statut: 'brouillon'
    };
    
    this.cp2iApi.saveEvaluation(evaluationData).subscribe({
      next: (response) => {
        this.showToast('Brouillon sauvegardé', 'success');
        this.loadTextesAssignes();
        this.loadHistorique(); // Recharger l'historique
      },
      error: (error) => {
        this.showToast('Erreur lors de la sauvegarde', 'error');
      }
    });
  }

  validateEvaluation() {
    if (!this.currentTexte) return;
    
    if (this.calculateTotal() === 0) {
      this.showToast('Veuillez attribuer des notes', 'error');
      return;
    }
    
    const isModification = this.currentTexte.statut === 'accepte' || this.currentTexte.statut === 'refuse';
    
    const evaluationData = {
      texte_id: this.currentTexte.id,
      pertinence: this.evaluationForm.pertinence,
      coherence: this.evaluationForm.coherence,
      correction: this.evaluationForm.correction,
      presentation: this.evaluationForm.presentation,
      note: this.calculateTotal(),
      commentaire: this.evaluationForm.commentaire,
      statut: this.calculateTotal() >= 10 ? 'accepte' : 'refuse'
    };
    
    this.cp2iApi.saveEvaluation(evaluationData).subscribe({
      next: (response) => {
        const message = isModification ? 'Note modifiée avec succès' : 'Évaluation validée avec succès';
        this.showToast(message, 'success');
        this.loadTextesAssignes();
        this.loadHistorique(); // Recharger l'historique
        if (!isModification) {
          this.nextTexte();
        }
      },
      error: (error) => {
        this.showToast('Erreur lors de la validation', 'error');
      }
    });
  }

  // Utilitaires
  getStatusLabel(status: string): string {
    const labels = {
      'en_attente': 'À corriger',
      'brouillon': 'Brouillon',
      'accepte': 'Admis (≥10/20)',
      'refuse': 'Non admis (<10/20)'
    };
    return labels[status as keyof typeof labels] || status;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  showToast(message: string, type: 'success' | 'error') {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;
    
    setTimeout(() => {
      this.showNotification = false;
    }, 4000);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenuOnLeave() {
    if (window.innerWidth <= 768) {
      this.mobileMenuOpen = false;
    }
  }

  logout() {
    this.cp2iApi.logout();
    this.router.navigate(['/cp2i']);
  }

  getUnreadMessagesCount(): number {
    return this.messages.filter(m => !m.read_at).length;
  }

  readMessage(message: any) {
    if (!message.read_at) {
      this.cp2iApi.markMessageAsRead(message.id).subscribe({
        next: () => {
          message.read_at = new Date().toISOString();
        },
        error: (error) => console.error('Erreur marquage lu:', error)
      });
    }
  }

  copyText() {
    if (!this.currentTexte) return;
    
    navigator.clipboard.writeText(this.currentTexte.contenu).then(() => {
      this.showToast('Texte copié dans le presse-papiers', 'success');
    }).catch(() => {
      this.showToast('Erreur lors de la copie', 'error');
    });
  }

  downloadWord() {
    if (!this.currentTexte) return;
    
    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; font-size: 14pt; line-height: 1.8; margin: 20px; }
            .header { margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
            .info { margin: 5px 0; font-weight: bold; }
            .content { margin-top: 20px; white-space: pre-line; font-family: 'Inter', Arial, sans-serif; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="info">Titre: ${this.currentTexte.titre}</div>
            <div class="info">Identifiant: CP2i-${this.currentTexte.id.toString().padStart(3, '0')}</div>
            <div class="info">Langue: ${this.currentTexte.langue}</div>
            <div class="info">Date de soumission: ${new Date(this.currentTexte.created_at).toLocaleDateString('fr-FR')}</div>
          </div>
          <div class="content">${this.currentTexte.contenu.replace(/\n/g, '<br>')}</div>
        </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CP2i-${this.currentTexte.id.toString().padStart(3, '0')}.doc`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    this.showToast('Téléchargement lancé', 'success');
  }

  // Méthodes pour la gestion des messages
  getFilteredMessages(): any[] {
    if (this.currentMessageFilter === 'unread') {
      return this.messages.filter(m => !m.read_at);
    } else if (this.currentMessageFilter === 'read') {
      return this.messages.filter(m => m.read_at);
    }
    return this.messages;
  }

  toggleMessageExpansion(message: any) {
    message.expanded = !message.expanded;
    if (message.expanded && !message.read_at) {
      this.markAsRead(message);
    }
  }

  markAsRead(message: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (!message.read_at) {
      this.cp2iApi.markMessageAsRead(message.id).subscribe({
        next: () => {
          message.read_at = new Date().toISOString();
          this.showToast('Message marqué comme lu', 'success');
        },
        error: (error) => {
          console.error('Erreur marquage lu:', error);
          this.showToast('Erreur lors du marquage', 'error');
        }
      });
    }
  }
}