import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface GraphicProject {
  id: number;
  title: string;
  image: string;
  category: string;
  downloadUrl?: string;
}

@Component({
  selector: 'app-design-graphique',
  imports: [CommonModule],
  templateUrl: './design-graphique.component.html',
  styleUrl: './design-graphique.component.css'
})
export class DesignGraphiqueComponent {
  showLightbox = false;
  selectedProject: GraphicProject | null = null;

  // Images des conceptions graphiques de la page d'accueil
  graphicProjects: GraphicProject[] = [
    // === AFFICHES ===
    {
      id: 1,
      title: 'Formation Professionnelle - PENC\'BOOST',
      image: 'postmadiop.jpeg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/postmadiop.jpeg'
    },
    {
      id: 2,
      title: 'Affiche Lundi d\'inspiration - Tafsir Haby NIANG',
      image: 'pubposttafsir.jpeg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/pubposttafsir.jpeg'
    },
    {
      id: 3,
      title: 'Souhait meilleurs vœux de Réussite au BFEM - Post AMEN',
      image: 'bacbfem.jpg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/bacbfem.jpg'
    },
    {
      id: 4,
      title: '48H Journées Culturelles - Lycée Franco-Arabe',
      image: 'affiches.jpg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/affiches.jpg'
    },
    {
      id: 5,
      title: 'Lancement Wébinaire - Collectif des Coachs Professionnel du Sénégal et d\'Ailleurs',
      image: 'Web0.jpg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/Web0.jpg'
    },
    {
      id: 6,
      title: 'Lancement Officiel - Site Web Penccum Ndongo',
      image: 'LancementOfficielSiteWebPenccumNdongo.jpg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/LancementOfficielSiteWebPenccumNdongo.jpg'
    },
    {
      id: 7,
      title: 'Services PENCCUM NDONGO - Post',
      image: 'PN.jpg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/PN.jpg'
    },
    {
      id: 8,
      title: 'Lettre de Remerciements - Cérémonie CP2i ÉDITION 2',
      image: 'remerciements.jpg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/remerciements.jpg'
    },
    {
      id: 9,
      title: 'Annonce d\'Activité - Action Verte',
      image: 'ActionVerteDemette.jpg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/ActionVerteDemette.jpg'
    },
    {
      id: 10,
      title: 'Entreprise Baye Awa DIOP Agri - Produits Agricoles',
      image: 'BayeawadiopAGRI.jpg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/BayeawadiopAGRI.jpg'
    },
    {
      id: 11,
      title: 'Chronogramme Cérémonie de Remise Des Prix - CP2i',
      image: 'ChronogrammeCp2i.jpeg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/ChronogrammeCp2i.jpeg'
    },
    {
      id: 12,
      title: 'J\'y Serai - Préparation Cérémonie CP2i',
      image: 'JySeraiCp2i.jpeg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/AJySeraiCp2i.jpeg'
    },
    {
      id: 19,
      title: 'Quatrième de Couverture d\'Un Recueil de Poème - Vers Croisés',
      image: 'QuatrièmeCouvertureRecueildePoème.jpeg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/QuatrièmeCouvertureRecueildePoème.jpeg'
    },

    // === DÉPLIANTS ===
    {
      id: 13,
      title: 'Dépliant Publicitaire Two-fold - COSDEN',
      image: 'Depliant.jpg',
      category: 'Dépliants',
      downloadUrl: 'https://penccumndongo.com/Depliant.jpg'
    },
    {
      id: 14,
      title: 'Dépliant de Programme Evennementiel - COSDEN',
      image: 'COSDENDépliant.jpg',
      category: 'Dépliants',
      downloadUrl: 'https://penccumndongo.com/COSDENDépliant.jpg'
    },

    // === BANNIÈRES ===
    {
      id: 16,
      title: 'Bannière Promotionnelle WUDERE - COMMERCE',
      image: 'Bannière-Wudere.jpg',
      category: 'Bannières',
      downloadUrl: 'https://penccumndongo.com/Bannière-Wudere.jpg'
    },
    {
      id: 18,
      title: 'Banière de Couverture - Niandane Nawet Foot',
      image: 'NNFBagn.jpg',
      category: 'Bannières',
      downloadUrl: 'https://penccumndongo.com/NNFBagn.jpg'
    },
    {
      id: 27,
      title: 'Bâche Publicitaire - Sall Lamtoro Business',
      image: 'SALLLAMTOROBUSINESS-bache.jpg',
      category: 'Bannières',
      downloadUrl: 'https://penccumndongo.com/SALLLAMTOROBUSINESS-bache.jpg'
    },

    // === LOGOS ===
    {
      id: 17,
      title: 'Logo Professionnel - DOLEL DEBBO CULTURES URBAINES',
      image: 'doleldebbologo.jpg',
      category: 'Logos',
      downloadUrl: 'https://penccumndongo.com/doleldebbologo.jpg'
    },
    {
      id: 20,
      title: 'Logo Seye Teranga Shop - Vente En Ligne',
      image: 'Logo-SeyeTerangaShop.png',
      category: 'Logos',
      downloadUrl: 'https://penccumndongo.com/Logo-SeyeTerangaShop.png'
    },
    {
      id: 21,
      title: 'Identité Visuelle M7 Dakar - Vente de Tenue de Luxe',
      image: 'logoM7.jpg',
      category: 'Logos',
      downloadUrl: 'https://penccumndongo.com/logoM7.jpg'
    },
    {
      id: 22,
      title: 'Logo Zaza Agency',
      image: 'ZazaAgency-logo.png',
      category: 'Logos',
      downloadUrl: 'https://penccumndongo.com/ZazaAgency-logo.png'
    },
    {
      id: 23,
      title: 'Logo NICONS - Services BTP',
      image: 'P5.png',
      category: 'Logos',
      downloadUrl: 'https://penccumndongo.com/P5.png'
    },
    {
      id: 24,
      title: 'Logo WUDERE - COMMERCE',
      image: 'P6.jpg',
      category: 'Logos',
      downloadUrl: 'https://penccumndongo.com/P6.jpg'
    },
    {
      id: 25,
      title: 'Logo PENC\'BOOST - Formations Professionnelles',
      image: 'penccboost.png',
      category: 'Logos',
      downloadUrl: 'https://penccumndongo.com/penccboost.png'
    },
    {
      id: 26,
      title: 'Équipe de Football - ASC MAYALLA',
      image: 'logoASCMayalla.jpeg',
      category: 'Logos',
      downloadUrl: 'https://penccumndongo.com/logoASCMayalla.jpeg'
    },

    // === MOCKUPS ===
    {
      id: 28,
      title: 'Design Casquette Personnalisée - PENCCUM NDONGO',
      image: 'casquette.jpg',
      category: 'Mockups',
      downloadUrl: 'https://penccumndongo.com/casquette.jpg'
    },
    {
      id: 29,
      title: 'Design Chapeau Personnalisé - M7 DAKAR',
      image: 'chap.jpg',
      category: 'Mockups',
      downloadUrl: 'https://penccumndongo.com/chap.jpg'
    },
    {
      id: 30,
      title: 'Mockups Polo - Cérémonie CP2i',
      image: 'PoloCérémonieCP2i.jpeg',
      category: 'Mockups',
      downloadUrl: 'https://penccumndongo.com/PoloCérémonieCP2i.jpeg'
    },

    // === KAKEMONOS ===
    {
      id: 31,
      title: 'Kakemono de Présentation de Services - NiangayBaanaane',
      image: 'Kakemono-NiangayBanane.jpg',
      category: 'Kakemonos',
      downloadUrl: 'https://penccumndongo.com/Kakemono-NiangayBanane.jpg'
    }
  ];

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  openLightbox(project: GraphicProject): void {
    this.selectedProject = project;
    this.showLightbox = true;
  }

