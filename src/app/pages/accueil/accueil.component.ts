// Déclaration globale pour gtag (Google Analytics)
declare let gtag: Function;
import { AfterViewInit, Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewsletterComponent } from '../../components/newsletter/newsletter.component';
import { BannerComponent } from '../../components/banner/banner.component';
import { Cp2iPopupComponent } from '../../components/cp2i-popup/cp2i-popup.component';


import { trigger, state, style, transition, animate, query, stagger, keyframes } from '@angular/animations';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RecaptchaModule } from 'ng-recaptcha';
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
  category: 'vitrine' | 'ecommerce' | 'onepage' | 'refontes';
}

interface GraphicProject {
  id: number;
  title: string;
  image: string;
  category: string;
  downloadUrl?: string;
}

// Ajoute cette ligne en haut de ton fichier (après les interfaces)
type WebTab = 'vitrine' | 'ecommerce' | 'onepage' | 'refontes';

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
  imports: [CommonModule, FormsModule, BannerComponent, NewsletterComponent, RecaptchaModule, RouterModule, Cp2iPopupComponent
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
      id: 13,
      title: "Revivez notre passage sur Évidence TV !",
      excerpt: "Retour sur l'émission Evi-Weekend où nous avons parlé du Concours de Poésie Inédit & Innovant (CP2i) — son objectif, son impact et les belles perspectives de cette 3ᵉ édition. Découvrez l'intégralité de l'émission et déposez vos textes avant le 23 novembre ! #cp2i #edition3 #poesie #penccumndongo",
      image: "emissinEviWeekendTafsir.png",
      date: new Date('2025-11-08'),
      author: "Tafsir Haby NIANG",
      category: "EMISSION",
      linkedinUrl: "https://youtu.be/LIfY1eRjPnc?si=v0VYkilConuesZlD",
      featured: true
    },
    {
      id: 14,
      title: "Écrivez avec vos mots, chantez dans votre langue !",
      excerpt: "À l'occasion de la 3ᵉ édition du Concours de Poésie Inédit & Innovant (CP2i), Penccum Ndongo vous invite à transformer vos pensées en poésie et à faire résonner vos mots comme une mélodie. Laissez vos mots s'épanouir dans la langue qui vous inspire : Français, Anglais, Wolof, Arabe. #cp2i #edition3 #poesie #penccumndongo",
      image: "LanguesCP2I2025-2026.jpg",
      date: new Date('2025-11-07'),
      author: "Penccum Ndongo",
      category: "CP2I",
      linkedinUrl: "https://web.facebook.com/share/p/15fjm85Dxr/",
      featured: true
    },
    {
      id: 12,
      title: "Thèmes CP2I 2025-2026 - 5 Thèmes au Choix",
      excerpt: "Découvrez les 5 thèmes officiels du Concours de Poésie Inédit & Innovant (CP2i) Édition 3 pour l'année 2025-2026. Choisissez votre thème et laissez libre cours à votre créativité poétique ! #cp2i #edition3 #themes",
      image: "ThemesCP2I2025-2026 14.39.23.jpg",
      date: new Date('2025-11-05'),
      author: "Penccum Ndongo",
      category: "CP2I",
      linkedinUrl: "https://www.linkedin.com/posts/penccum-ndongo_cp2i-edition3-themes-activity-7391746138262962176-uLh6?utm_source=share&utm_medium=member_desktop&rcm=ACoAADqQAssBElpPsDolAtxkZ86cX_61QT4D7ZA",
      featured: true
    },
    {
      id: 10,
      title: "Lancement Officiel CP2I 2025-2026",
      excerpt: "Nous sommes ravis d'annoncer le lancement officiel de la troisième édition du Concours de Poésie Inédit & Innovant (CP2i) pour l'année 2025-2026. Une nouvelle aventure poétique commence ! #cp2i #penccumndongo #edition3",
      image: "LancementOfficielCP2I2025-2026.jpg",
      date: new Date('2025-11-03'),
      author: "Penccum Ndongo",
      category: "CP2I",
      linkedinUrl: "https://www.linkedin.com/posts/penccum-ndongo_cp2i-penccumndongo-edition3-activity-7391021385529073665-DRHq?utm_source=share&utm_medium=member_desktop&rcm=ACoAADqQAssBElpPsDolAtxkZ86cX_61QT4D7ZA",
      featured: true
    },
    {
      id: 11,
      title: "Appel aux Sponsors & Partenaires - CP2i Édition 3",
      excerpt: "Rejoignez-nous en tant que sponsor ou partenaire pour la troisième édition du CP2i ! Ensemble, soutenons la créativité poétique africaine et contribuons au rayonnement culturel de notre continent. #cp2i #penccumndongo #edition3",
      image: "AppelauxSponsorsPartenairesCP2iEdition3.jpg",
      date: new Date('2025-10-23'),
      author: "Penccum Ndongo",
      category: "CP2I",
      linkedinUrl: "https://www.linkedin.com/posts/penccum-ndongo_cp2i-penccumndongo-edition3-activity-7387216263854579712-OfjQ?utm_source=share&utm_medium=member_desktop&rcm=ACoAADqQAssBElpPsDolAtxkZ86cX_61QT4D7ZA",
      featured: true
    },
    {
      id: 1,
      title: "Lundi d'inspiration - Thomas Edison",
      excerpt: "« La vision sans exécution n'est qu'hallucination. » - Thomas Edison. Une citation puissante pour nous rappeler l'importance de passer à l'action. #lundidinspiration #thomasedison #penccumndongo",
      image: "Citation36.jpg",
      date: new Date('2025-09-29'),
      author: "Tafsir Haby NIANG - CEO",
      category: "INSPIRATION",
      linkedinUrl: "https://www.linkedin.com/feed/update/urn:li:activity:7378371246658457600",
      featured: true
    },
    {
      id: 2,
      title: "Formation Infographie - Découvrez les avantages clés",
      excerpt: "Découvrez tous les avantages de notre formation professionnelle en infographie. Une formation complète pour développer vos compétences créatives et techniques. Inscriptions ouvertes ! #formation #infographie #penccumndongo",
      image: "FormationInfographie-Avantages.jpg",
      date: new Date('2025-09-29'),
      author: "Penccum Ndongo",
      category: "FORMATION",
      linkedinUrl: "https://www.linkedin.com/feed/update/urn:li:activity:7378369440821854208",
      featured: true
    },
    {
      id: 4,
      title: "Formation Designer Professionnel - 4 semaines intensives",
      excerpt: "Formation 100% pratique pour maîtriser les outils professionnels, réaliser des projets concrets et repartir avec une attestation + un portfolio prêt à convaincre. Date limite des inscriptions : 3 octobre 2025.",
      image: "ProgrammeFormatinInfographie.jpg",
      date: new Date('2025-09-25'),
      author: "Penccum Ndongo",
      category: "FORMATION",
      linkedinUrl: "https://www.linkedin.com/posts/penccum-ndongo_penccumndongo-formationprofessionnelle-infographie-activity-7377073165887516673-vQHG?utm_source=share&utm_medium=member_desktop&rcm=ACoAADqQAssBElpPsDolAtxkZ86cX_61QT4D7ZA",
      featured: true
    },
    {
      id: 5,
      title: "Formation Professionnelle en Infographie - Maîtrisez l'art qui fait la différence !",
      excerpt: "Formation 100% pratique en infographie pour transformer votre talent en compétences exploitables. 1 mois de formation intensive avec Photoshop, Illustrator, Premiere Pro. Inscriptions ouvertes du 22 septembre au 3 octobre 2025.",
      image: "Formation-Infographie.jpg",
      date: new Date('2025-09-22'),
      author: "Penccun Ndongo",
      category: "FORMATION",
      linkedinUrl: "https://www.linkedin.com/posts/penccum-ndongo_infographie-ma%C3%AEtrisez-lart-qui-fait-la-activity-7375807415356694528-_X9X?utm_source=share&utm_medium=member_desktop&rcm=ACoAADqQAssBElpPsDolAtxkZ86cX_61QT4D7ZA",
      featured: true
    },
     {
      id: 6,
      title: "Lancement officiel du site web de PENCCUM NDONGO !",
      excerpt: "Un site pensé pour vous. Avec Penccum Ndongo, passez de la stratégie à l'action et propulsez votre communication ! #penccumndongo #lancementofficiel #siteweb #digitalisation #exploreznosservices",
      image: "LancementOfficielSiteWebPenccumNdongo.jpg",
      date: new Date('2025-09-21'),
      author: "Direction Générale",
      category: "EMISSION",
      linkedinUrl: "https://www.linkedin.com/feed/update/urn:li:activity:7375438674412404736"
    },
     {
      id: 7,
      title: "Mawlid Moubarak !",
      excerpt: "\n\nÀ l'occasion du Mawlid, nous adressons nos prières et nos vœux de paix, de santé et de prospérité à toute la communauté musulmane. #mawlid #penccumndongo",
      image: "mawlid2025.jpeg",
      date: new Date('2025-09-03'),
      author: "Penccum Ndongo",
      category: "EVENNEMENT",
      linkedinUrl: "https://www.linkedin.com/posts/penccum-ndongo_mawlid-penccumndongo-activity-7369101274895654916-Iw2Y?utm_source=share&utm_medium=member_desktop&rcm=ACoAADqQAssBElpPsDolAtxkZ86cX_61QT4D7ZA",
    },
    {
      id: 8,
      title: "#OPPORTUNITE DE SE FORMER AVEC PENC'BOOST ",
      excerpt: "J-2 avant le démarrage ! Les sessions commencent ce lundi 21 juillet, pour une semaine complète de formation, du 21 au 27 juillet. ! #pencboost #formation #penccumndongo",
      image: "postmadiop.jpeg",
      date: new Date('2025-07-19'),
      author: "Penccum Ndongo",
      category: "FORMATION", 
      linkedinUrl: "https://www.linkedin.com/feed/update/urn:li:activity:7352326292681179137"
    },
    {
      id: 9,
      title: "#Emission Évi #Weekend – Invité Tafsir Haby NIANG !",
      excerpt: "Ce samedi 21 juin 2025, j'ai eu le plaisir de participer à l'émission Évi Weekend, diffusée en direct sur Evidence TV. À très bientôt pour d'autres aventures humaines et inspirantes. — Tafsir Haby Niang #eviweekend #evidencetv",
      image: "emissiontafsir.png",
      date: new Date('2025-06-23'),
      author: "Tafsir Haby NIANG - CEO",
      category: "EMISSION",
      linkedinUrl: "https://www.youtube.com/live/7BjB8PBy7a8?si=llICo6xH26NjD7DB"
    },
     {
      id: 7,
      title: "Lundi d'inspiration - Se #cultiver, c'est se libérer !",
      excerpt: "L'ignorance est une chaîne silencieuse. Elle alimente la peur, nourrit la haine et finit par engendrer la violence. #lundidinspiration #secultiver #education #savoirpouvoirpaix #initiativecourageaction",
      image: "pubposttafsir.jpeg",
      date: new Date('2024-12-13'),
      author: "Tafsir Haby NIANG - CEO",
      category: "ÉVÉNEMENT",
      linkedinUrl: "https://www.linkedin.com/feed/update/urn:li:activity:7353041884056907776"
    },
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

  if (!this.captchaResolved) {
    this.errorMsg = 'Veuillez valider le reCAPTCHA.';
    return;
  }

  const dataToSend = {
    ...this.contactData,
    recaptchaToken: this.captchaToken
  };

  this.http.post<{success: boolean, message: string}>('https://penccumndongo.com/contact.php', dataToSend)
    .subscribe({
      next: (res) => {
        if (res.success) {
          this.successMsg = 'Votre message a bien été envoyé !';
          this.contactData = { firstname: '', lastname: '', phone: '', email: '', company: '', message: '' };
          this.captchaResolved = false;
          this.captchaToken = '';
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
        el.textContent = '+' + target;
      } else {
        el.textContent = '+' + count;
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
activeWebTab: WebTab = 'vitrine';  
  
webTabs: WebTab[] = ['vitrine', 'ecommerce', 'onepage', 'refontes'];

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
      url: 'https://penccumndongo.com',
      category: 'vitrine'
    },
    {
      id: 2,
      title: 'Site Web de l\'Agence Penccum Ndongo',
      image: 'sitewebPenccumNdongo.png',
      url: 'https://penccumndongo.com',
      category: 'ecommerce'
    },
    {
      id: 3,
      title: 'Site Web de l\'Agence Penccum Ndongo',
      image: 'sitewebPenccumNdongo.png',
      url: 'https://penccumndongo.com',
      category: 'onepage'
    },
    {
      id: 4,
       title: 'Site Web de l\'Agence Penccum Ndongo',
      image: 'sitewebPenccumNdongo.png',
      url: 'https://penccumndongo.com',
      category: 'refontes'
    },
    
  
  ];

// Projets graphiques organisés par catégories
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
    title: 'Quatrième de Couverture d\'Un Recueil de Poème - Vers Croisés',
    image: 'QuatrièmeCouvertureRecueildePoème.jpeg',
    category: 'Affiches',
    downloadUrl: 'https://penccumndongo.com/QuatrièmeCouvertureRecueildePoème.jpeg'
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
    image: 'COSDENDépliant.jpg',
    category: 'Dépliants',
    downloadUrl: 'https://penccumndongo.com/COSDENDépliant.jpg'
  },

  // === BANNIÈRES ===
  // {
  //   id: 15,
  //   title: 'Bannière Promotionnelle WUDERE - COMMERCE',
  //   image: 'Bannière-Wudere.jpg',
  //   category: 'Bannières',
  //   downloadUrl: 'https://penccumndongo.com/Bannière-Wudere.jpg'
  // },
  {
    id: 16,
    title: 'Bannière Promotionnelle WUDERE - COMMERCE',
    image: 'Bannière-Wudere.jpg',
    category: 'Bannières',
    downloadUrl: 'https://penccumndongo.com/Bannière-Wudere.jpg'
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

  // === BÂCHES ===
  // Note: Aucun projet avec la catégorie "Bâches" n'a été trouvé dans votre liste originale

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
    title: 'Mockups Polo - Cérémonie CP2i',
    image: 'PoloCérémonieCP2i.jpeg',
    category: 'Mockups',
    downloadUrl: 'https://penccumndongo.com/PoloCérémonieCP2i.jpeg'
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



  // Obtenir les projets web filtrés
  get filteredWebProjects(): WebProject[] {
    return this.webProjects.filter(project => project.category === this.activeWebTab);
  }

  // Obtenir le label des onglets 
  getTabLabel(tab: string): string {
    const labels: { [key: string]: string } = {
      'vitrine': 'Vitrine 2-08 Pages',
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

  // Détermine la classe CSS appropriée selon le type d'image
  getImageStyleClass(graphic: GraphicProject | null): string {
    if (!graphic) return 'default-style';
    
    const category = graphic.category.toLowerCase();
    const title = graphic.title.toLowerCase();
    
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