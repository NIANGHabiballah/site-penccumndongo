// Déclaration globale pour gtag (Google Analytics)
declare let gtag: Function;
import { AfterViewInit, Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BannerComponent } from '../../components/banner/banner.component';
import { RecaptchaModule } from 'ng-recaptcha';
import { trigger, state, style, transition, animate, query, stagger, keyframes } from '@angular/animations';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
interface Article {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  date: Date;
  author: string;
  category: string;
  linkedinUrl: string;
  featured?: boolean;
}

interface Testimonial {
  photo: string;
  text: string;
  nom: string;
  titre: string;
}

interface WebProject {
  id: number;
  title: string;
  image: string;
  url: string;
  category: 'vitre' | 'ecommerce' | 'onepage' | 'refontes';
}

interface GraphicProject {
  id: number;
  title: string;
  image: string;
  category: string;
  downloadUrl?: string;
}

// Ajoute cette ligne en haut de ton fichier (après les interfaces)
type WebTab = 'vitre' | 'ecommerce' | 'onepage' | 'refontes';

  export const portfolioAnimations = [
  // Animation d'apparition pour les éléments
  trigger('fadeIn', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(30px)' }),
      animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
    ])
  ]),

  // Animation pour la grille du portfolio
  trigger('staggerIn', [
    transition('* => *', [
      query(':enter', [
        style({ opacity: 0, transform: 'translateY(50px) scale(0.8)' }),
        stagger(100, [
          animate('0.8s cubic-bezier(0.4, 0, 0.2, 1)', 
            style({ opacity: 1, transform: 'translateY(0) scale(1)' })
          )
        ])
      ], { optional: true })
    ])
  ]),

  // Animation pour l'ouverture de la modal
  trigger('modalAnimation', [
    transition(':enter', [
      style({ 
        opacity: 0,
        transform: 'scale(0.8)',
        backdropFilter: 'blur(0px)'
      }),
      animate('0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
        style({ 
          opacity: 1,
          transform: 'scale(1)',
          backdropFilter: 'blur(20px)'
        })
      )
    ]),
    transition(':leave', [
      animate('0.3s ease-in', 
        style({ 
          opacity: 0,
          transform: 'scale(0.9)',
          backdropFilter: 'blur(0px)'
        })
      )
    ])
  ]),

  // Animation pour le changement d'image dans la galerie
  trigger('slideImage', [
    transition('* => *', [
      animate('0.4s ease-in-out', keyframes([
        style({ transform: 'translateX(0)', opacity: 1, offset: 0 }),
        style({ transform: 'translateX(-20px)', opacity: 0.7, offset: 0.5 }),
        style({ transform: 'translateX(0)', opacity: 1, offset: 1 })
      ]))
    ])
  ]),

  // Animation pour les boutons de catégorie
  trigger('buttonHover', [
    state('normal', style({ transform: 'scale(1)' })),
    state('hover', style({ transform: 'scale(1.05)' })),
    transition('normal <=> hover', animate('0.2s ease-in-out'))
  ]),

  // Animation pour les contrôles de la galerie
  trigger('controlsSlide', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(-20px)' }),
      animate('0.3s 0.2s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
    ])
  ]),

  // Animation pour les miniatures
  trigger('thumbnailsSlide', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      animate('0.3s 0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
    ])
  ])
];

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, BannerComponent, RecaptchaModule, RouterModule
  ],


 animations: [
    // Animation fadeIn
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('350ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    // Portfolio animations
    ...portfolioAnimations,

    // Animation fadeInUp pour l'en-tête
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      state('in', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('void => *', [
        style({ opacity: 0, transform: 'translateY(50px)' }),
        animate('0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)')
      ])
    ]),

    // Animation slideInUp pour les cartes
    trigger('slideInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(50px) scale(0.9)' }),
        animate('{{delay}} 500ms cubic-bezier(0.4, 0, 0.2, 1)', 
          style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ])
    ]),

    // Animation fadeIn simple
    trigger('fadeInSimple', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('800ms 400ms ease-out', style({ opacity: 1 }))
      ])
    ]),

    // Animation de stagger pour les témoignages
    trigger('staggerAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(50px)' }),
          stagger(200, [
            animate('0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)', 
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),

        // Animation hover pour les cards témoignages
    trigger('cardHover', [
      state('normal', style({ transform: 'translateY(0) scale(1)' })),
      state('hovered', style({ transform: 'translateY(-10px) scale(1.02)' })),
      transition('normal <=> hovered', animate('0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'))
    ])
  ]
})


