import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule]
})
export class FooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Initialisation du composant
  }

  /**
   * Fait défiler la page vers une section spécifique
   * @param sectionId L'ID de la section vers laquelle défiler
   */
  scrollToSection(sectionId: string): void {
    try {
      const element = document.getElementById(sectionId);
      if (element) {
        // Défilement fluide vers la section
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      } else {
        // Si la section n'existe pas, rediriger vers l'accueil seulement si on n'est pas déjà sur une page spécifique
        const currentUrl = this.router.url;
        if (currentUrl === '/' || currentUrl === '/accueil') {
          // On est déjà sur l'accueil, pas besoin de rediriger
          return;
        }
        
        // Rediriger vers l'accueil seulement pour les pages qui n'ont pas ces sections
        // Exclure explicitement toutes les pages système de toute redirection automatique
        if (!currentUrl.includes('cp2i') && 
            !currentUrl.includes('dashboard') && 
            !currentUrl.includes('auth') && 
            currentUrl !== '/cp2i' &&
            !currentUrl.startsWith('/dashboard-')) {
          this.router.navigate(['/']).then(() => {
            setTimeout(() => {
              const targetElement = document.getElementById(sectionId);
              if (targetElement) {
                targetElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                  inline: 'nearest'
                });
              }
            }, 500);
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors du défilement vers la section:', error);
    }
  }

  /**
   * Ouvre un lien externe de manière sécurisée
   * @param url L'URL à ouvrir
   */
  openExternalLink(url: string): void {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du lien externe:', error);
    }
  }

  /**
   * Gère le clic sur les liens de contact
   * @param type Le type de contact (email, phone)
   * @param value La valeur du contact
   */
  handleContactClick(type: 'email' | 'phone', value: string): void {
    try {
      let link: string;
      
      switch (type) {
        case 'email':
          link = `mailto:${value}`;
          break;
        case 'phone':
          // Nettoyer le numéro de téléphone pour le lien tel:
          const cleanPhone = value.replace(/[^\d+]/g, '');
          link = `tel:${cleanPhone}`;
          break;
        default:
          return;
      }
      
      window.location.href = link;
    } catch (error) {
      console.error('Erreur lors du traitement du contact:', error);
    }
  }

  /**
   * Copie les informations de contact dans le presse-papiers
   * @param text Le texte à copier
   */
  async copyToClipboard(text: string): Promise<void> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        console.log('Texte copié dans le presse-papiers');
        // Ici vous pourriez ajouter une notification toast
      } else {
        // Fallback pour les navigateurs plus anciens
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        return new Promise((resolve, reject) => {
          document.execCommand('copy') ? resolve() : reject();
          textArea.remove();
        });
      }
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  }

  /**
   * Gère les erreurs de chargement d'images
   * @param event L'événement d'erreur
   */
  onImageError(event: any): void {
    // Remplacer par une image par défaut en cas d'erreur
    event.target.src = 'assets/images/default-logo.png';
    console.warn('Erreur de chargement de l\'image du logo');
  }

  /**
   * Vérifie si un lien est externe
   * @param url L'URL à vérifier
   * @returns true si le lien est externe
   */
  isExternalLink(url: string): boolean {
    try {
      const link = new URL(url, window.location.origin);
      return link.origin !== window.location.origin;
    } catch {
      return false;
    }
  }

  /**
   * Gère le suivi des clics sur les liens sociaux pour l'analytics
   * @param platform La plateforme sociale
   */
  trackSocialClick(platform: string): void {
    try {
      // Ici vous pourriez intégrer Google Analytics ou autre
      console.log(`Clic sur ${platform}`);
      
      // Exemple d'intégration GA4:
      // gtag('event', 'social_click', {
      //   platform: platform,
      //   location: 'footer'
      // });
    } catch (error) {
      console.error('Erreur lors du suivi du clic social:', error);
    }
  }

  /**
   * Fait défiler la page vers le haut
   */
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}