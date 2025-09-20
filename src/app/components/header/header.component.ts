import { Component } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
// ngx-translate supprimé
import { Router, NavigationEnd } from '@angular/router';
import { RouterModule } from '@angular/router';
import { routes } from '../../app.routes';
import { CommonModule } from '@angular/common';




@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})

export class HeaderComponent { 
  
  activeSection: string = 'accueil';
  menuOpen = false;
  showDropdown = false;


   constructor(public router: Router) {
    // Écoute le scroll pour détecter la section visible
    window.addEventListener('scroll', () => this.updateActiveSection());
  }

  // Méthode setLang supprimée (plus de traduction)

  scrollToSection(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      this.activeSection = sectionId;
    }
  }

// Section Active
  updateActiveSection() {
  const sections = ['accueil', 'services', 'portfolio', 'news', 'contact'];
  let found = false;
  for (const id of sections) {
    const el = document.getElementById(id);
    if (el) {
      const rect = el.getBoundingClientRect();
      // Ajuste la valeur 100 selon la hauteur de ton header
      if (rect.top <= 100 && rect.bottom > 100) {
        this.activeSection = id;
        found = true;
        break;
      }
    }
  }
  // Si aucune section n'est trouvée (ex: sur une autre page), désactive tout
  if (!found) {
    this.activeSection = '';
  }
}

  // Adaptabilité du menu
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
      // Ferme le dropdown si le menu est fermé
    if (!this.menuOpen) {
      this.showDropdown = false;
    }
  }

  closeMenuOnClick() {
  if (window.innerWidth <= 900) {
    this.menuOpen = false;
  }
}

 // Ajoute cette méthode pour fermer le menu hamburger quand on quitte la zone
  closeMenuOnMouseLeave() {
    if (window.innerWidth <= 900 && this.menuOpen) {
      this.menuOpen = false;
      this.showDropdown = false;
    }
  }

    toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  onDropdownHover(state: boolean) {
  // Sur desktop uniquement
  if (window.innerWidth > 900) {
    this.showDropdown = state;
  }
}

toggleDropdownMobile(event: Event) {
  // Sur mobile uniquement
  if (window.innerWidth <= 900) {
    event.preventDefault(); // Empêche le scroll en haut de page
    this.showDropdown = !this.showDropdown;
  }
 }
}