export class AccueilComponent implements OnInit, OnDestroy, AfterViewInit{

  // --- Actualités ---
  articles: Article[] = [
    {
      id: 1,
      title: "Mawlid Moubarak !",
      excerpt: "\n\nÀ l’occasion du Mawlid, nous adressons nos prières et nos vœux de paix, de santé et de prospérité à toute la communauté musulmane.\n\n \n\nQue cette célébration soit une source de lumière, d’amour et de miséricorde pour chacun d’entre nous.\n\nPenccum Ndongo souhaite à toutes et à tous un Bon Mawlid !\n\n#mawlid #penccumndongo",      image: "mawlid2025.jpeg",
      date: new Date('2025-09-03'),
      author: "Penccun Ndongo",
      category: "EVENNEMENT",
      linkedinUrl: "https://www.linkedin.com/posts/penccum-ndongo_mawlid-penccumndongo-activity-7369101274895654916-Iw2Y?utm_source=share&utm_medium=member_desktop&rcm=ACoAADqQAssBElpPsDolAtxkZ86cX_61QT4D7ZA",
      featured: true
    },
    {
      id: 2,
      title: "Lundi d'inspiration - Se #cultiver, c’est se libérer !",
      excerpt: "L’ignorance est une chaîne silencieuse. Elle alimente la peur, nourrit la haine et finit par engendrer la violence. #lundidinspiration #secultiver #education #savoirpouvoirpaix #initiativecourageaction",
      image: "pubposttafsir.jpeg",
      date: new Date('2024-12-13'),
      author: "Équipe Événementiel",
      category: "ÉVÉNEMENT",
      linkedinUrl: "https://www.linkedin.com/feed/update/urn:li:activity:7353041884056907776"
    },
    {
      id: 3,
      title: "#OPPORTUNITE DE SE FORMER AVEC PENC’BOOST ",
      excerpt: "J-2 avant le démarrage ! Les sessions commencent ce lundi 21 juillet, pour une semaine complète de formation, du 21 au 27 juillet. ! #pencboost #formation #penccumndongo",
      image: "postmadiop.jpeg",
      date: new Date('2025-07-19'),
      author: "Penccum Ndongo",
      category: "FORMATION", 
      linkedinUrl: "https://www.linkedin.com/feed/update/urn:li:activity:7352326292681179137"
    },
    {
      id: 4,
      title: "#Emission Évi #Weekend – Invité Tafsir Haby NIANG !",
      excerpt: "Ce samedi 21 juin 2025, j’ai eu le plaisir de participer à l’émission Évi Weekend, diffusée en direct sur Evidence TV. À très bientôt pour d’autres aventures humaines et inspirantes. — Tafsir Haby Niang #eviweekend #evidencetv",
      image: "emissiontafsir.png",
      date: new Date('2025-06-23'),
      author: "Direction Générale",
      category: "EMISSION",
      linkedinUrl: "https://www.linkedin.com/feed/update/urn:li:activity:7342796778259292160"
    }
  ];

  ngOnInit(): void {
    this.startAutoSlide();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.loadArticles();
  }

  /**
   * Charge les articles (peut être remplacé par un appel à un service)
   */
  private loadArticles(): void {
    // Simulation d'un chargement d'articles
    // Dans un cas réel, vous feriez appel à un service HTTP
    console.log('Articles chargés:', this.articles.length);
  }

  /**
   * Redirige vers le post LinkedIn correspondant
   * @param linkedinUrl URL du post LinkedIn
   */
  redirectToLinkedIn(linkedinUrl: string): void {
    if (linkedinUrl) {
      // Ouvre le lien dans un nouvel onglet
      window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
      // Analytics - optionnel
      this.trackArticleClick(linkedinUrl);
    }
  }

  /**
   * Affiche toutes les actualités (redirection vers une page dédiée)
   */
  viewAllNews(): void {
    // Ici vous pourriez naviguer vers une page dédiée aux actualités
    // ou charger plus d'articles
    console.log('Affichage de toutes les actualités');
    // Exemple de navigation (nécessite Router d'Angular)
    // this.router.navigate(['/actualites']);
    // Ou ouverture du profil LinkedIn de l'entreprise
    window.open('https://www.linkedin.com/company/104744149/', '_blank', 'noopener,noreferrer');
  }

