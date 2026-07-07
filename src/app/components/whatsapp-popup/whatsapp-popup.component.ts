import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-whatsapp-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whatsapp-popup.component.html',
  styleUrls: ['./whatsapp-popup.component.css']
})
export class WhatsappPopupComponent implements OnInit, OnDestroy {
  showPopup = false;
  private intervalId: any;
  private timeoutId: any;

  // Liens WhatsApp et réseaux sociaux
  whatsappGroupUrl = 'https://chat.whatsapp.com/JDkwJ791REJEfjUDzn4o7y';
  whatsappChannelUrl = 'https://whatsapp.com/channel/0029VasVCCY4dTnKoyeJK13Q';
  
  socialLinks = {
    linkedin: 'https://www.linkedin.com/company/penccum-ndongo/',
    facebook: 'https://www.facebook.com/share/1Ce2vCmuuV/?mibextid=wwXIfr',
    instagram: 'https://www.instagram.com/penccumndongo?igsh=MXIzZ2FremxqeG9xdg%3D%3D&utm_source=qr',
    twitter: 'https://x.com/penccumndongo?s=21',
    tiktok: 'https://www.tiktok.com/@penccum.ndongo?_t=ZM-8xRXEUCzSdC&_r=1'
  };

  ngOnInit() {
    // Vérifier si le popup a déjà été fermé aujourd'hui
    if (!this.wasClosedToday()) {
      this.startPopupCycle();
    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private startPopupCycle() {
    // Afficher le popup après 30 secondes
    this.timeoutId = setTimeout(() => {
      this.showPopup = true;
      
      // Répéter toutes les 5 minutes si pas fermé
      this.intervalId = setInterval(() => {
        if (!this.wasClosedToday()) {
          this.showPopup = true;
        }
      }, 300000); // 5 minutes
    }, 30000); // 30 secondes
  }

  closePopup() {
    this.showPopup = false;
    // Marquer comme fermé aujourd'hui
    this.markClosedToday();
  }

  joinWhatsAppGroup() {
    window.open(this.whatsappGroupUrl, '_blank');
    this.closePopup();
  }

  joinWhatsAppChannel() {
    window.open(this.whatsappChannelUrl, '_blank');
    this.closePopup();
  }

  openSocialLink(platform: keyof typeof this.socialLinks) {
    window.open(this.socialLinks[platform], '_blank');
  }

  private wasClosedToday(): boolean {
    const today = new Date().toDateString();
    const lastClosed = localStorage.getItem('whatsapp-popup-closed');
    return lastClosed === today;
  }

  private markClosedToday() {
    const today = new Date().toDateString();
    localStorage.setItem('whatsapp-popup-closed', today);
  }
}