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
      src: 'CouvertureRecueildePoème.jpeg',
      alt: 'Couverture du recueil de poèmes'
    },
    {
      src: 'QuatrièmeCouvertureRecueildePoème.jpeg',
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
  galleryImages: string[] = [
    'cp2i/galerie/1.jpg',
    'cp2i/galerie/2.jpg',
    'cp2i/galerie/3.jpg',
    'cp2i/galerie/4.jpg',
    'cp2i/galerie/5.jpg',
    'cp2i/galerie/6.jpg',
    'cp2i/galerie/7.jpg',
    'cp2i/galerie/8.jpg'
  ];

  // États des lightbox
  showThanksLightbox = false;
  bookLightboxOpen = false;
  showGalleryModal = false;
  
  // Index actuels
  currentBookImg = 0;
  galleryIndex = 0;
  selectedGalleryImage = '';

  // États d'authentification
  isLoggedIn = false;
  userRole: 'participant' | 'correcteur' | 'admin' | null = null;
  showAuthModal = false;
  showDashboard = false;
  authMode: 'login' | 'register' = 'login';
  selectedRole: 'participant' | 'correcteur' | null = null;
  
  // Données utilisateur
  currentUser = {
    firstName: '',
    lastName: '',
    email: '',
    role: ''
  };

  ngOnInit() {
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

  // Gestion authentification
  openAuthModal(mode: 'login' | 'register') {
    this.authMode = mode;
    this.showAuthModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeAuthModal() {
    this.showAuthModal = false;
    document.body.style.overflow = 'auto';
  }

  switchAuthMode(mode: 'login' | 'register') {
    this.authMode = mode;
  }

  selectRole(role: 'participant' | 'correcteur') {
    this.selectedRole = role;
  }

  login(formData: any) {
    // Simulation de connexion
    this.isLoggedIn = true;
    this.userRole = 'participant'; // Exemple
    this.currentUser = {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: formData.email,
      role: 'Participant'
    };
    this.closeAuthModal();
  }

  register(formData: any) {
    // Simulation d'inscription
    this.isLoggedIn = true;
    this.userRole = this.selectedRole;
    this.currentUser = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      role: this.selectedRole === 'participant' ? 'Participant' : 'Correcteur'
    };
    this.closeAuthModal();
  }

  logout() {
    this.isLoggedIn = false;
    this.userRole = null;
    this.currentUser = { firstName: '', lastName: '', email: '', role: '' };
  }

  goToDashboard() {
    this.showDashboard = true;
    setTimeout(() => {
      const dashboardElement = document.querySelector('.dashboard-section');
      if (dashboardElement) {
        dashboardElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  closeDashboard() {
    this.showDashboard = false;
  }
}