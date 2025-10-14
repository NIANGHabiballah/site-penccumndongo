import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {
  activeTab = 'envoyer';

  constructor(private apiService: ApiService) {}
  
  messageForm = {
    destinataire: 'tous',
    type: 'information',
    sujet: '',
    contenu: '',
    programmation: false,
    dateEnvoi: ''
  };

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
    if (this.messageForm.destinataire === 'tous' || this.messageForm.destinataire === 'participants' || this.messageForm.destinataire === 'correcteurs') {
      this.apiService.envoyerMessageGroupe(this.messageForm).subscribe({
        next: (response) => {
          alert(response.message);
          this.resetForm();
        },
        error: (err) => alert('Erreur envoi message')
      });
    } else {
      this.apiService.envoyerMessagePrive(this.messageForm).subscribe({
        next: () => {
          alert('Message envoyé');
          this.resetForm();
        },
        error: (err) => alert('Erreur envoi message')
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
  }

  utiliserTemplate(template: any) {
    this.messageForm.contenu = template.contenu;
  }

  ouvrirConversation(conversation: any) {
    console.log('Ouvrir conversation:', conversation);
  }
}