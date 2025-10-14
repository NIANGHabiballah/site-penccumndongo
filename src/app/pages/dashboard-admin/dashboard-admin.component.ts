import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Cp2iService, Statistiques } from '../../services/cp2i.service';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit {
  mobileMenuOpen = false;
  desktopMenuHidden = false;
  
  stats: Statistiques = {
    participants: 0,
    correcteurs: 0,
    textesTotal: 0,
    textesEnAttente: 0,
    textesCorrigees: 0,
    tauxProgression: 0
  };

  recentActivities = [
    { type: 'inscription', message: 'Nouveau participant: Aminata Diallo', time: '2 min' },
    { type: 'correction', message: 'Texte corrigé par Pr. Sow', time: '15 min' },
    { type: 'soumission', message: 'Nouveau texte soumis', time: '1h' }
  ];

  constructor(private cp2iService: Cp2iService) {}

  ngOnInit() {
    this.chargerStatistiques();
  }

  chargerStatistiques() {
    this.cp2iService.getStatistiques().subscribe(stats => {
      this.stats = stats;
    });
  }

  exportData() {
    console.log('Export des données...');
  }

  sendAnnouncement() {
    this.cp2iService.envoyerNotification('tous', 'Nouvelle annonce importante du concours CP2i');
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleDesktopMenu() {
    this.desktopMenuHidden = !this.desktopMenuHidden;
  }
}