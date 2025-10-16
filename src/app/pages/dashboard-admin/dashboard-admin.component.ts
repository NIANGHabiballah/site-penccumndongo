import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Cp2iApiService, User } from '../../services/cp2i-api.service';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit, OnDestroy {
  mobileMenuOpen = false;
  desktopMenuHidden = false;
  currentView = 'dashboard';
  currentUser: User | null = null;
  
  stats: any = {};
  users: any[] = [];
  participants: any[] = [];
  correcteurs: any[] = [];
  affectations: any[] = [];
  textes: any[] = [];
  allAccounts: any[] = [];
  history: any[] = [];
  
  selectedParticipant: number = 0;
  selectedCorrector: number = 0;
  
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
    if (this.currentUser?.role !== 'admin') {
      this.router.navigate(['/cp2i']);
      return;
    }
    
    this.loadData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadData() {
    // Charger le profil admin
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
    
    // Charger les statistiques
    this.cp2iApi.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data.stats || {};
      },
      error: (error) => console.error('Erreur stats:', error)
    });
    
    // Charger tous les utilisateurs
    this.cp2iApi.getUsers().subscribe({
      next: (data) => {
        this.users = data.users || [];
        this.participants = this.users.filter(u => u.role === 'participant');
        this.correcteurs = this.users.filter(u => u.role === 'correcteur');
        this.affectations = data.affectations || [];
      },
      error: (error) => console.error('Erreur utilisateurs:', error)
    });
    
    // Charger tous les textes
    this.cp2iApi.getAllTexts().subscribe({
      next: (data) => {
        this.textes = data.textes || [];
      },
      error: (error) => console.error('Erreur textes:', error)
    });
    
    // Charger tous les comptes avec mots de passe
    this.cp2iApi.getAllAccounts().subscribe({
      next: (data) => {
        this.allAccounts = data.accounts || [];
      },
      error: (error) => console.error('Erreur comptes:', error)
    });
    
    // Charger l'historique
    this.cp2iApi.getHistory().subscribe({
      next: (data) => {
        this.history = data.history || [];
      },
      error: (error) => {
        console.error('Erreur historique:', error);
        this.history = [];
      }
    });
  }

  assignCorrector() {
    if (!this.selectedParticipant || !this.selectedCorrector) {
      this.showToast('Veuillez sélectionner un participant et un correcteur', 'error');
      return;
    }
    
    this.cp2iApi.assignCorrector(this.selectedParticipant, this.selectedCorrector).subscribe({
      next: (response) => {
        this.showToast('Affectation réalisée avec succès!', 'success');
        this.selectedParticipant = 0;
        this.selectedCorrector = 0;
        this.loadData();
      },
      error: (error) => {
        this.showToast('Erreur lors de l\'affectation: ' + (error.error?.error || 'Erreur inconnue'), 'error');
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels = {
      'en_attente': 'En attente',
      'accepte': 'Accepté',
      'refuse': 'Refusé'
    };
    return labels[status as keyof typeof labels] || status;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  isAssigned(participantId: number): boolean {
    return this.affectations.some(a => a.participant_id === participantId);
  }

  getAssignedCorrector(participantId: number): string {
    const affectation = this.affectations.find(a => a.participant_id === participantId);
    return affectation ? `${affectation.corrector_prenom} ${affectation.corrector_nom}` : 'Non assigné';
  }

  logout() {
    this.cp2iApi.logout();
    this.router.navigate(['/cp2i']);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Mot de passe copié !', 'success');
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
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleDesktopMenu() {
    this.desktopMenuHidden = !this.desktopMenuHidden;
  }
}