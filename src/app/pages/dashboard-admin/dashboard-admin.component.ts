import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DashboardDataService, DashboardStats, Participant, Texte } from '../../services/dashboard-data.service';
import { ActivityItem } from '../../types/dashboard.types';
import { GestionUtilisateursComponent } from '../gestion-utilisateurs/gestion-utilisateurs.component';
import { GestionTextesComponent } from '../gestion-textes/gestion-textes.component';
import { StatistiquesComponent } from '../statistiques/statistiques.component';

import { SyncIndicatorComponent } from '../../components/sync-indicator/sync-indicator.component';
import { RealtimeSyncService } from '../../services/realtime-sync.service';
import { AutoUpdateService } from '../../services/auto-update.service';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, GestionUtilisateursComponent, GestionTextesComponent, StatistiquesComponent, SyncIndicatorComponent],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit, OnDestroy {
  mobileMenuOpen = false;
  desktopMenuHidden = false;
  currentView = 'dashboard';
  
  stats: DashboardStats = {
    participants: 0,
    correcteurs: 0,
    textesTotal: 0,
    textesEnAttente: 0,
    textesEvalues: 0,
    textesValides: 0,
    concoursActifs: 0,
    moyenneNotes: 0,
    participantsActifs: 0,
    messagesNonLus: 0
  };
  
  participants: Participant[] = [];
  textes: Texte[] = [];
  recentActivity: ActivityItem[] = [];
  
  private subscriptions: Subscription[] = [];

  constructor(
    private dashboardService: DashboardDataService,
    private realtimeService: RealtimeSyncService,
    private autoUpdateService: AutoUpdateService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadData() {
    this.subscriptions.push(
      this.dashboardService.stats$.subscribe(stats => {
        this.stats = stats;
      })
    );

    this.subscriptions.push(
      this.dashboardService.participants$.subscribe(participants => {
        this.participants = participants;
        this.generateRecentActivity();
      })
    );

    this.subscriptions.push(
      this.dashboardService.textes$.subscribe(textes => {
        this.textes = textes;
        this.generateRecentActivity();
      })
    );
  }

  generateRecentActivity() {
    const activities: ActivityItem[] = [];
    
    const recentTextes = this.textes
      .sort((a, b) => new Date(b.dateSubmission).getTime() - new Date(a.dateSubmission).getTime())
      .slice(0, 3);
    
    recentTextes.forEach(texte => {
      activities.push({
        user: texte.participantNom,
        action: 'Nouveau texte soumis',
        time: this.getTimeAgo(texte.dateSubmission),
        avatar: this.getInitials(texte.participantNom)
      });
    });

    const recentParticipants = this.participants
      .sort((a, b) => new Date(b.dateInscription).getTime() - new Date(a.dateInscription).getTime())
      .slice(0, 2);
    
    recentParticipants.forEach(participant => {
      activities.push({
        user: participant.nom,
        action: 'Inscription validée',
        time: this.getTimeAgo(participant.dateInscription),
        avatar: this.getInitials(participant.nom)
      });
    });

    this.recentActivity = activities.slice(0, 4);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  getTimeAgo(date: string): string {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'1h';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays}j`;
  }

  exportData() {
    const data = {
      stats: this.stats,
      participants: this.participants,
      textes: this.textes,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cp2i-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  sendAnnouncement() {
    const message = {
      expediteur: 'Admin Principal',
      destinataire: 'Tous les participants',
      sujet: 'Nouvelle annonce',
      contenu: 'Message d\'information important...',
      dateEnvoi: new Date().toISOString().split('T')[0],
      lu: false,
      type: 'info' as const
    };
    
    this.dashboardService.addMessage(message);
    alert('Annonce envoyée à tous les participants!');
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