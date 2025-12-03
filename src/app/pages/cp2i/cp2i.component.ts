import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface BookImage {
  src: string;
  alt: string;
}

@Component({
  selector: 'app-cp2i',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cp2i.component.html',
  styleUrls: ['./cp2i.component.css']
})
export class Cp2iComponent implements OnInit {
  
  // Images du recueil
  bookImages: BookImage[] = [
    {
      src: 'cp2i/couverturereccueil.jpg',
      alt: 'Couverture du recueil de poèmes'
    },
    {
      src: 'cp2i/auatriemecouverturerecueil.jpg',
      alt: 'Quatrième de couverture du recueil'
    },
    {
      src: 'expolivre.jpeg',
      alt: 'Exposition du livre'
    },
    {
      src: 'prixetdetail.jpeg',
      alt: 'Prix et détails du livre'
    },
      {
      src: 'bibliolivre.jpeg',
      alt: 'Bibliothèque du recueil'
    },
  ];

  // Images de la galerie
  galleryImages: string[] = [];

  constructor() {
    // Génération automatique des images de 0 à 48
    for (let i = 0; i <= 48; i++) {
      this.galleryImages.push(`cp2i/galerie/${i}.jpg`);
    }
  }

  // États des lightbox
  showThanksLightbox = false;
  bookLightboxOpen = false;
  showGalleryModal = false;
  showClosedModal = false;
  inscriptionsClosed = true;
  
  // Index actuels
  currentBookImg = 0;
  galleryIndex = 0;
  selectedGalleryImage = '';
  countdown: any = {};
  nextEditionCountdown: any = {};

  // Langues disponibles
  selectedLanguage = 'francais';
  
  languages = [
    { code: 'francais', name: 'Français', icon: 'fas fa-flag' },
    { code: 'wolof', name: 'Wolof', icon: 'fas fa-globe-africa' },
    { code: 'anglais', name: 'English', icon: 'fas fa-flag-usa' },
    { code: 'arabe', name: 'العربية', icon: 'fas fa-moon' }
  ];

  // Thèmes multilingues
  themesMultilingues = {
    francais: [
      { title: 'Patriotisme', icon: 'fas fa-flag' },
      { title: 'Justice et dignité', icon: 'fas fa-balance-scale' },
      { title: 'Beauté Africaine', icon: 'fas fa-crown' },
      { title: 'Jeunesse responsable', icon: 'fas fa-users' },
      { title: 'Sous l\'emprise des écrans', icon: 'fas fa-mobile-alt' }
    ],
    wolof: [
      { title: 'Bëgg sa réew', icon: 'fas fa-flag' },
      { title: 'Yoon ak ngor', icon: 'fas fa-balance-scale' },
      { title: 'Taaru jigeenu afrik', icon: 'fas fa-crown' },
      { title: 'Xale yu am responsabilite', icon: 'fas fa-users' },
      { title: 'Ci ndigalu ekraŋ yi', icon: 'fas fa-mobile-alt' }
    ],
    anglais: [
      { title: 'Patriotism', icon: 'fas fa-flag' },
      { title: 'Justice and dignity', icon: 'fas fa-balance-scale' },
      { title: 'African Beauty', icon: 'fas fa-crown' },
      { title: 'Responsible Youth', icon: 'fas fa-users' },
      { title: 'Under the grip of screens', icon: 'fas fa-mobile-alt' }
    ],
    arabe: [
      { title: 'الوطنية', icon: 'fas fa-flag' },
      { title: 'العدالة والكرامة', icon: 'fas fa-balance-scale' },
      { title: 'الجمال الأفريقي', icon: 'fas fa-crown' },
      { title: 'الشباب المسؤول', icon: 'fas fa-users' },
      { title: 'تحت سيطرة الشاشات', icon: 'fas fa-mobile-alt' }
    ]
  };

  // Partenaires officiels
  partners = [
    { name: 'Capture Vision', logo: 'Partenaires/Capture-Vision.png' },
    { name: 'Comm Niit', logo: 'Partenaires/COMM-NIIT.png' },
    { name: 'DCI', logo: 'Partenaires/DCI.png' },
    { name: 'Gandal Afrik', logo: 'Partenaires/GANDAL-AFRIK.png' },
    { name: 'Home School', logo: 'Partenaires/HomeSchool.png' },
    { name: 'Mourchid Services', logo: 'Partenaires/MourchidServices.png' },
    { name: 'Ndiaye Digital', logo: 'Partenaires/Ndiaye-Digital.png' },
    { name: 'Tele Niandane', logo: 'Partenaires/TeleNiandane.png' },
    { name: 'UGB Live', logo: 'Partenaires/UGB-LIVE.png' }
  ];

