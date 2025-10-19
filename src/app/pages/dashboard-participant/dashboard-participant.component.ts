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
  styleUrls: ['./dashboard-participant.component.css']
})
export class DashboardParticipantComponent implements OnInit, OnDestroy {
  mesSoumissions: any[] = [];
  stats: any = {};
  currentUser: User | null = null;
  mobileMenuOpen = false;
  desktopMenuHidden = false;
  chatOpen = false;
  currentView = 'accueil';
  
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
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
    
    // Charger les statistiques
    this.cp2iApi.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data.stats || {};
        // Assurer des valeurs par défaut
        this.stats.total_textes = this.stats.total_textes || 0;
        this.stats.textes_acceptes = this.stats.textes_acceptes || 0;
        this.stats.textes_refuses = this.stats.textes_refuses || 0;
        this.stats.textes_en_attente = this.stats.textes_en_attente || 0;
        this.stats.note_moyenne = this.stats.note_moyenne || null;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des stats:', error);
        this.stats = {
          total_textes: 0,
          textes_acceptes: 0,
          textes_refuses: 0,
          textes_en_attente: 0,
          note_moyenne: null
        };
      }
    });
    
    // Charger les textes de l'utilisateur
    this.cp2iApi.getUserTexts().subscribe({
      next: (data) => {
        this.mesSoumissions = data.textes || [];
      },
      error: (error) => {
        console.error('Erreur lors du chargement des textes:', error);
        this.mesSoumissions = [];
      }
    });
  }



  nouvellesoumission() {
    if (this.stats.total_textes > 0) {
      this.showToast('Vous avez déjà soumis un texte pour cette édition. Un seul texte par participant est autorisé.', 'error');
      return;
    }
    this.router.navigate(['/soumission-texte']);
  }

  showToast(message: string, type: 'success' | 'error') {
    // Utiliser la notification toast existante du composant soumission-texte
    const notification = document.createElement('div');
    notification.className = `toast-notification show ${type}`;
    notification.innerHTML = `
      <div class="toast-content">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    // Styles inline pour la notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      padding: 1rem 1.5rem;
      z-index: 1000;
      border-left: 4px solid ${type === 'success' ? '#28a745' : '#dc3545'};
      max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
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
}