  /**
   * Suivi des clics sur les articles (pour les analytics)
   * @param linkedinUrl URL cliquée
   */
  private trackArticleClick(linkedinUrl: string): void {
    // Implémentation du tracking des clics
    // Peut utiliser Google Analytics, Adobe Analytics, etc.
    console.log('Article cliqué:', linkedinUrl);
    // Exemple avec Google Analytics (gtag)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'click', {
        event_category: 'actualites',
        event_label: linkedinUrl,
        value: 1
      });
    }
  }

  /**
   * Formate la date pour l'affichage
   * @param date Date à formater
   * @returns Date formatée en français
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  /**
   * Tronque le texte si nécessaire
   * @param text Texte à tronquer
   * @param limit Limite de caractères
   * @returns Texte tronqué avec ellipses
   */
  truncateText(text: string, limit: number = 150): string {
    if (text.length <= limit) {
      return text;
    }
    return text.substring(0, limit).trim() + '...';
  }

  /**
   * Retourne la classe CSS pour la catégorie
   * @param category Catégorie de l'article
   * @returns Classe CSS
   */
  getCategoryClass(category: string): string {
    return category.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Vérifie si l'article est récent (moins de 30 jours)
   * @param date Date de l'article
   * @returns true si l'article est récent
   */
  isRecentArticle(date: Date): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date > thirtyDaysAgo;
  }



  
  ngAfterViewInit() {
    if (this.countersAnimated) return; // Empêche de relancer l'animation
    this.countersAnimated = true;
    this.animateNumbers();

    // WhatsApp floating icon logic
    const whatsappFloat = document.getElementById('whatsapp-float');
    const whatsappIcon = document.querySelector('.whatsapp-icon');
    const whatsappText = document.getElementById('whatsapp-text');
    const whatsappLink = document.getElementById('whatsapp-link');
    if (whatsappIcon && whatsappFloat && whatsappText && whatsappLink) {
      whatsappIcon.addEventListener('click', (e) => {
        e.preventDefault();
        whatsappFloat.classList.toggle('active');
        if (whatsappFloat.classList.contains('active')) {
          whatsappText.style.display = 'inline-block';
        } else {
          whatsappText.style.display = 'none';
        }
      });
      whatsappText.addEventListener('click', () => {
        window.open(whatsappLink.getAttribute('href')!, '_blank');
      });
    }
  }
  
  contactData = {
    firstname: '',
    lastname: '',
    phone: '',
    email: '',
    company: '',
    message: ''
  };

  captchaResolved = false;
  captchaToken: string = '';
  successMsg = '';
  errorMsg = '';
  
  onCaptchaResolved(response: string | null) {
    this.captchaResolved = !!response;
    this.captchaToken = response ?? '';
  }

 // Vision/Mission tabs
  activeTab: 'mission' | 'vision' = 'mission';
  setTab(tab: 'mission' | 'vision') {
      this.activeTab = tab;
    }

constructor(private http: HttpClient) {}

onSubmit() {
  this.successMsg = '';
  this.errorMsg = '';

  const dataToSend = {
    ...this.contactData,
    'g-recaptcha-response': this.captchaToken
  };

  this.http.post<{success: boolean, message: string}>('https://penccumndongo.com/contact.php', dataToSend)
    .subscribe({
      next: (res) => {
        if (res.success) {
          this.successMsg = 'Votre message a bien été envoyé !';
          this.contactData = { firstname: '', lastname: '', phone: '', email: '', company: '', message: '' };
          this.captchaResolved = false;
        } else {
          this.errorMsg = res.message;
        }
      },
      error: (err) => {
        this.errorMsg = "Erreur lors de l\'envoi du message.";
        console.error(err);
      }
    });
}

private countersAnimated = false;


animateNumbers() {
  const elements = document.querySelectorAll('.number');
  elements.forEach((el: any) => {
    const target = +el.getAttribute('data-target');
    let count = 0;
    const increment = Math.ceil(target / 50);

    const update = () => {
      count += increment;
      if (count >= target) {
        el.textContent = target;
      } else {
        el.textContent = count;
        requestAnimationFrame(update);
      }
    };
    update();
  });
}

  ngOnDestroy() {
   
    this.stopAutoSlide();
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }


  // Témoignages 

