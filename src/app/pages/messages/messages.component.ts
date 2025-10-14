import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {
  activeTab = 'envoyer';
  
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

  ngOnInit() {}

  switchTab(tab: string) {
    this.activeTab = tab;
  }

  envoyerMessage() {
    console.log('Envoi du message:', this.messageForm);
  }

  utiliserTemplate(template: any) {
    this.messageForm.contenu = template.contenu;
  }

  ouvrirConversation(conversation: any) {
    console.log('Ouvrir conversation:', conversation);
  }
}