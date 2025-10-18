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
  styleUrls: ['./dashboard-correcteur.component.css']
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
    originalite: 0,
    style: 0,
    theme: 0,
    technique: 0,
    commentaire: '',
    statut: 'en_attente'
  };
  
  // Notifications
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';
  
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
    this.stats.corriges = this.textesAssignes.filter(t => t.statut === 'accepte' || t.statut === 'refuse').length;
    this.stats.enCours = this.textesAssignes.filter(t => t.statut === 'en_attente').length;
  }

  calculateDeadline() {
    const deadline = new Date('2025-02-15');
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    this.stats.joursRestants = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
      this.evaluationForm = {
        originalite: this.currentTexte.eval_originalite || 0,
        style: this.currentTexte.eval_style || 0,
        theme: this.currentTexte.eval_theme || 0,
        technique: this.currentTexte.eval_technique || 0,
        commentaire: this.currentTexte.commentaire || '',
        statut: this.currentTexte.statut || 'en_attente'
      };
    }
  }

  // Évaluation
  calculateTotal(): number {
    return this.evaluationForm.originalite + this.evaluationForm.style + 
           this.evaluationForm.theme + this.evaluationForm.technique;
  }

  saveDraft() {
    if (!this.currentTexte) return;
    
    const evaluationData = {
      texte_id: this.currentTexte.id,
      originalite: this.evaluationForm.originalite,
      style: this.evaluationForm.style,
      theme: this.evaluationForm.theme,
      technique: this.evaluationForm.technique,
      note: this.calculateTotal(),
      commentaire: this.evaluationForm.commentaire,
      statut: 'brouillon'
    };
    
    this.cp2iApi.saveEvaluation(evaluationData).subscribe({
      next: (response) => {
        this.showToast('Brouillon sauvegardé', 'success');
        this.loadTextesAssignes();
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
    
    const evaluationData = {
      texte_id: this.currentTexte.id,
      originalite: this.evaluationForm.originalite,
      style: this.evaluationForm.style,
      theme: this.evaluationForm.theme,
      technique: this.evaluationForm.technique,
      note: this.calculateTotal(),
      commentaire: this.evaluationForm.commentaire,
      statut: this.calculateTotal() >= 10 ? 'accepte' : 'refuse'
    };
    
    this.cp2iApi.saveEvaluation(evaluationData).subscribe({
      next: (response) => {
        this.showToast('Évaluation validée avec succès', 'success');
        this.loadTextesAssignes();
        this.nextTexte();
      },
      error: (error) => {
        this.showToast('Erreur lors de la validation', 'error');
      }
    });
  }

  // Utilitaires
  getStatusLabel(status: string): string {
    const labels = {
      'en_attente': 'En attente',
      'brouillon': 'Brouillon',
      'accepte': 'Accepté',
      'refuse': 'Refusé'
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
}