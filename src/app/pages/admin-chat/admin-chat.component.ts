import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatSupportService } from '../../services/chat-support.service';

@Component({
  selector: 'app-admin-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-chat.component.html',
  styleUrls: ['./admin-chat.component.css']
})
export class AdminChatComponent implements OnInit {
  activeTab = 'conversations';
  showAddReplyForm = false;
  
  conversations: any[] = [];
  selectedConversation: any = null;
  messages: any[] = [];
  newMessage = '';
  availableAdmins: any[] = [];
  showAssignMenu: number | null = null;
  
  quickReplies: any[] = [
    { id: 1, title: 'Salutation', message: 'Bonjour ! Comment puis-je vous aider ?', category: 'general' },
    { id: 2, title: 'Inscription', message: 'Pour vous inscrire, rendez-vous sur la page inscription.', category: 'inscription' },
    { id: 3, title: 'Problème technique', message: 'Pouvez-vous me donner plus de détails sur le problème ?', category: 'technique' }
  ];
  
  newQuickReply = { title: '', message: '', category: 'general' };
  
  stats = {
    total_conversations: 0,
    open_conversations: 0,
    assigned_conversations: 0,
    closed_conversations: 0,
    avg_response_time: 0
  };

  constructor(private chatService: ChatSupportService) {}

  ngOnInit() {
    this.loadAvailableAdmins();
    this.loadConversations();
    this.loadStats();
    
    // Polling temps réel toutes les 3 secondes
    setInterval(() => {
      this.loadConversations();
      if (this.selectedConversation) {
        this.loadMessages(this.selectedConversation.id);
      }
    }, 3000);
  }

  switchTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'conversations') {
      this.loadConversations();
    } else if (tab === 'stats') {
      this.loadStats();
    }
  }

  loadConversations() {
    
    this.chatService.getConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations;
      },
      error: (err) => {
        console.error('Erreur conversations:', err);
        console.log('Status:', err.status);
      }
    });
  }

  selectConversation(conversation: any) {
    this.selectedConversation = conversation;
    this.loadMessages(conversation.id);
    this.markAsRead(conversation.id);
  }

  loadMessages(conversationId: number) {
    this.chatService.getMessages(conversationId).subscribe({
      next: (messages) => {
        this.messages = messages;
      },
      error: (err) => console.error('Erreur messages:', err)
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;

    this.chatService.sendMessage(this.selectedConversation.id, this.newMessage).subscribe({
      next: () => {
        this.newMessage = '';
        this.loadMessages(this.selectedConversation.id);
        this.loadConversations();
      },
      error: (err) => console.error('Erreur envoi:', err)
    });
  }

  useQuickReply(reply: any) {
    this.newMessage = reply.message;
  }

  loadAvailableAdmins() {
    this.chatService.getAvailableAdmins().subscribe({
      next: (admins) => {
        this.availableAdmins = admins;
      },
      error: (err) => {
        console.error('Erreur chargement admins:', err);
        // Fallback en cas d'erreur
        this.availableAdmins = [
          { id: 13, prenom: 'Penccum', nom: 'NDONGO' },
          { id: 16, prenom: 'CP2i', nom: 'Admin' },
          { id: 17, prenom: 'Admin', nom: 'Test' }
        ];
      }
    });
  }

  onAdminSelect(conversationId: number, event: Event) {
    const target = event.target as HTMLSelectElement;
    const adminId = parseInt(target.value);
    
    if (adminId) {
      this.chatService.assignConversation(conversationId, adminId).subscribe({
        next: () => {
          this.loadConversations();
          target.value = ''; // Reset select
        },
        error: (err) => console.error('Erreur assignation:', err)
      });
    }
  }

  closeConversation(conversationId: number) {
    this.chatService.closeConversation(conversationId).subscribe({
      next: () => {
        this.loadConversations();
        if (this.selectedConversation?.id === conversationId) {
          this.selectedConversation = null;
          this.messages = [];
        }
      },
      error: (err) => console.error('Erreur fermeture:', err)
    });
  }

  setPriority(conversationId: number, priority: string) {
    this.chatService.setPriority(conversationId, priority).subscribe({
      next: () => this.loadConversations(),
      error: (err) => console.error('Erreur priorité:', err)
    });
  }

  markAsRead(conversationId: number) {
    this.chatService.markAsRead(conversationId).subscribe({
      next: () => {
        const conv = this.conversations.find(c => c.id === conversationId);
        if (conv) conv.unread_count = 0;
      },
      error: (err) => console.error('Erreur marquage:', err)
    });
  }

  addQuickReply() {
    if (!this.newQuickReply.title.trim() || !this.newQuickReply.message.trim()) return;

    const newReply = {
      id: Date.now(),
      ...this.newQuickReply
    };
    this.quickReplies.push(newReply);
    this.newQuickReply = { title: '', message: '', category: 'general' };
  }

  deleteQuickReply(id: number) {
    this.quickReplies = this.quickReplies.filter(r => r.id !== id);
  }

  toggleAddForm() {
    this.showAddReplyForm = !this.showAddReplyForm;
  }

  closeAddForm() {
    this.showAddReplyForm = false;
  }

  loadStats() {
    this.chatService.getSupportStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (err) => {
        console.error('Erreur stats:', err);
        console.log('Status stats:', err.status);
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'open': return '#ff9800';
      case 'assigned': return '#2196f3';
      case 'closed': return '#4caf50';
      default: return '#757575';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(timestamp: string): string {
    return new Date(timestamp).toLocaleDateString('fr-FR');
  }

  onPriorityChange(conversationId: number, event: Event) {
    event.stopPropagation();
    const target = event.target as HTMLSelectElement;
    this.setPriority(conversationId, target.value);
  }



  onCloseConversation(conversationId: number, event: Event) {
    event.stopPropagation();
    this.closeConversation(conversationId);
  }
}