import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit {
  activeTab = 'configuration';
  
  chatbotConfig = {
    actif: true,
    nom: 'Assistant CP2i',
    message_accueil: 'Bonjour ! Je suis l\'assistant CP2i. Comment puis-je vous aider ?',
    langues: ['français', 'wolof'],
    reponse_automatique: true
  };

  constructor(private apiService: ApiService) {}

  faqItems = [
    {
      id: 1,
      question: 'Comment m\'inscrire au concours ?',
      reponse: 'Pour vous inscrire, cliquez sur "Inscription" et remplissez le formulaire avec vos informations personnelles.',
      categorie: 'inscription',
      utilisation: 45
    },
    {
      id: 2,
      question: 'Quand sont les résultats ?',
      reponse: 'Les résultats sont généralement publiés 2 semaines après la clôture des soumissions.',
      categorie: 'resultats',
      utilisation: 32
    }
  ];

  conversations = [
    {
      id: 1,
      utilisateur: 'Participant #156',
      dernier_message: 'Comment soumettre mon texte ?',
      statut: 'resolu_auto',
      date: '2024-01-15 14:30'
    },
    {
      id: 2,
      utilisateur: 'Participant #89',
      dernier_message: 'Problème de connexion',
      statut: 'transfere_humain',
      date: '2024-01-15 13:15'
    }
  ];

  statistiques = {
    conversations_totales: 234,
    resolutions_auto: 187,
    transferts_humain: 47,
    taux_satisfaction: 92
  };

  nouvelleQuestion = '';
  nouvelleReponse = '';

  ngOnInit() {
    this.chargerDonnees();
  }

  chargerDonnees() {
    this.apiService.getChatbotConfig().subscribe({
      next: (config) => this.chatbotConfig = config,
      error: (err) => console.error('Erreur config:', err)
    });
    
    this.apiService.getChatbotFAQ().subscribe({
      next: (faq) => this.faqItems = faq,
      error: (err) => console.error('Erreur FAQ:', err)
    });
    
    this.apiService.getChatbotConversations().subscribe({
      next: (conv) => this.conversations = conv,
      error: (err) => console.error('Erreur conversations:', err)
    });
    
    this.apiService.getChatbotStats().subscribe({
      next: (stats) => this.statistiques = stats,
      error: (err) => console.error('Erreur stats:', err)
    });
  }

  switchTab(tab: string) {
    this.activeTab = tab;
  }

  sauvegarderConfig() {
    this.apiService.saveChatbotConfig(this.chatbotConfig).subscribe({
      next: () => alert('Configuration sauvegardée'),
      error: (err) => alert('Erreur sauvegarde')
    });
  }

  ajouterFAQ() {
    if (this.nouvelleQuestion && this.nouvelleReponse) {
      const newFAQ = {
        question: this.nouvelleQuestion,
        reponse: this.nouvelleReponse,
        categorie: 'generale'
      };
      
      this.apiService.addChatbotFAQ(newFAQ).subscribe({
        next: () => {
          this.chargerDonnees();
          this.nouvelleQuestion = '';
          this.nouvelleReponse = '';
        },
        error: (err) => alert('Erreur ajout FAQ')
      });
    }
  }

  supprimerFAQ(id: number) {
    this.apiService.deleteChatbotFAQ(id).subscribe({
      next: () => this.chargerDonnees(),
      error: (err) => alert('Erreur suppression')
    });
  }

  voirConversation(conversation: any) {
    console.log('Voir conversation:', conversation);
  }
}