temoignages: Testimonial[] = [
    {
      photo: 'PMN.enc',
      text: `"C'est avec une grande joie, une profonde satisfaction et beaucoup de gratitude que nous vous adressons ces mots.
      Nous sommes réellement très satisfaits de vos réalisations, que nous apprécions sincèrement.
      Nous avons reçu plusieurs travaux de votre part qui témoignent de votre engagement, de votre professionnalisme et de votre parfaite maîtrise.
      Nous vous exprimons toute notre reconnaissance et vous encourageons vivement à poursuivre dans cette voie.
      Penccum Ndongo – Sa Kaw, Sa Kanam"`,
      nom: 'Pape Malick NIANG',
      titre: 'Directeur Exécutif Mourchid Services'
    },
    {
      photo: 'bibs_vision.jpg',
      text: `"Nous tenons à vous remercier sincèrement pour votre précieuse collaboration.
      Votre engagement et votre professionnalisme ont grandement contribué au succès de cette événement.
      Nous espérons pouvoir poursuivre cette belle dynamique et renforcer notre partenariat dans les mois à venir.
      Bien cordialement  Pencum ndongo for ever"`,
      nom: 'Abiboulaye DIOP',
      titre: 'Fondateur de Télé Niandane TV'
    },
    {
      photo: 'bd.jpg',
      text: `"Je suis extrêmement satisfait des services de PENCUM NONGO ! Ils ont réalisé le logo de mon entreprise NICONS,
      mes cartes de visite et des affiches publicitaires avec une qualité exceptionnelle. Leur professionnalisme,
      leur créativité et leur réactivité ont dépassé mes attentes. Je recommande vivement PENCUM NONGO pour tou
      vos besoins en design graphique.
      Merci pour votre excellent travail !"`,
      nom: 'Abdourahmane NIANG',
      titre: 'Fondateur & DG de NICONS'
    }
  ];

  hoveredCard: number | null = null;


currentIndex = 0;
intervalId: any;

 onCardHover(index: number): void {
    this.hoveredCard = index;
  }

  onCardLeave(): void {
    this.hoveredCard = null;
  }

  getCardState(index: number): string {
    return this.hoveredCard === index ? 'hovered' : 'normal';
  }
  
// Ajoute cette méthode pour stopper le défilement automatique des témoignages
stopAutoSlide() {
  if (this.intervalId) {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }
}

onImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src = 'default-avatar.jpg';
}

// Ajoute aussi la méthode pour démarrer le défilement automatique si besoin
startAutoSlide() {
  this.stopAutoSlide();
  this.intervalId = setInterval(() => {
    this.nextSlide();
  }, 7000); // Change le délai si besoin (ici 7 secondes)
}


  goToSlide(index: number) {
    this.currentIndex = index;
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex === 0)
      ? this.temoignages.length - 1
      : this.currentIndex - 1;
  }

  nextSlide() {
    this.currentIndex = (this.currentIndex === this.temoignages.length - 1)
      ? 0
      : this.currentIndex + 1;
  }

  scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

scrollToBottom() {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}








 // État des onglets pour les réalisations web
// Utilise le type WebTab pour la variable et la méthode
activeWebTab: WebTab = 'ecommerce';  
  
webTabs: WebTab[] = ['vitre', 'ecommerce', 'onepage', 'refontes'];

