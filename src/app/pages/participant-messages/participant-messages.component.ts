import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  constructor(private messagesService: ParticipantMessagesService) {}

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
    // Limiter à 100 caractères pour l'aperçu
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
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
}