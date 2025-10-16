import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Cp2iApiService, User } from '../../services/cp2i-api.service';
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
  currentUser: User | null = null;

  constructor(
    private cp2iService: Cp2iService,
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
    
    this.loadProfile();
    this.chargerTextes();
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

  logout() {
    this.cp2iApi.logout();
    this.router.navigate(['/cp2i']);
  }

  closeMobileMenuOnLeave() {
    if (window.innerWidth <= 768) {
      this.mobileMenuOpen = false;
    }
  }
}