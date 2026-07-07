import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ParticipantMessagesService, ParticipantMessage } from '../../services/participant-messages.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-participant-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './participant-messages.component.html',
  styleUrls: ['./participant-messages.component.css']
})
export class ParticipantMessagesComponent implements OnInit, OnDestroy {
  messages: ParticipantMessage[] = [];
  selectedMessage: ParticipantMessage | null = null;
  unreadCount = 0;
  loading = false;
  searchTerm = '';
  filterType = 'all'; // all, read, unread
  
  private subscriptions: Subscription[] = [];

  constructor(private messagesService: ParticipantMessagesService, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.loadMessages();
    this.subscribeToUpdates();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadMessages() {
    this.loading = true;
    this.messagesService.getMessages().subscribe({
      next: (messages) => {
        this.messages = messages;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement messages:', err);
        this.loading = false;
      }
    });
  }

  subscribeToUpdates() {
    // S'abonner aux messages
    const messagesSub = this.messagesService.messages$.subscribe(messages => {
      this.messages = messages;
    });
    
    // S'abonner au compteur de non lus
    const unreadSub = this.messagesService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    
    this.subscriptions.push(messagesSub, unreadSub);
  }

  selectMessage(message: ParticipantMessage) {
    this.selectedMessage = message;
    
    // Marquer comme lu si pas encore lu
    if (!message.is_read) {
      this.messagesService.markAsRead(message.id).subscribe({
        next: (success) => {
          if (success) {
            message.is_read = true;
            message.read_at = new Date().toISOString();
          }
        },
        error: (err) => console.error('Erreur marquage lu:', err)
      });
    }
  }

  markAllAsRead() {
    if (this.unreadCount === 0) return;
    
    this.messagesService.markAllAsRead().subscribe({
      next: (success) => {
        if (success) {
          this.messages = this.messages.map(msg => ({
            ...msg,
            is_read: true,
            read_at: new Date().toISOString()
          }));
        }
      },
      error: (err) => console.error('Erreur marquage tous lus:', err)
    });
  }

  getFilteredMessages(): ParticipantMessage[] {
    let filtered = this.messages;
    
    // Filtrer par terme de recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(msg => 
        msg.subject.toLowerCase().includes(term) ||
        msg.content.toLowerCase().includes(term) ||
        msg.sender_nom.toLowerCase().includes(term) ||
        msg.sender_prenom.toLowerCase().includes(term)
      );
    }
    
    // Filtrer par statut de lecture
    if (this.filterType === 'read') {
      filtered = filtered.filter(msg => msg.is_read);
    } else if (this.filterType === 'unread') {
      filtered = filtered.filter(msg => !msg.is_read);
    }
    
    return filtered;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Aujourd\'hui à ' + date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 2) {
      return 'Hier à ' + date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  formatContent(content: string): string {
    // Supprimer les balises d'images, le mot "image" au début et les \n
    let cleanContent = content.replace(/\[IMAGES\]\[.*?\]/g, '').replace(/^image\s*/i, '').replace(/\\n/g, ' ').replace(/\n/g, ' ').trim();
    // Limiter à 100 caractères pour l'aperçu
    return cleanContent.length > 100 ? cleanContent.substring(0, 100) + '...' : cleanContent;
  }

  processMessageContent(content: string): SafeHtml {
    console.log('DEBUG - Contenu original:', content);
    
    const imagePattern = /\[IMAGES\](\[.*?\])/;
    const match = content.match(imagePattern);
    
    console.log('DEBUG - Match trouvé:', match);
    
    if (match) {
      try {
        let textContent = content.replace(imagePattern, '').trim();
        console.log('DEBUG - Texte après suppression pattern:', textContent);
        
        // Supprimer le mot "image" au début s'il existe
        textContent = textContent.replace(/^image\s*/i, '');
        // Supprimer les \n échappés et les vrais \n
        textContent = textContent.replace(/\\n/g, '').replace(/\n/g, '').trim();
        console.log('DEBUG - Texte après suppression "image":', textContent);
        
        const imageUrls = JSON.parse(match[1]);
        console.log('DEBUG - URLs d\'images parsées:', imageUrls);
        
        let html = textContent.replace(/\n/g, '<br>');
        
        if (imageUrls && imageUrls.length > 0) {
          html += '<div class="message-images">';
          imageUrls.forEach((url: string) => {
            const fullUrl = url.startsWith('http') ? url : `https://penccumndongo.com/${url}`;
            console.log('DEBUG - URL complète générée:', fullUrl);
            html += `<a href="${fullUrl}" target="_blank"><img src="${fullUrl}" alt="Image du message" class="message-image" style="max-width: 180px; max-height: 120px; width: 180px; height: 120px; object-fit: cover; border-radius: 8px; cursor: pointer; display: block; margin: 10px auto;"></a>`;
          });
          html += '</div>';
        }
        
        console.log('DEBUG - HTML final généré:', html);
        return this.sanitizer.bypassSecurityTrustHtml(html);
      } catch (e) {
        console.error('DEBUG - Erreur lors du parsing:', e);
        return this.sanitizer.bypassSecurityTrustHtml(content.replace(/\n/g, '<br>'));
      }
    }
    
    console.log('DEBUG - Aucune image trouvée, retour du texte simple');
    return this.sanitizer.bypassSecurityTrustHtml(content.replace(/\n/g, '<br>'));
  }

  getSenderName(message: ParticipantMessage): string {
    return `${message.sender_prenom} ${message.sender_nom}`;
  }

  closeMessage() {
    this.selectedMessage = null;
  }

  refreshMessages() {
    this.loadMessages();
  }

  getMessageTypeIcon(message: ParticipantMessage): string {
    if (message.send_to_all) {
      return 'fas fa-bullhorn'; // Annonce générale
    }
    return 'fas fa-envelope'; // Message personnel
  }

  getUnreadMessages(): ParticipantMessage[] {
    return this.messages.filter(msg => !msg.is_read);
  }

  getReadMessages(): ParticipantMessage[] {
    return this.messages.filter(msg => msg.is_read);
  }

  getMessageText(content: string): string {
    if (!content) return '';
    let text = content;
    if (content.includes('[IMAGES]')) {
      text = content.split('[IMAGES]')[0].trim();
    }
    // Garder l'espacement original exactement comme envoyé
    return text.replace(/\\n/g, '<br>');
  }
  
  getMessageImages(content: string): string[] {
    if (content.includes('[IMAGES]')) {
      try {
        const imagesPart = content.split('[IMAGES]')[1];
        return JSON.parse(imagesPart) || [];
      } catch (e) {
        return [];
      }
    }
    return [];
  }
  
  getImageUrl(imagePath: string): string {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `https://penccumndongo.com/${imagePath}`;
  }
  
  openImage(imagePath: string) {
    window.open(this.getImageUrl(imagePath), '_blank');
  }
}