// État de la lightbox
  isLightboxOpen = false;
  selectedGraphic: GraphicProject | null = null;

  // Projets web organisés par catégories
  webProjects: WebProject[] = [
    // E-Commerce
    {
      id: 1,
      title: 'Site Web de l\'Agence Penccum Ndongo',
      image: 'sitewebPenccumNdongo.png',
      url: 'https:/penccumndongo.com',
      category: 'vitre'
    },
    {
      id: 2,
      title: 'Site Web de l\'Agence Penccum Ndongo',
      image: 'sitewebPenccumNdongo.png',
      url: 'https:/penccumndongo.com',
      category: 'ecommerce'
    },
    {
      id: 3,
      title: 'Site Web de l\'Agence Penccum Ndongo',
      image: 'sitewebPenccumNdongo.png',
      url: 'https:/penccumndongo.com',
      category: 'onepage'
    },
    {
      id: 4,
       title: 'Site Web de l\'Agence Penccum Ndongo',
      image: 'sitewebPenccumNdongo.png',
      url: 'https:/penccumndongo.com',
      category: 'refontes'
    },
    
  
  ];

  // Projets graphiques
  graphicProjects: GraphicProject[] = [
    {
      id: 1,
      title: 'Formation Professionnelle en Infographie - PENCCUM NDONGO',
      image: 'Formation-Infographie.jpg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/Formation-Infographie.jpg'
    },
    {
      id: 2,
      title: 'Formation Professionnelle - PENC\'BOOST',
      image: 'postmadiop.jpeg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/postmadiop.jpeg'
    },
    {
      id: 3,
      title: 'Logo Seye Teranga Shop - Vente En Ligne',
      image: 'Logo-SeyeTerangaShop.png',
      category: 'Logos',
      downloadUrl: 'https://penccumndongo.com/Logo-SeyeTerangaShop.png'
    },
    {
      id: 4,
      title: 'Identié Visuelle M7 Dakar - Vente de Tenue de Luxe',
      image: 'logoM7.jpg',
      category: 'Logos',
      downloadUrl: 'https://penccumndongo.com/logoM7.jpg'
    },
    {
      id: 5,
      title: 'Affiche Lundi d\inspiration - Tafsir Haby NIANG',
      image: 'pubposttafsir.jpeg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/pubposttafsir.jpeg'
    },
    {
      id: 6,
      title: 'Souhait meilleurs vœux de Réussite au BFEM - Post AMEN',
      image: 'bacbfem.jpg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/bacbfem.jpg'
    },
    {
      id: 7,
      title: 'Attestation Professionnelle De Reconnaissance - CP2i',
      image: 'Attestation.jpg',
      category: 'Attestations',
      downloadUrl: 'https://penccumndongo.com/Attestation.jpg'
    },
    {
      id: 8,
      title: '48H Journées Culturelles - Lycée Franco-Arabe',
      image: 'affiches.jpg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/affiches.jpg'
    },
    {
      id: 9,
      title: 'Design Badge Évènementiel - Cérémonie de Remise Des Prix CP2i',
      image: 'Badge.jpg',
      category: 'Badges',
      downloadUrl: 'https://penccumndongo.com/Badge.jpg'
    },
    {
      id: 10,
      title: 'Logo Zaza Agency',
      image: 'ZazaAgency-logo.png',
      category: 'Logos',
      downloadUrl: 'https://penccumndongo.com/ZazaAgency-logo.png'
    },
    {
      id: 11,
      title: 'Bannière Promotionnelle WUDERE - COMMERCE',
      image: 'Bannière-Wudere.jpg',
      category: 'Bannières',
      downloadUrl: 'https://penccumndongo.com/Bannière-Wudere.jpg'
    },
    {
      id: 25,
      title: 'Lancement Wébinaire - Collectif des Coachs Professionnel du Sénégal et d\'Ailleurs',
      image: 'Web0.jpg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/Web0.jpg'
    },
    {
      id: 13,
      title: 'Dépliant Publicitaire Two-fold - COSDEN',
      image: 'Depliant.jpg',
      category: 'Dépliants',
      downloadUrl: 'https://penccumndongo.com/Depliant.jpg'
    },
    {
      id: 14,
      title: 'Design Casquette Personnalisée - PENCCUM NDONGO',
      image: 'casquette.jpg',
      category: 'Mockups',
      downloadUrl: 'https://penccumndongo.com/casquette.jpg'
    },
    {
      id: 15,
      title: 'Design Chapeau Personnalisé - M7 DAKAR',
      image: 'chap.jpg',
      category: 'Mockups',
      downloadUrl: 'https://penccumndongo.com/chap.jpg'
    },
     {
      id: 16,
      title: 'Bâche Publicitaire - Sall Lamtoro Business',
      image: 'SALLLAMTOROBUSINESS-bache.jpg',
      category: 'Bâches',
      downloadUrl: 'https://penccumndongo.com/SALLLAMTOROBUSINESS-bache.jpg'
    },
     {
      id: 17,
      title: 'Lancement Officiel - Site Web Penccum Ndongo',
      image: 'LancementOfficielSiteWebPenccumNdongo.jpg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/LancementOfficielSiteWebPenccumNdongo.jpg'
    },
 {
      id: 18,
      title: 'Logo NICONS - Services BTP',
      image: 'P5.png',
      category: 'Logos',
      downloadUrl: 'https://penccumndongo.com/P5.png'
    },
     {
      id: 19,
      title: 'Logo WUDERE - COMMERCE',
      image: 'P6.jpg',
      category: 'Logos',
      downloadUrl: 'https://penccumndongo.com/P6.jpg'
    },
     {
      id: 20,
      title: 'Logo PENC\BOOST - Formations Professionelles',
      image: 'penccboost.png',
      category: 'Logos',
      downloadUrl: 'https://penccumndongo.com/penccboost.png'
    },
     {
      id: 21,
      title: 'Services PENCCUM NDONGO - Post',
      image: 'PN.jpg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/PN.jpg'
    },
     {
      id: 22,
      title: 'Lettre de Remerciements - Cérémonie CP2i ÉDITION 2 ',
      image: 'remerciements.jpg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/remerciements.jpg'
    },
     {
      id: 23,
      title: 'Logo Professionnel - DOLEL DEBBO CULTURES URBAINES',
      image: 'doleldebbologo.jpg',
      category: 'Bannières',
      downloadUrl: 'https://penccumndongo.com/doleldebbologo.jpg'
    },
     {
      id: 24,
      title: 'Wébinaire - Collectif des Coachs Professionnels du Sénégal et d\'Ailleurs',
      image: 'WEB.jpg',
      category: 'Affiches',
      downloadUrl: 'https://penccumndongo.com/WEB.jpg'
    },
    //  {
    //   id: 25,
    //   title: 'Lancement Wébinaire - Collectif des Coachs Professionnel du Sénégal et d\'Ailleurs',
    //   image: 'Web0.jpg',
    //   category: 'Affiches',
    //   downloadUrl: 'https://penccumndongo.com/Web0.jpg'
    // },
  ];

  // Obtenir les projets web filtrés
  get filteredWebProjects(): WebProject[] {
    return this.webProjects.filter(project => project.category === this.activeWebTab);
  }

  // Obtenir le label des onglets 
  getTabLabel(tab: string): string {
    const labels: { [key: string]: string } = {
      'vitre': 'Vitre 5-10 Pages',
      'ecommerce': 'E-Commerce',
      'onepage': 'One Page',
      'refontes': 'Refontes'
    };
    return labels[tab] || tab;
  }

  // Changer d'onglet
 setActiveTab(tab: WebTab): void {
  this.activeWebTab = tab;
}

  // Ouvrir un projet web
  openWebProject(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // Ouvrir la lightbox
  openLightbox(graphic: GraphicProject): void {
    this.selectedGraphic = graphic;
    this.isLightboxOpen = true;
    document.body.style.overflow = 'hidden';
  }

  // Fermer la lightbox
  closeLightbox(): void {
    this.isLightboxOpen = false;
    this.selectedGraphic = null;
    document.body.style.overflow = 'auto';
  }

  // Télécharger le fichier
  downloadGraphic(graphic: GraphicProject): void {
    if (graphic.downloadUrl) {
      const link = document.createElement('a');
      link.href = graphic.downloadUrl;
      link.download = `${graphic.title}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Partager le projet
  shareGraphic(graphic: GraphicProject): void {
    const shareData = {
      title: graphic.title,
      text: `Découvrez ce projet graphique : ${graphic.title}`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare(shareData)) {
      navigator.share(shareData);
    } else {
      // Fallback : copier l'URL
      const shareText = `${graphic.title} - ${window.location.href}`;
      navigator.clipboard.writeText(shareText).then(() => {
        this.showNotificationReal('Lien copié dans le presse-papiers !');
      });
    }
  }

  // Afficher une notification
  private showNotificationReal(message: string): void {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #0380C2;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      font-weight: 600;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }

  // Gestion des événements clavier pour la lightbox
  onKeydown(event: KeyboardEvent): void {
    if (this.isLightboxOpen && event.key === 'Escape') {
      this.closeLightbox();
    }
  }



}
