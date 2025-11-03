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
  
  // Index actuels
  currentBookImg = 0;
  galleryIndex = 0;
  selectedGalleryImage = '';
  countdown: any = {};

  // Thèmes du concours CP2i 3ème édition
  themes = [
    {
      title: '1. Patriotisme',
      icon: 'fas fa-flag'
    },
    {
      title: '2. Justice et dignité',
      icon: 'fas fa-balance-scale'
    },
    {
      title: '3. Beauté Africaine',
      icon: 'fas fa-crown'
    },
    {
      title: '4. Jeunesse responsable',
      icon: 'fas fa-users'
    },
    {
      title: '5. Sous l\'emprise des écrans',
      icon: 'fas fa-mobile-alt'
    }
  ];

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
    const deadline = new Date('2025-11-23T23:59:59').getTime();
    
    setInterval(() => {
      const now = new Date().getTime();
      const distance = deadline - now;
      
      this.countdown = {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      };
    }, 1000);
  }
}