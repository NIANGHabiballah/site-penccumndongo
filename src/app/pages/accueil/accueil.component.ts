import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BannerComponent } from '../../components/banner/banner.component';
import { RecaptchaModule } from 'ng-recaptcha';
import { trigger, transition, style, animate } from '@angular/animations';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

 
@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, BannerComponent, RecaptchaModule, RouterModule
  ],

  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('350ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]

})
export class AccueilComponent {
  contactData = {
    firstname: '',
    lastname: '',
    phone: '',
    email: '',
    company: '',
    message: ''
  };

  captchaResolved = false;
  successMsg = '';
  errorMsg = '';
  
    activeTab: 'mission' | 'vision' = 'mission';

    setTab(tab: 'mission' | 'vision') {
      this.activeTab = tab;
    }

onCaptchaResolved(response: string | null) {
  this.captchaResolved = !!response;
  this.captchaToken = response ?? '';
}

constructor(private http: HttpClient) {}

 captchaToken: string = '';

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

ngAfterViewInit() {
  if (this.countersAnimated) return; // Empêche de relancer l'animation
  this.countersAnimated = true;
    this.animateNumbers();
}

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

testimonials = [
  {
    photo: 'PMN.enc',
    text: `"C’est avec une grande joie, une profonde satisfaction et beaucoup de gratitude que nous vous adressons ces mots.
    Nous sommes réellement très satisfaits de vos réalisations, que nous apprécions sincèrement.
    Nous avons reçu plusieurs travaux de votre part qui témoignent de votre engagement, de votre professionnalisme et de votre parfaite maîtrise.
    Nous vous exprimons toute notre reconnaissance et vous encourageons vivement à poursuivre dans cette voie.
    Penccum Ndongo – Sa Kaw, Sa Kanam"`,
    name: 'Pape Malick NIANG',
    title: 'Directeur Exécutif Mourchid Services'
  },
  {
    photo: 'Tafsir.jpg',
    text: `"Nous tenons à vous remercier sincèrement pour votre précieuse collaboration.
    Votre engagement et votre professionnalisme ont grandement contribué au succès de cette événement.
    Nous espérons pouvoir poursuivre cette belle dynamique et renforcer notre partenariat dans les mois à venir.
    Bien cordialement  Pencum ndongo for ever"`,
    name: 'Abiboulaye DIOP',
    title: 'Fondateur de Télé Niandane TV'
  },
  {
    photo: 'BD.jpeg',
    text: `"Je suis extrêmement satisfait des services de PENCUM NONGO ! Ils ont réalisé le logo de mon entreprise NICONS,
    mes cartes de visite et des affiches publicitaires avec une qualité exceptionnelle. Leur professionnalisme,
    leur créativité et leur réactivité ont dépassé mes attentes. Je recommande vivement PENCUM NONGO pour tou
    vos besoins en design graphique.
    Merci pour votre excellent travail !"`,
    name: 'Abdourahmane NIANG',
    title: 'Fondateur & DG de NICONS'
  }
];

currentIndex = 0;
intervalId: any;

ngOnInit() {
  this.startAutoSlide();
    window.scrollTo({ top: 0, behavior: 'smooth' });

}
startAutoSlide() {
  this.intervalId = setInterval(() => {
    this.nextTestimonial();
  }, 5000); // 5 secondes
}

stopAutoSlide() {
  if (this.intervalId) clearInterval(this.intervalId);
}

nextTestimonial() {
  this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
  if (this.currentIndex > this.testimonials.length - 2) {
    this.currentIndex = 0;
  }
}

prevTestimonial() {
  this.currentIndex = (this.currentIndex - 1 + this.testimonials.length) % this.testimonials.length;
  if (this.currentIndex > this.testimonials.length - 2) {
    this.currentIndex = this.testimonials.length - 2;
  }
}

ngOnDestroy() {
  this.stopAutoSlide();
}

portfolioCategories = [
  'Tous',
  'Conceptions graphiques',
  'Logos',
  'Affiches & Bannières',
  'Projets 360°',
  'Evénementiel'
];
selectedCategory = 'Tous';

portfolio = [
  {
    image: 'logo.png',
    title: 'Logo CP2i',
    description: 'Création du logo pour le Concours de Poésie Inédit et Innovant (CP2i), symbole de créativité et d’innovation.',
    tags: ['Logo', 'Conceptions graphiques']
  },
  {
    image: 'Web0.jpg',
    title: 'Supports pour Webinaires des Coachs',
    description: 'Accompagnement du Collectif des Coachs Professionnels du Sénégal : conception d’affiches, bannières et visuels pour leurs webinaires.',
    tags: ['Affiche', 'Bannière', 'Projets 360°']
  },
  {
    image: 'Bannière-Wudere.jpg',
    title: 'Bannière Entreprise',
    description: 'Réalisation de bannières professionnelles pour la communication digitale de nos clients.',
    tags: ['Bannière', 'Conceptions graphiques']
  },
  {
    image: 'Attestation.jpg',
    title: 'Cérémonie CP2i 2025',
    description: 'Organisation et communication visuelle pour la cérémonie de remise des prix du CP2i, édition 2025.',
    tags: ['Evénementiel', 'Projets 360°']
  },
  {
    image: 'P5.png',
    title: 'Logo NICONS',
    description: 'Création du logo et de la charte graphique pour la société NICONS.',
    tags: ['Logo', 'Conceptions graphiques']
  },
  // ...ajoutez d’autres réalisations ici
];

get filteredPortfolio() {
  if (this.selectedCategory === 'Tous') return this.portfolio;
  return this.portfolio.filter(p => p.tags.includes(this.selectedCategory));
}


selectedRealisation: any = null;

openRealisation(proj: any) {
  this.selectedRealisation = proj;
}

closeRealisation() {
  this.selectedRealisation = null;
}

 scrollToSection(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  currentPortfolioIndex = 0;

get visiblePortfolio() {
  // Affiche 3 éléments : précédent, courant, suivant (boucle)
  const arr = [];
  const len = this.filteredPortfolio.length;
  if (len === 0) return [];
  for (let i = -1; i <= 1; i++) {
    arr.push(this.filteredPortfolio[(this.currentPortfolioIndex + i + len) % len]);
  }
  return arr;
}

prevPortfolio() {
  const len = this.filteredPortfolio.length;
  this.currentPortfolioIndex = (this.currentPortfolioIndex - 1 + len) % len;
}

nextPortfolio() {
  const len = this.filteredPortfolio.length;
  this.currentPortfolioIndex = (this.currentPortfolioIndex + 1) % len;
}

// Quand on change d'onglet, on remet l'index à 0
selectCategory(cat: string) {
  this.selectedCategory = cat;
  this.currentPortfolioIndex = 0;
}

}