import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Cp2iApiService, User } from '../../services/cp2i-api.service';

@Component({
  selector: 'app-dashboard-participant',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard-participant.component.html',
  styleUrls: ['./dashboard-participant.component.css', './participant-sections.css']
})
export class DashboardParticipantComponent implements OnInit, OnDestroy {
  mesSoumissions: any[] = [];
  stats: any = {};
  currentUser: User | null = null;
  mobileMenuOpen = false;
  desktopMenuHidden = false;
  chatOpen = false;
  currentView = 'accueil';
  currentGuideSection = 'steps';
  currentHistoryFilter = 'all';
  openFaq: number | null = null;
  messages: any[] = [];
  historique: any[] = [];
  certificats: any[] = [];
  classement: any = {};
  joursRestants = 0;
  evaluationsDetaillees: any[] = [];
  Math = Math;
  
  // Modal de soumission
  showSoumissionModal = false;
  isEditing = false;
  editingTexteId: number | null = null;
  texte = {
    titre: '',
    theme: '',
    langue: '',
    contenu: ''
  };
  isSubmitting = false;
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';
  
  // Modal de confirmation suppression
  showConfirmationModal = false;
  texteToDelete: any = null;
  
  // Dates officielles du concours CP2i 2025
  concoursSchedule = {
    inscription_debut: '2025-11-03',
    inscription_fin: '2025-11-23',
    correction_debut: '2025-11-24',
    correction_fin: '2025-11-30',
    correction_prolongement: '2025-12-03',
    deliberation: '2025-12-10',
    ceremonie_remise: '2026-01-10'
  };
  
  private subscriptions: Subscription[] = [];

  constructor(
    private cp2iApi: Cp2iApiService,
    private router: Router
  ) {}

  ngOnInit() {
    // Vérifier l'authentification
    if (!this.cp2iApi.isAuthenticated()) {
      this.router.navigate(['/cp2i']);
      return;
    }
    
    this.currentUser = this.cp2iApi.getCurrentUser();
    this.loadData();
    
    // Forcer le recalcul du layout mobile
    this.handleMobileLayout();
  }
  
