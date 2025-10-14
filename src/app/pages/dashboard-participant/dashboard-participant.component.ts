import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-participant',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-participant.component.html',
  styleUrls: ['./dashboard-participant.component.css']
})
export class DashboardParticipantComponent implements OnInit {
  mesSoumissions: any[] = [];
  stats = { soumises: 0, enCours: 0, corrigees: 0 };
  mobileMenuOpen = false;
  desktopMenuHidden = false;
  chatOpen = false;

  ngOnInit() {
    this.chargerSoumissions();
  }

  chargerSoumissions() {
    this.mesSoumissions = [
      { id: 1, titre: 'L\'espoir d\'un avenir meilleur', statut: 'corrige', note: 16 },
      { id: 2, titre: 'Mon rêve africain', statut: 'en_cours' }
    ];
    this.calculerStats();
  }

  calculerStats() {
    this.stats.soumises = this.mesSoumissions.length;
    this.stats.enCours = this.mesSoumissions.filter(t => t.statut === 'en_cours').length;
    this.stats.corrigees = this.mesSoumissions.filter(t => t.statut === 'corrige').length;
  }

  nouvellesoumission() {
    console.log('Nouvelle soumission');
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

  closeChat() {
    this.chatOpen = false;
  }
}