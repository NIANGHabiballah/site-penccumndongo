import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- Ajout

@Component({
  selector: 'app-cp2i',
  imports: [CommonModule, ],
  templateUrl: './cp2i.component.html',
  styleUrl: './cp2i.component.css'
})
export class Cp2iComponent {

  ngAfterViewInit() {
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
  galleryIndexes = Array.from({length: 48}, (_, i) => i); // 0 à 50 inclus
  // Lightbox pour la galerie principale
  lightboxOpen = false;
  currentImg = 0;
  showThanksLightbox = false;

galleryImages = Array.from({length: 55}, (_, i) => `cp2i/galerie/${i}.jpg`);
galleryIndex = 0;
galleryInterval: any;
showGalleryModal = false;
selectedGalleryImage = '';


    // Images du recueil & temps forts
  bookImages = [
    { src: 'cp2i/couverturereccueil.jpg', alt: 'Couverture recueil' },
    { src: 'cp2i/auatriemecouverturerecueil.jpg', alt: 'Quatrième de couverture' },
    { src: 'cp2i/bibliolivre.jpeg', alt: 'Livre en bibliothèque' },
    { src: 'cp2i/expolivre.jpeg', alt: 'Exposition livre' },
    { src: 'cp2i/prixetdetail.jpeg', alt: 'Prix et détails' }
  ];

  openLightbox(idx: number) {
    this.currentImg = idx;
    this.lightboxOpen = true;
  }

  closeLightbox() {
    this.lightboxOpen = false;
  }

   // Lightbox pour les livres
  bookLightboxOpen = false;
  currentBookImg = 0;

  openBookLightbox(idx: number) {
    this.currentBookImg = idx;
    this.bookLightboxOpen = true;
  }
  closeBookLightbox() {
    this.bookLightboxOpen = false;
  }

  openThanksLightbox() {
  this.showThanksLightbox = true;
}

  closeThanksLightbox() {
    this.showThanksLightbox = false;
  }

    ngOnInit() {
   window.scrollTo({ top: 0, behavior: 'smooth' });
  this.startGalleryAutoSlide();
}

startGalleryAutoSlide() {
  this.galleryInterval = setInterval(() => {
    this.nextGalleryImage();
  }, 3500);
}

stopGalleryAutoSlide() {
  if (this.galleryInterval) {
    clearInterval(this.galleryInterval);
  }
}

nextGalleryImage() {
  this.galleryIndex = (this.galleryIndex + 1) % this.galleryImages.length;
}

prevGalleryImage() {
  this.galleryIndex = (this.galleryIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
}

openGalleryModal(img: string) {
  this.selectedGalleryImage = img;
  this.showGalleryModal = true;
  this.stopGalleryAutoSlide();
}

closeGalleryModal() {
  this.showGalleryModal = false;
  this.startGalleryAutoSlide();
}

ngOnDestroy() {
  this.stopGalleryAutoSlide();
}

  scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

scrollToBottom() {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

}
