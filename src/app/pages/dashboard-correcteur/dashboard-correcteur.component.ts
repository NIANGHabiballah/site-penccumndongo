import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Cp2iService, Texte } from '../../services/cp2i.service';

@Component({
  selector: 'app-dashboard-correcteur',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-correcteur.component.html',
  styleUrls: ['./dashboard-correcteur.component.css']
})
export class DashboardCorrecteurComponent implements OnInit {
  textesAssignes: Texte[] = [];
  stats = { assignes: 0, corriges: 0, enCours: 0 };
  mobileMenuOpen = false;
  desktopMenuHidden = false;

  constructor(private cp2iService: Cp2iService) {}

  ngOnInit() {
    this.chargerTextes();
  }

  chargerTextes() {
    this.cp2iService.getTextes().subscribe(textes => {
      this.textesAssignes = textes.filter(t => t.correcteurId === 1);
      this.calculerStats();
    });
  }

  calculerStats() {
    this.stats.assignes = this.textesAssignes.length;
    this.stats.corriges = this.textesAssignes.filter(t => t.statut === 'corrige').length;
    this.stats.enCours = this.textesAssignes.filter(t => t.statut === 'en_cours').length;
  }

  commencerCorrection(texte: Texte) {
    console.log('Commencer correction:', texte);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleDesktopMenu() {
    this.desktopMenuHidden = !this.desktopMenuHidden;
  }
}