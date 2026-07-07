import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatSupportService, ChatConversation, ChatMessage } from '../../services/chat-support.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-support.component.html',
  styleUrls: ['./chat-support.component.css']
})
export class ChatSupportComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  conversations: ChatConversation[] = [];
  messages: ChatMessage[] = [];
  selectedConversation: ChatConversation | null = null;
  newMessage = '';
  newSubject = '';
  newInitialMessage = '';
  showNewChatForm = false;
  selectedImages: {file: File, preview: string, name: string}[] = [];
  newChatImages: {file: File, preview: string, name: string}[] = [];
  
  user: any;
  isAdmin = false;
  unreadCount = 0;
  
  private subscriptions: Subscription[] = [];

  constructor(private chatService: ChatSupportService) {
    const userData = localStorage.getItem('cp2i_user');
    this.user = userData ? JSON.parse(userData) : null;
    this.isAdmin = this.user && this.user.role === 'admin';
  }

  ngOnInit() {
    this.loadConversations();
    this.subscribeToUpdates();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadConversations() {
    this.chatService.getConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations;
        if (conversations.length > 0 && !this.selectedConversation) {
          this.selectConversation(conversations[0]);
        }
      },
      error: (err) => console.error('Erreur chargement conversations:', err)
    });
  }

  selectConversation(conversation: ChatConversation) {
    this.selectedConversation = conversation;
    this.loadMessages(conversation.id!);
    this.markAsRead(conversation.id!);
  }

  loadMessages(conversationId: number) {
    this.chatService.getMessages(conversationId).subscribe({
      next: (messages) => {
        this.messages = messages;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => console.error('Erreur chargement messages:', err)
    });
  }

  sendMessage() {
    if ((!this.newMessage.trim() && this.selectedImages.length === 0) || !this.selectedConversation) return;

    const formData = new FormData();
    formData.append('conversation_id', this.selectedConversation.id!.toString());
    formData.append('message', this.newMessage);
    
    this.selectedImages.forEach((image, index) => {
      formData.append(`image_${index}`, image.file);
    });

    this.chatService.sendMessageWithImages(formData).subscribe({
      next: () => {
        this.newMessage = '';
        this.selectedImages = [];
        this.loadMessages(this.selectedConversation!.id!);
        this.loadConversations();
      },
      error: (err: any) => console.error('Erreur envoi message:', err)
    });
  }

  createNewConversation() {
    if (!this.newSubject.trim() || !this.newInitialMessage.trim()) return;

    const formData = new FormData();
    formData.append('subject', this.newSubject);
    formData.append('initial_message', this.newInitialMessage);
    
    this.newChatImages.forEach((image, index) => {
      formData.append(`image_${index}`, image.file);
    });

    this.chatService.createConversationWithImages(formData).subscribe({
      next: (response: any) => {
        this.newSubject = '';
        this.newInitialMessage = '';
        this.newChatImages = [];
        this.showNewChatForm = false;
        this.loadConversations();
      },
      error: (err: any) => console.error('Erreur création conversation:', err)
    });
  }

  markAsRead(conversationId: number) {
    this.chatService.markAsRead(conversationId).subscribe({
      next: () => {
        const conv = this.conversations.find(c => c.id === conversationId);
        if (conv) conv.unread_count = 0;
      },
      error: (err) => console.error('Erreur marquage lu:', err)
    });
  }

  assignToMe(conversationId: number) {
    if (!this.isAdmin) return;
    
    this.chatService.assignConversation(conversationId, this.user.id).subscribe({
      next: () => this.loadConversations(),
      error: (err) => console.error('Erreur assignation:', err)
    });
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

  private subscribeToUpdates() {
    const unreadSub = this.chatService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    this.subscriptions.push(unreadSub);
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    }
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
    const target = event.target as HTMLSelectElement;
    this.setPriority(conversationId, target.value);
    event.stopPropagation();
  }

  onEnterKey(event: Event) {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.shiftKey) {
      this.sendMessage();
      event.preventDefault();
    }
  }

  toggleNewChatForm() {
    this.showNewChatForm = true;
  }

  onFileSelect(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.processFiles(files, this.selectedImages);
  }

  onNewChatFileSelect(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.processFiles(files, this.newChatImages);
  }

  processFiles(files: File[], targetArray: {file: File, preview: string, name: string}[]) {
    files.forEach(file => {
      if (targetArray.length >= 5) return;
      
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
        targetArray.push({
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

  removeNewChatImage(index: number) {
    this.newChatImages.splice(index, 1);
  }
  
  getMessageText(message: string): string {
    if (!message) return '';
    if (message.includes('[IMAGES]')) {
      const text = message.split('[IMAGES]')[0].replace(/\\n/g, '\n').trim();
      return text || '';
    }
    return message.replace(/\\n/g, '\n');
  }
  
  getMessageImages(message: string): string[] {
    if (message.includes('[IMAGES]')) {
      try {
        const imagesPart = message.split('[IMAGES]')[1];
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
  
  getImagesFromField(imagesField: string): string[] {
    if (!imagesField) return [];
    try {
      // Décoder les entités HTML et les échappements
      let decoded = imagesField.replace(/&quot;/g, '"');
      decoded = decoded.split('\\/').join('/');
      decoded = decoded.split('\\"').join('"');
      const parsed = JSON.parse(decoded);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  
  getAllImages(message: any): string[] {
    const images: string[] = [];
    
    // Images du champ images (nouveau format)
    if (message.images) {
      const newFormatImages = this.getImagesFromField(message.images);
      images.push(...newFormatImages);
    }
    
    // Images dans le message (ancien format)
    if (message.message && message.message.includes('[IMAGES]')) {
      const oldFormatImages = this.getMessageImages(message.message);
      images.push(...oldFormatImages);
    }
    
    return images;
  }
  
  onImageError(event: any) {
    event.target.style.display = 'none';
    // Masquer le conteneur parent si c'est la seule image
    const parent = event.target.closest('.message-images');
    if (parent && parent.children.length === 1) {
      parent.style.display = 'none';
    }
  }
}