  closeLightbox(): void {
    this.showLightbox = false;
    this.selectedProject = null;
  }

  activeCategory = 'all';

  filterPortfolio(category: string): void {
    this.activeCategory = category;
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    portfolioItems.forEach(item => {
      const itemElement = item as HTMLElement;
      if (category === 'all' || itemElement.dataset['category'] === category) {
        itemElement.style.display = 'block';
      } else {
        itemElement.style.display = 'none';
      }
    });
  }

  // Détermine la classe CSS appropriée selon le type d'image
  getImageStyleClass(project: GraphicProject | null): string {
    if (!project) return 'default-style';
    
    const category = project.category.toLowerCase();
    const title = project.title.toLowerCase();
    
    if (category.includes('bannière') || category.includes('bâche') || title.includes('bannière') || title.includes('bâche')) {
      return 'banner-style';
    }
    
    if (category.includes('affiche') || title.includes('affiche') || title.includes('kakemono')) {
      return 'poster-style';
    }
    
    if (category.includes('dépliant') || title.includes('dépliant') || title.includes('mockup') || title.includes('polo') || title.includes('casquette')) {
      return 'flyer-style';
    }
    
    if (category.includes('logo') || title.includes('logo')) {
      return 'logo-style';
    }
    
    return 'default-style';
  }

  // Ajustement dynamique basé sur les dimensions réelles de l'image
  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    
    if (aspectRatio > 2.5) {
      img.className = img.className.replace(/\b\w+-style\b/, 'banner-style');
    } else if (aspectRatio < 0.7) {
      img.className = img.className.replace(/\b\w+-style\b/, 'poster-style');
    } else if (aspectRatio >= 0.8 && aspectRatio <= 1.2) {
      if (!img.className.includes('logo-style')) {
        img.className = img.className.replace(/\b\w+-style\b/, 'flyer-style');
      }
    }
  }
}