import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { HttpClient } from '@angular/common/http';
import { ImageUploadComponent } from '../../components/image-upload/image-upload.component';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploadComponent],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {
  activeTab = 'envoyer';

  constructor(private apiService: ApiService, private http: HttpClient) {}
  
  messageForm = {
    destinataire: 'tous',
    type: 'information',
    sujet: '',
    contenu: '',
    programmation: false,
    dateEnvoi: ''
  };

  selectedImages: File[] = [];

  conversations = [
    {
      id: 1,
      participant: 'Aminata Diallo',
      dernier_message: 'Comment puis-je modifier ma soumission ?',
      statut: 'non_lu',
      date: '2024-01-15 14:30'
    },
    {
      id: 2,
      participant: 'Moussa Sow',
      dernier_message: 'Merci pour votre aide !',
      statut: 'lu',
      date: '2024-01-15 10:15'
    }
  ];

  templates = [
    { nom: 'Confirmation inscription', contenu: 'Votre inscription au concours CP2i a été confirmée...' },
    { nom: 'Rappel soumission', contenu: 'N\'oubliez pas de soumettre votre texte avant la date limite...' },
    { nom: 'Résultats disponibles', contenu: 'Les résultats de votre évaluation sont maintenant disponibles...' }
  ];

  ngOnInit() {
    this.chargerDonnees();
  }

  chargerDonnees() {
    this.apiService.getConversations().subscribe({
      next: (conv) => this.conversations = conv,
      error: (err) => console.error('Erreur conversations:', err)
    });
    
    this.apiService.getMessageTemplates().subscribe({
      next: (templates) => this.templates = templates,
      error: (err) => console.error('Erreur templates:', err)
    });
  }

  switchTab(tab: string) {
    this.activeTab = tab;
  }

  envoyerMessage() {
    if (this.selectedImages.length > 0) {
      // Envoyer avec images
      const formData = new FormData();
      formData.append('subject', this.messageForm.sujet);
      formData.append('content', this.messageForm.contenu);
      formData.append('send_to_all', (this.messageForm.destinataire === 'tous' || this.messageForm.destinataire === 'participants').toString());
      
      this.selectedImages.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });
      
      const token = localStorage.getItem('cp2i_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      this.http.post('https://penccumndongo.com/src/app/back-end/cp2i-messages.php?action=send_with_images', formData, {
        headers
      }).subscribe({
        next: (response: any) => {
          alert(response.message || 'Message envoyé avec succès');
          this.resetForm();
        },
        error: (err) => {
          console.error('Erreur envoi:', err);
          alert('Erreur lors de l\'envoi du message');
        }
      });
    } else {
      // Envoyer sans images (méthode existante)
      const messageData = {
        subject: this.messageForm.sujet,
        content: this.messageForm.contenu,
        send_to_all: this.messageForm.destinataire === 'tous' || this.messageForm.destinataire === 'participants',
        recipients: this.messageForm.destinataire === 'individuel' ? [] : undefined
      };

      const token = localStorage.getItem('cp2i_token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      
      this.http.post('https://penccumndongo.com/src/app/back-end/cp2i-messages.php', messageData, {
        headers
      }).subscribe({
        next: (response: any) => {
          alert(response.message || 'Message envoyé avec succès');
          this.resetForm();
        },
        error: (err) => {
          console.error('Erreur envoi:', err);
          alert('Erreur lors de l\'envoi du message');
        }
      });
    }
  }

  resetForm() {
    this.messageForm = {
      destinataire: 'tous',
      type: 'information',
      sujet: '',
      contenu: '',
      programmation: false,
      dateEnvoi: ''
    };
    this.selectedImages = [];
  }

  utiliserTemplate(template: any) {
    this.messageForm.contenu = template.contenu;
  }

  ouvrirConversation(conversation: any) {
    console.log('Ouvrir conversation:', conversation);
  }

  onImagesChange(images: File[]) {
    this.selectedImages = images;
  }
}