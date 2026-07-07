import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class AdminChatComponent implements OnInit, OnDestroy {
  activeTab = 'conversations';
  showAddReplyForm = false;
  isMobile = false;
  showDeleteConfirm = false;
  conversationToDelete: number | null = null;
  isDeleting = false;
  pollingInterval: any;
  pollingEnabled = true;
  
  conversations: any[] = [];
  selectedConversation: any = null;
  messages: any[] = [];
  newMessage = '';
  availableAdmins: any[] = [];
  showAssignMenu: number | null = null;
  selectedImages: {file: File, preview: string, name: string}[] = [];
  
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
    this.checkMobile();
    this.loadAvailableAdmins();
    this.loadConversations();
    this.loadStats();
    
    // Polling temps réel toutes les 3 secondes
    this.pollingInterval = setInterval(() => {
      if (this.pollingEnabled) {
        this.loadConversations();
        if (this.selectedConversation) {
          this.loadMessages(this.selectedConversation.id);
        }
      }
    }, 3000);

    // Écouter les changements de taille d'écran
    window.addEventListener('resize', () => this.checkMobile());
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  goBackToList() {
    this.selectedConversation = null;
    this.messages = [];
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
    if ((!this.newMessage.trim() && this.selectedImages.length === 0) || !this.selectedConversation) return;

    const formData = new FormData();
    formData.append('conversation_id', this.selectedConversation.id.toString());
    formData.append('message', this.newMessage);
    
    this.selectedImages.forEach((image, index) => {
      formData.append(`image_${index}`, image.file);
    });

    this.chatService.sendMessageWithImages(formData).subscribe({
      next: () => {
        this.newMessage = '';
        this.selectedImages = [];
        this.loadMessages(this.selectedConversation.id);
        this.loadConversations();
        
        // Notification spécifique au chat support
        this.showNotification('Message envoyé avec succès dans la conversation');
      },
      error: (err) => {
        console.error('Erreur envoi:', err);
        this.showNotification('Erreur lors de l\'envoi du message', 'error');
      }
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

  // Méthodes pour gérer les images
  getAllImages(message: any): string[] {
    if (!message.images) {
      return [];
    }

    try {
      if (typeof message.images === 'string') {
        return JSON.parse(message.images);
      } else if (Array.isArray(message.images)) {
        return message.images;
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  onFileSelect(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.processFiles(files);
  }

  processFiles(files: File[]) {
    files.forEach(file => {
      if (this.selectedImages.length >= 5) return;
      
      if (!file.type.startsWith('image/')) {
        alert('Seules les images sont autorisées');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert(`L'image ${file.name} est trop volumineuse (max 5MB)`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImages.push({
          file,
          preview: e.target?.result as string,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    this.selectedImages.splice(index, 1);
  }

  formatMessage(message: string): string {
    if (!message) return '';
    return message.replace(/\\n/g, '<br>').replace(/\n/g, '<br>').replace(/\\r\\n/g, '<br>').replace(/\r\n/g, '<br>');
  }

  confirmDeleteConversation(conversationId: number, event: Event) {
    event.stopPropagation();
    this.conversationToDelete = conversationId;
    this.showDeleteConfirm = true;
  }

  deleteConversation() {
    if (!this.conversationToDelete || this.isDeleting) return;

    this.isDeleting = true;
    // Désactiver le polling pendant la suppression
    this.pollingEnabled = false;
    
    this.chatService.deleteConversation(this.conversationToDelete).subscribe({
      next: (response) => {
        console.log('Suppression réussie:', response);
        
        // Mise à jour immédiate de la liste locale
        this.conversations = this.conversations.filter(conv => conv.id !== this.conversationToDelete);
        
        // Si la conversation supprimée était sélectionnée, la désélectionner
        if (this.selectedConversation?.id === this.conversationToDelete) {
          this.selectedConversation = null;
          this.messages = [];
        }
        
        this.loadStats();
        
        this.isDeleting = false;
        this.cancelDelete();
        
        // Réactiver le polling après 5 secondes
        setTimeout(() => {
          this.pollingEnabled = true;
        }, 5000);
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
        console.log('Détails erreur:', err.error);
        alert('Erreur lors de la suppression de la conversation: ' + (err.error?.message || err.message));
        this.isDeleting = false;
        this.pollingEnabled = true; // Réactiver immédiatement en cas d'erreur
        this.cancelDelete();
      }
    });
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.conversationToDelete = null;
  }

  showNotification(message: string, type: 'success' | 'error' = 'success') {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.className = `toast-notification ${type}`;
    notification.innerHTML = `
      <div class="toast-content">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Afficher la notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Masquer et supprimer après 3 secondes
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
}