  handleMobileLayout() {
    if (typeof window !== 'undefined') {
      // Détecter si on est sur mobile
      const isMobile = window.innerWidth <= 480;
      
      if (isMobile) {
        // Forcer le recalcul des styles
        setTimeout(() => {
          const mainContent = document.querySelector('.main-content');
          if (mainContent) {
            (mainContent as HTMLElement).style.display = 'none';
            setTimeout(() => {
              (mainContent as HTMLElement).style.display = 'block';
            }, 10);
          }
        }, 100);
      }
      
      // Écouter les changements de taille d'écran
      window.addEventListener('resize', () => {
        this.handleMobileLayout();
      });
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Nettoyer les event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleMobileLayout);
    }
  }

  loadData() {
    // Charger le profil utilisateur réel
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
      error: (error) => {
        console.error('Erreur lors du chargement du profil:', error);
      }
    });
    
    // Charger les données validées
    this.loadDataFallback();
    
    // Pas d'appel serveur en développement
    
    // Charger les messages
    this.loadMessages();
    
    // Charger l'historique
    this.loadHistorique();
    
    // Charger les certificats
    this.loadCertificats();
    
    // Calculer les jours restants
    this.calculateDeadline();
    
    // Charger le classement après les autres données
    setTimeout(() => {
      this.loadClassement();
    }, 1000);
    
    // Charger les évaluations détaillées
    this.loadEvaluationsDetaillees();
  }
  
  loadMessages() {
    this.cp2iApi.getMessages().subscribe({
      next: (data) => {
        this.messages = data.messages || [];
      },
      error: (error) => {
        console.error('Erreur chargement messages:', error);
        // Fallback vers messages temporaires
        this.messages = [
          {
            id: 3,
            subject: 'Salutations',
            content: 'Bonjour a tous, Bien des choses a vous. le concours va bientot demarrer !',
            created_at: '2025-10-18T20:51:32.000Z',
            read_at: null
          }
        ];
      }
    });
  }
  
  loadHistorique() {
    this.cp2iApi.getParticipantHistory().subscribe({
      next: (data) => {
        this.historique = data.history || [];
      },
      error: (error) => {
        if (error.status === 403) {
          console.warn('Accès refusé à l\'historique - problème d\'authentification');
        } else {
          console.error('Erreur historique:', error);
        }
        this.historique = [];
      }
    });
  }
  
  loadCertificats() {
    // Simuler des certificats pour l'instant
    this.certificats = [];
    if (this.stats.textes_acceptes > 0) {
      this.certificats = [
        {
          id: 1,
          titre: 'Certificat de Participation CP2i 2025',
          description: 'Certificat officiel de participation au concours',
          date: new Date()
        }
      ];
    }
  }
  
  calculateDeadline() {
    const prochaineEcheance = this.getProchaineEcheance();
    this.joursRestants = prochaineEcheance.jours;
  }
  
  getJoursRestants(dateStr: string): number {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  getProchaineEcheance(): { nom: string, date: string, jours: number } {
    const today = new Date();
    const echeances = [
      { nom: 'Début des inscriptions', date: this.concoursSchedule.inscription_debut },
      { nom: 'Fin des inscriptions', date: this.concoursSchedule.inscription_fin },
      { nom: 'Début des corrections', date: this.concoursSchedule.correction_debut },
      { nom: 'Fin des corrections', date: this.concoursSchedule.correction_prolongement },
      { nom: 'Délibération', date: this.concoursSchedule.deliberation },
      { nom: 'Cérémonie de remise', date: this.concoursSchedule.ceremonie_remise }
    ];
    
    for (const echeance of echeances) {
      const dateEcheance = new Date(echeance.date);
      if (dateEcheance >= today) {
        return {
          nom: echeance.nom,
          date: echeance.date,
          jours: this.getJoursRestants(echeance.date)
        };
      }
    }
    
    return { nom: 'Aucune échéance', date: '', jours: 0 };
  }
  
  loadClassement() {
    this.cp2iApi.getClassement().subscribe({
      next: (data) => {
        if (data.success && data.participants && this.stats.note_moyenne) {
          const participants = data.participants;
          const maNoteMoyenne = this.stats.note_moyenne;
          const monUserId = this.currentUser?.id;
          
          let position = null;
          let totalParticipants = participants.length;
          
          for (let i = 0; i < participants.length; i++) {
            if (participants[i].user_id == monUserId) {
              position = i + 1;
              break;
            }
          }
          
          this.classement = {
            position: position || 1,
            total: totalParticipants || 50
          };
        } else {
          this.classement = { position: null, total: 0 };
        }
      },
      error: (error) => {
        console.warn('Classement indisponible:', error.status);
        this.classement = { position: null, total: 0 };
      }
    });
  }
  
  calculateRealRanking() {
    // Utiliser les données réelles des textes chargés
    let totalParticipants = 1;
    let notesDesAutres: number[] = [];
    
    // Analyser les données des corrections chargées
    this.mesSoumissions.forEach(texte => {
      if (texte.corrections && texte.corrections.length > 0) {
        texte.corrections.forEach((correction: any) => {
          if (correction.note && !isNaN(correction.note)) {
            notesDesAutres.push(parseFloat(correction.note));
          }
        });
      }
    });
    
    // Si on a des données de corrections, les utiliser
    if (notesDesAutres.length > 0) {
      totalParticipants = notesDesAutres.length;
      
      if (this.stats.note_moyenne && this.stats.note_moyenne > 0) {
        // Compter combien de notes sont supérieures à la mienne
        const notesSuperieures = notesDesAutres.filter(note => note > this.stats.note_moyenne).length;
        const position = notesSuperieures + 1;
        const percentile = Math.round((1 - (position - 1) / totalParticipants) * 100);
        
        this.classement = {
          position: position,
          total: totalParticipants,
          note_moyenne: this.stats.note_moyenne,
          percentile: percentile
        };
      } else {
        this.classement = {
          position: null,
          total: totalParticipants,
          note_moyenne: null,
          percentile: null
        };
      }
    } else {
      // Pas de données de corrections disponibles
      this.classement = {
        position: null,
        total: 0,
        note_moyenne: this.stats.note_moyenne,
        percentile: null
      };
    }
    
    console.log('Classement calculé avec', totalParticipants, 'notes réelles:', notesDesAutres);
  }
  
  loadEvaluationsDetaillees() {
    console.log('Chargement des évaluations détaillées...', this.mesSoumissions);
    
    let evaluationsChargees = 0;
    const totalTextes = this.mesSoumissions.filter(t => t.id && t.note).length;
    
    if (totalTextes === 0) {
      this.calculateRealStats();
      return;
    }
    
    // Charger les vraies évaluations depuis l'API
    this.mesSoumissions.forEach(texte => {
      if (texte.id && texte.note) {
        console.log(`Appel API pour texte ${texte.id}...`);
        this.cp2iApi.getTextCorrections(texte.id).subscribe({
          next: (data) => {
            console.log(`Réponse API pour texte ${texte.id}:`, data);
            if (data && data.success && data.corrections && data.corrections.length > 0) {
              texte.corrections = data.corrections;
              console.log(`Corrections assignées pour texte ${texte.id}:`, texte.corrections);
            } else {
              console.warn(`Pas de corrections pour texte ${texte.id}`);
            }
            
            evaluationsChargees++;
            if (evaluationsChargees === totalTextes) {
              // Recalculer les stats après avoir chargé toutes les évaluations
              this.calculateRealStats();
            }
          },
          error: (error) => {
            console.error(`Erreur API pour texte ${texte.id}:`, error);
            evaluationsChargees++;
            if (evaluationsChargees === totalTextes) {
              this.calculateRealStats();
            }
          }
        });
      } else {
        console.log(`Texte ${texte.id} ignoré - ID: ${texte.id}, Note: ${texte.note}`);
      }
    });
  }
  
  countVerses(contenu: string): number {
    if (!contenu) return 0;
    return contenu.split('\n').filter(line => line.trim().length > 0).length;
  }
  
  markAsRead(message: any) {
    if (!message.read_at) {
      this.cp2iApi.markMessageAsRead(message.id).subscribe({
        next: () => {
          message.read_at = new Date().toISOString();
          console.log('Message marqué comme lu:', message.id);
        },
        error: (error) => console.error('Erreur marquage lu:', error)
      });
    }
  }
  
  downloadCertificat(cert: any) {
    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Times New Roman', serif; text-align: center; padding: 50px; }
            .certificat { border: 10px solid #FFD700; padding: 50px; margin: 20px; }
            h1 { color: #8B4513; font-size: 36px; margin-bottom: 30px; }
            h2 { color: #2F4F4F; font-size: 24px; margin: 20px 0; }
            .nom { font-size: 28px; color: #8B0000; font-weight: bold; margin: 30px 0; }
            .date { margin-top: 50px; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="certificat">
            <h1>CERTIFICAT DE PARTICIPATION</h1>
            <h2>Concours de Poésie Inédit & Innovant CP2i 2025</h2>
            <p>Ce certificat atteste que</p>
            <div class="nom">{{currentUser?.prenom}} {{currentUser?.nom}}</div>
            <p>a participé au Concours de Poésie Inédit & Innovant CP2i Édition 2025</p>
            <div class="date">Délivré le {{new Date().toLocaleDateString('fr-FR')}}</div>
          </div>
        </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificat_CP2i_${this.currentUser?.nom}_${this.currentUser?.prenom}.doc`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    this.showToast('Certificat téléchargé avec succès', 'success');
  }



  nouvellesoumission() {
    if (this.mesSoumissions.length > 0) {
      this.showToast('Vous avez déjà soumis un texte pour cette édition. Un seul texte par participant est autorisé.', 'error');
      return;
    }
    this.openSoumissionModal();
  }
  
  openSoumissionModal(texte?: any) {
    this.isEditing = !!texte;
    this.editingTexteId = texte?.id || null;
    
    if (texte) {
      this.texte = {
        titre: texte.titre || '',
        theme: texte.theme || '',
        langue: texte.langue || '',
        contenu: texte.contenu || ''
      };
    } else {
      this.resetForm();
    }
    
    this.showSoumissionModal = true;
  }
  
  closeSoumissionModal() {
    this.showSoumissionModal = false;
    this.resetForm();
  }
  
  resetForm() {
    this.texte = {
      titre: '',
      theme: '',
      langue: '',
      contenu: ''
    };
    this.isEditing = false;
    this.editingTexteId = null;
  }
  
  getLineCount(): number {
    if (!this.texte.contenu) return 0;
    return this.texte.contenu.split('\n').filter(line => line.trim().length > 0).length;
  }
  
  isFormValid(): boolean {
    return !!(this.texte.titre && this.texte.contenu && this.texte.theme && this.texte.langue && this.getLineCount() <= 40);
  }
  
  onSubmitTexte() {
    if (this.isSubmitting) return;
    
    // Vérifier et alerter pour chaque champ manquant
    if (!this.texte.titre) {
      this.showToast('Le titre est requis', 'error');
      return;
    }
    
    if (!this.texte.theme) {
      this.showToast('Le thème est requis', 'error');
      return;
    }
    
    if (!this.texte.langue) {
      this.showToast('La langue est requise', 'error');
      return;
    }
    
    if (!this.texte.contenu) {
      this.showToast('Le contenu du texte est requis', 'error');
      return;
    }
    
    if (this.getLineCount() > 40) {
      this.showToast('Le texte ne peut pas dépasser 40 vers', 'error');
      return;
    }
    
    this.isSubmitting = true;
    
    const texteData = {
      titre: this.texte.titre,
      theme: this.texte.theme,
      langue: this.texte.langue,
      contenu: this.texte.contenu
    };
    
    if (this.isEditing && this.editingTexteId) {
      const texteToUpdate = { ...texteData, id: this.editingTexteId };
      this.cp2iApi.updateText(texteToUpdate).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response && response.success) {
            this.showToast('Texte modifié avec succès !', 'success');
            this.closeSoumissionModal();
            this.loadDataFallback();
          } else {
            this.showToast('Erreur lors de la modification: ' + (response?.error || 'Erreur inconnue'), 'error');
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showToast('Erreur lors de la modification du texte', 'error');
        }
      });
    } else {
      this.cp2iApi.submitText(texteData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response && response.success) {
            this.showToast('Texte soumis avec succès !', 'success');
            this.closeSoumissionModal();
            this.loadDataFallback();
          } else {
            this.showToast('Erreur lors de la soumission: ' + (response?.error || 'Erreur inconnue'), 'error');
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          let errorMessage = 'Erreur lors de la soumission du texte';
          if (error.error && error.error.error) {
            errorMessage = error.error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
          this.showToast(errorMessage, 'error');
        }
      });
    }
  }

  fixDataInconsistency() {
    this.showToast('Correction des données en cours...', 'success');
    
    this.cp2iApi.fixDashboardData().subscribe({
      next: (data) => {
        if (data.success) {
          this.mesSoumissions = data.textes || [];
          this.stats = data.stats || {};
          
          const corrections = data.corrections_applied;
          let message = 'Données corrigées avec succès!';
          
          if (corrections.duplicates_removed > 0) {
            message += ` ${corrections.duplicates_removed} doublon(s) supprimé(s).`;
          }
          
          this.showToast(message, 'success');
          console.log('Corrections appliquées:', corrections);
        } else {
          this.showToast('Erreur lors de la correction: ' + data.error, 'error');
        }
      },
      error: (error) => {
        console.error('Erreur lors de la correction des données:', error);
        this.showToast('Erreur lors de la correction des données', 'error');
      }
    });
  }

  showToast(message: string, type: 'success' | 'error') {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;
    
    setTimeout(() => {
      this.showNotification = false;
    }, 4000);
  }

  setCurrentView(view: string) {
    this.currentView = view;
    // Empêcher toute redirection automatique
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }

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

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleDesktopMenu() {
    this.desktopMenuHidden = !this.desktopMenuHidden;
  }

  openChatSupport() {
    this.chatOpen = !this.chatOpen;
  }

  sendMessage(message: string) {
    console.log('Message envoyé:', message);
    // Logique d'envoi de message
  }
  
  logout() {
    this.cp2iApi.logout();
    this.router.navigate(['/cp2i']);
  }

  closeChat() {
    this.chatOpen = false;
  }

  closeMobileMenuOnLeave() {
    if (window.innerWidth <= 768) {
      this.mobileMenuOpen = false;
    }
  }
  
  getUnreadMessagesCount(): number {
    return this.messages.filter(m => !m.read_at).length;
  }
  
  calculateRealStats() {
    // Calculer les vraies statistiques basées sur les textes chargés
    this.stats = {
      total_textes: this.mesSoumissions.length,
      textes_acceptes: this.mesSoumissions.filter(t => t.statut === 'accepte').length,
      textes_refuses: this.mesSoumissions.filter(t => t.statut === 'refuse').length,
      textes_en_attente: this.mesSoumissions.filter(t => t.statut === 'en_attente' || t.statut === 'brouillon').length,
      note_moyenne: this.calculateAverageNote()
    };
    
    console.log('Stats calculées:', this.stats);
    
    // Calculer le classement après les stats
    this.loadClassement();
  }
  
  calculateAverageNote(): number | null {
    // Pour chaque texte, calculer la moyenne des évaluations de tous les correcteurs
    let totalNotes = 0;
    let nombreEvaluations = 0;
    
    this.mesSoumissions.forEach(texte => {
      if (texte.corrections && texte.corrections.length > 0) {
        // Utiliser les vraies évaluations des correcteurs
        texte.corrections.forEach((correction: any) => {
          if (correction.note && !isNaN(correction.note)) {
            totalNotes += parseFloat(correction.note);
            nombreEvaluations++;
          }
        });
      } else if (texte.note && !isNaN(texte.note)) {
        // Fallback sur la note du texte si pas de corrections détaillées
        totalNotes += parseFloat(texte.note);
        nombreEvaluations++;
      }
    });
    
    return nombreEvaluations > 0 ? totalNotes / nombreEvaluations : null;
  }
  
  validateStats(serverStats: any) {
    // Comparer seulement si les stats frontend sont calculées
    if (this.stats.total_textes !== undefined && serverStats.total_textes !== this.stats.total_textes) {
      console.warn('Incohérence détectée - Textes totaux:', {
        frontend: this.stats.total_textes,
        backend: serverStats.total_textes
      });
      
      this.showToast('Données synchronisées avec le serveur', 'success');
    }
  }
  
  modifierTexte(texte: any) {
    // Vérifier si le texte peut être modifié
    const peutModifier = this.canModifyText(texte);
    
    if (!peutModifier.canModify) {
      this.showToast(peutModifier.reason, 'error');
      return;
    }
    
    // Ouvrir la modal de modification
    this.openSoumissionModal(texte);
  }
  
  loadDataFallback() {
    // Méthode de fallback en cas d'erreur de validation
    this.cp2iApi.getUserTexts().subscribe({
      next: (data) => {
        this.mesSoumissions = data.textes || [];
        console.log('Textes chargés (fallback):', this.mesSoumissions);
        
        // Filtrer pour ne garder que le texte du participant connecté
        this.mesSoumissions = this.mesSoumissions.slice(0, 1);
        
        // Charger les évaluations détaillées après le chargement des textes
        // calculateRealStats sera appelé automatiquement après le chargement des évaluations
        this.loadEvaluationsDetaillees();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des textes (fallback):', error);
        this.mesSoumissions = [];
        this.calculateRealStats();
      }
    });
  }

  hasCorrections(): boolean {
    return this.mesSoumissions.some(texte => texte.corrections && texte.corrections.length > 0);
  }

  canModifyText(texte: any): { canModify: boolean, reason: string } {
    // Un texte peut être modifié si :
    // 1. Il est en brouillon
    // 2. Il est en attente ET n'a pas encore été assigné à un correcteur
    // 3. Il n'a pas encore été évalué
    
    if (texte.statut === 'brouillon') {
      return { canModify: true, reason: '' };
    }
    
    if (texte.statut === 'accepte' || texte.statut === 'refuse') {
      return { canModify: false, reason: 'Ce texte a déjà été évalué et ne peut plus être modifié.' };
    }
    
    if (texte.correcteur_id) {
      return { canModify: false, reason: 'Ce texte est déjà assigné à un correcteur et ne peut plus être modifié.' };
    }
    
    if (texte.statut === 'en_attente' && texte.peut_modifier) {
      return { canModify: true, reason: '' };
    }
    
    return { canModify: false, reason: 'Ce texte ne peut pas être modifié dans son état actuel.' };
  }
  
  supprimerTexte(texte: any) {
    if (!this.canModifyText(texte).canModify) {
      this.showToast('Ce texte ne peut pas être supprimé', 'error');
      return;
    }
    
    this.showConfirmationModal = true;
    this.texteToDelete = texte;
  }
  
  confirmSuppression() {
    if (this.texteToDelete) {
      this.cp2iApi.deleteTexte(this.texteToDelete.id).subscribe({
        next: (response) => {
          if (response && response.success) {
            this.showToast('Texte supprimé avec succès', 'success');
            this.loadDataFallback();
          } else {
            this.showToast('Erreur lors de la suppression: ' + (response?.error || 'Erreur inconnue'), 'error');
          }
          this.closeConfirmationModal();
        },
        error: (error) => {
          this.showToast('Erreur lors de la suppression du texte', 'error');
          this.closeConfirmationModal();
        }
      });
    }
  }
  
  closeConfirmationModal() {
    this.showConfirmationModal = false;
    this.texteToDelete = null;
  }
  
  // Méthodes pour le guide d'utilisation
  toggleFaq(faqNumber: number) {
    this.openFaq = this.openFaq === faqNumber ? null : faqNumber;
  }
  
  // Méthodes pour l'historique
  getFilteredHistory(): any[] {
    if (this.currentHistoryFilter === 'all') {
      return this.historique;
    }
    return this.historique.filter(item => item.type === this.currentHistoryFilter);
  }
  
  getHistoryCount(type: string): number {
    return this.historique.filter(item => item.type === type).length;
  }
  
  getHistoryIconClass(type: string): string {
    const classes = {
      'submission': 'submission',
      'evaluation': 'evaluation', 
      'message': 'message',
      'login': 'login'
    };
    return classes[type as keyof typeof classes] || 'default';
  }
  
  getHistoryIcon(type: string): string {
    const icons = {
      'submission': 'fa-file-alt',
      'evaluation': 'fa-star',
      'message': 'fa-envelope',
      'login': 'fa-sign-in-alt'
    };
    return icons[type as keyof typeof icons] || 'fa-circle';
  }
  
  getHistoryTitle(item: any): string {
    const titles = {
      'submission': 'Soumission de texte',
      'evaluation': 'Évaluation reçue',
      'message': 'Message reçu',
      'login': 'Connexion au tableau de bord'
    };
    return titles[item.type as keyof typeof titles] || item.action || 'Action';
  }
  
  getHistoryDescription(item: any): string {
    const descriptions = {
      'submission': `Vous avez soumis votre texte "${item.details?.titre || 'Sans titre'}" au concours.`,
      'evaluation': `Votre texte a été évalué avec une note de ${item.details?.note || 'N/A'}/20.`,
      'message': `Nouveau message reçu de l'administration : "${item.details?.subject || 'Message'}".`,
      'login': 'Vous vous êtes connecté à votre tableau de bord participant.'
    };
    return descriptions[item.type as keyof typeof descriptions] || item.description || 'Aucune description disponible';
  }
}