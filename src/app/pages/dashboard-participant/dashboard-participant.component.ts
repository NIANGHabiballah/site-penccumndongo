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
  currentView = 'dashboard';
  
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
    // Charger les statistiques
    this.cp2iApi.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data.stats;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des stats:', error);
      }
    });
    
    // Charger les textes de l'utilisateur
    this.cp2iApi.getUserTexts().subscribe({
      next: (data) => {
        this.mesSoumissions = data.textes;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des textes:', error);
      }
    });
  }



  nouvellesoumission() {
    this.router.navigate(['/soumission-texte']);
  }

  setCurrentView(view: string) {
    this.currentView = view;
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
}