  ngOnInit() {
    this.startCountdown();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  selectLanguage(langCode: string) {
    this.selectedLanguage = langCode;
  }
  
  getThemesForSelectedLanguage() {
    return this.themesMultilingues[this.selectedLanguage as keyof typeof this.themesMultilingues] || this.themesMultilingues.francais;
  }
  
  getLanguageName(langCode: string): string {
    const lang = this.languages.find(l => l.code === langCode);
    return lang ? lang.name : 'Français';
  }

  // Gestion lightbox remerciements
  openThanksLightbox() {
    this.showThanksLightbox = true;
    document.body.style.overflow = 'hidden';
  }

  closeThanksLightbox() {
    this.showThanksLightbox = false;
    document.body.style.overflow = 'auto';
  }

  // Gestion lightbox livres
  openBookLightbox(index: number) {
    this.currentBookImg = index;
    this.bookLightboxOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeBookLightbox() {
    this.bookLightboxOpen = false;
    document.body.style.overflow = 'auto';
  }

  prevBookImage() {
    if (this.currentBookImg > 0) {
      this.currentBookImg--;
    }
  }

  nextBookImage() {
    if (this.currentBookImg < this.bookImages.length - 1) {
      this.currentBookImg++;
    }
  }

  // Gestion galerie
  prevGalleryImage() {
    if (this.galleryIndex > 0) {
      this.galleryIndex--;
    }
  }

  nextGalleryImage() {
    if (this.galleryIndex < this.galleryImages.length - 1) {
      this.galleryIndex++;
    }
  }

  openGalleryModal(imageSrc: string) {
    this.selectedGalleryImage = imageSrc;
    this.showGalleryModal = true;
    document.body.style.overflow = 'hidden';
  }

  prevGalleryModal() {
    const currentIndex = this.galleryImages.indexOf(this.selectedGalleryImage);
    if (currentIndex > 0) {
      this.selectedGalleryImage = this.galleryImages[currentIndex - 1];
    }
  }

  nextGalleryModal() {
    const currentIndex = this.galleryImages.indexOf(this.selectedGalleryImage);
    if (currentIndex < this.galleryImages.length - 1) {
      this.selectedGalleryImage = this.galleryImages[currentIndex + 1];
    }
  }

  closeGalleryModal() {
    this.showGalleryModal = false;
    this.selectedGalleryImage = '';
    document.body.style.overflow = 'auto';
  }

  // Navigation vers la galerie
  scrollToGallery() {
    const galleryElement = document.getElementById('gallery-section');
    if (galleryElement) {
      galleryElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Navigation vers les thèmes détaillés
  scrollToThemesDetail() {
    const themesElement = document.getElementById('themes-detail');
    if (themesElement) {
      themesElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Countdown pour les inscriptions CP2i
  startCountdown(): void {
    const deadline = new Date('2025-11-25T23:59:59').getTime();
    
    const nextEditionDeadline = new Date('2026-11-23T23:59:59').getTime();
    
    setInterval(() => {
      const now = new Date().getTime();
      const distance = deadline - now;
      const nextDistance = nextEditionDeadline - now;
      
      this.countdown = {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      };
      
      this.nextEditionCountdown = {
        days: Math.floor(nextDistance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((nextDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((nextDistance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((nextDistance % (1000 * 60)) / 1000)
      };
    }, 1000);
  }



  openClosedModal(): void {
    this.showClosedModal = true;
  }

  closeClosedModal(): void {
    this.showClosedModal = false;
  }

  joinParticipantsWhatsAppGroup(): void {
    window.open('https://chat.whatsapp.com/JDkwJ791REJEfjUDzn4o7y?mode=hqrt3', '_blank');
    this.closeClosedModal();
  }

  joinPenccumWhatsAppChannel(): void {
    window.open('https://whatsapp.com/channel/0029VasVCCY4dTnKoyeJK13Q', '_blank');
    this.closeClosedModal();
  }

  openSocialLink(url: string): void {
    window.open(url, '_blank');
  }

  openAllSocialNetworks(): void {
    const socialLinks = [
      'https://www.linkedin.com/company/penccum-ndongo/',
      'https://www.facebook.com/share/1Ce2vCmuuV/?mibextid=wwXIfr',
      'https://x.com/penccumndongo?s=21',
      'https://www.instagram.com/penccumndongo?igsh=MXIzZ2FremxqeG9xdg%3D%3D&utm_source=qr',
      'https://www.tiktok.com/@penccum.ndongo?_t=ZM-8xRXEUCzSdC&_r=1',
      'https://youtube.com/@penccumndongo?si=wG-jaIUBmL1LrNR-'
    ];
    
    // Ouvrir chaque lien avec un délai pour éviter le blocage des pop-ups
    socialLinks.forEach((link, index) => {
      setTimeout(() => {
        window.open(link, '_blank');
      }, index * 300); // Délai de 300ms entre chaque ouverture
    });
    
    this.closeClosedModal();
  }
}