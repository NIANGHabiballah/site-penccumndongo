import { Component } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateService } from '@ngx-translate/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterModule } from '@angular/router';
import { routes } from '../../app.routes';
import { CommonModule } from '@angular/common';


export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    TranslateModule,
    RouterModule,
    CommonModule,

  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})

export class HeaderComponent { 
  
  activeSection: string = 'accueil';
  menuOpen = false;


   constructor(public translate: TranslateService, public router: Router) {
    translate.addLangs(['fr', 'en']);
    translate.setDefaultLang('fr');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang && browserLang.match(/fr|en/) ? browserLang : 'fr');

    // Écoute le scroll pour détecter la section visible
    window.addEventListener('scroll', () => this.updateActiveSection());
  }

  setLang(lang: string) {
    this.translate.use(lang);
  }

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
  }

}
