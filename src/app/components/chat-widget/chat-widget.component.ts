import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatSupportService } from '../../services/chat-support.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-widget" [class.open]="isOpen" *ngIf="isLoggedIn">
      <button class="chat-toggle" (click)="toggleChat()" *ngIf="!isOpen">
        <i class="fas fa-comments"></i>
        <span class="notification-badge" *ngIf="unreadCount > 0">{{unreadCount}}</span>
      </button>

      <div class="chat-window" *ngIf="isOpen">
        <div class="chat-header">
          <h4><i class="fas fa-life-ring"></i> Support</h4>
          <button class="close-btn" (click)="toggleChat()"><i class="fas fa-times"></i></button>
        </div>

        <div class="chat-content">
          <div class="messages" #messagesContainer>
            <div class="message bot-message">
              <div class="message-content">
                Bonjour ! Comment puis-je vous aider ?
              </div>
            </div>
            
            <div class="message" 
                 *ngFor="let message of messages"
                 [class.own-message]="message.sender_id === user?.id">
              <div class="message-content">
                <div class="message-text" *ngIf="message.message && message.message.trim()">{{message.message}}</div>
                <div class="message-images" *ngIf="message.images && getImagesFromField(message.images).length > 0">
                  <img *ngFor="let img of getImagesFromField(message.images)" 
                       [src]="getImageUrl(img)" 
                       class="message-image"
                       (click)="openImage(img)"
                       (error)="onImageError($event)">
                </div>
                <div class="message-time">{{formatTime(message.timestamp)}}</div>
              </div>
            </div>
          </div>
          
          <!-- Aperçu des images sélectionnées -->
          <div class="attached-images" *ngIf="selectedImages.length > 0">
            <div class="image-preview" *ngFor="let image of selectedImages; let i = index">
              <img [src]="image.preview" [alt]="image.name">
              <button class="remove-image" (click)="removeImage(i)">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          
          <div class="chat-input">
            <input 
              type="text" 
              [(ngModel)]="newMessage" 
              placeholder="Tapez votre message..."
              (keydown.enter)="sendMessage()"
              [disabled]="!isLoggedIn">
            <button class="attach-btn" (click)="fileInput.click()" [disabled]="!isLoggedIn">
              <i class="fas fa-paperclip"></i>
            </button>
            <button (click)="sendMessage()" [disabled]="(!newMessage.trim() && selectedImages.length === 0) || !isLoggedIn">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
          
          <input #fileInput 
                 type="file" 
                 accept="image/*" 
                 multiple
                 (change)="onFileSelect($event)"
                 style="display: none;">
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
    }

    .chat-toggle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #2196f3;
      color: white;
      border: none;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      position: relative;
      transition: transform 0.2s;
    }

    .chat-toggle:hover {
      transform: scale(1.1);
    }

    .notification-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #f44336;
      color: white;
      border-radius: 50%;
      padding: 2px 6px;
      font-size: 12px;
      font-weight: bold;
    }

    .chat-window {
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .chat-header {
      background: #2196f3;
      color: white;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .close-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 16px;
    }

    .chat-header h4 {
      color: white;
      margin: 0;
    }

    .chat-header h4 i {
      color: white;
    }

    .chat-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: visible !important;
    }

    .messages {
      flex: 1 !important;
      padding: 1rem !important;
      overflow-y: auto !important;
      background: #f5f5f5 !important;
      max-height: 300px !important;
      min-height: 200px !important;
      padding-bottom: 20px !important;
    }

    .message {
      margin-bottom: 1rem;
      display: flex;
    }

    .message.own-message {
      justify-content: flex-end;
    }

    .message-content {
      max-width: 80%;
      background: white;
      padding: 0.75rem;
      border-radius: 10px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .message.own-message .message-content {
      background: #2196f3;
      color: white;
    }

    .bot-message .message-content {
      background: #4caf50;
      color: white;
    }

    .message-text {
      margin-bottom: 0.25rem;
    }

    .message-time {
      font-size: 0.7rem;
      opacity: 0.7;
    }

    .chat-input {
      padding: 1rem !important;
      display: flex !important;
      gap: 0.5rem !important;
      border-top: 1px solid #e0e0e0 !important;
      background: white !important;
      position: sticky !important;
      bottom: 0 !important;
      z-index: 100 !important;
      flex-shrink: 0 !important;
      box-shadow: 0 -2px 5px rgba(0,0,0,0.1) !important;
    }

    .chat-input input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 20px;
    }

    .chat-input button {
      background: #2196f3;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      cursor: pointer;
      min-width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .chat-input button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    .attach-btn {
      background: #f8f9fa !important;
      color: #666 !important;
      border: 1px solid #ddd !important;
    }
    
    .attached-images {
      display: flex !important;
      gap: 8px !important;
      padding: 10px !important;
      flex-wrap: wrap !important;
      background: #f8f9fa !important;
      border-top: 1px solid #e0e0e0 !important;
      border-bottom: 1px solid #e0e0e0 !important;
      height: 80px !important;
      width: 100% !important;
      box-sizing: border-box !important;
      flex-shrink: 0 !important;
      overflow-y: auto !important;
    }
    
    .image-preview {
      position: relative;
      width: 60px;
      height: 60px;
      border-radius: 6px;
      overflow: hidden;
      border: 2px solid #2196f3;
    }
    
    .image-preview img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      display: block !important;
    }
    
    .remove-image {
      position: absolute;
      top: 2px;
      right: 2px;
      background: rgba(255,0,0,0.8);
      border: none;
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      cursor: pointer;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .message-images {
      margin-top: 8px;
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    
    .message-image {
      max-width: 120px;
      max-height: 120px;
      border-radius: 6px;
      cursor: pointer;
      object-fit: cover;
    }

    .login-prompt {
      padding: 1rem;
      text-align: center;
      background: #fff3cd;
      border-top: 1px solid #ffeaa7;
    }

    .login-btn {
      background: #2196f3;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
      .chat-widget {
        bottom: 10px;
        right: 10px;
      }
      
      .chat-window {
        width: calc(100vw - 20px);
        max-width: 350px;
        height: calc(100vh - 100px);
        max-height: 500px;
        position: fixed;
        bottom: 80px;
        right: 10px;
      }
      
      .messages {
        max-height: calc(100vh - 300px) !important;
        min-height: 200px !important;
        padding-bottom: 30px !important;
      }
      
      .attached-images {
        height: 70px !important;
        padding: 8px !important;
        display: flex !important;
        background: #f8f9fa !important;
        border-top: 1px solid #e0e0e0 !important;
        border-bottom: 1px solid #e0e0e0 !important;
        width: 100% !important;
        box-sizing: border-box !important;
        flex-shrink: 0 !important;
        overflow-y: auto !important;
      }
      
      .chat-input {
        padding: 0.75rem !important;
        gap: 0.5rem !important;
        flex-wrap: nowrap !important;
        position: sticky !important;
        bottom: 0 !important;
        background: white !important;
        border-top: 2px solid #e0e0e0 !important;
      }
      
      .chat-input button {
        min-width: 40px !important;
        width: 40px !important;
        height: 40px !important;
        max-width: 40px !important;
        padding: 0 !important;
        font-size: 14px !important;
        flex-shrink: 0 !important;
        border-radius: 8px !important;
      }
      
      .attach-btn {
        min-width: 40px !important;
        width: 40px !important;
        height: 40px !important;
        max-width: 40px !important;
      }
      
      .chat-input input {
        font-size: 16px; /* Évite le zoom sur iOS */
        padding: 0.75rem;
        min-width: 0;
        flex: 1;
        border-radius: 8px;
      }
    }
    
    @media (max-width: 480px) {
      .chat-window {
        width: calc(100vw - 10px);
        height: calc(100vh - 80px);
        bottom: 70px;
        right: 5px;
        left: 5px;
        position: fixed;
      }
      
      .messages {
        max-height: calc(100vh - 250px) !important;
        padding: 0.75rem !important;
      }
      
      .message-content {
        max-width: 90%;
        padding: 0.5rem;
        font-size: 0.9rem;
      }
      
      .chat-input {
        padding: 0.5rem !important;
      }
      
      .chat-input input {
        font-size: 16px;
        padding: 0.6rem;
      }
      
      .chat-input button {
        width: 35px !important;
        height: 35px !important;
        min-width: 35px !important;
        font-size: 12px !important;
      }
    }
  `]
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  isOpen = false;
  messages: any[] = [];
  newMessage = '';
  unreadCount = 0;
  user: any;
  isLoggedIn = false;
  currentConversationId: number | null = null;
  selectedImages: {file: File, preview: string, name: string}[] = [];
  
  private subscriptions: Subscription[] = [];

  constructor(private chatService: ChatSupportService, private cdr: ChangeDetectorRef) {
    const token = localStorage.getItem('cp2i_token');
    this.user = JSON.parse(localStorage.getItem('cp2i_user') || 'null');
    this.isLoggedIn = !!(token && this.user?.id);
  }

  ngOnInit() {
    if (this.isLoggedIn) {
      this.loadOrCreateConversation();
      this.subscribeToUpdates();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.currentConversationId) {
      this.markAsRead();
    }
  }

  loadOrCreateConversation() {
    this.chatService.getConversations().subscribe({
      next: (conversations) => {
        if (conversations.length > 0) {
          const latestConv = conversations[0];
          this.currentConversationId = latestConv.id!;
          this.loadMessages();
        }
      },
      error: (err) => console.error('Erreur conversations:', err)
    });
  }

  loadMessages() {
    if (!this.currentConversationId) return;
    
    this.chatService.getMessages(this.currentConversationId).subscribe({
      next: (messages) => {
        this.messages = messages;
      },
      error: (err) => console.error('Erreur messages:', err)
    });
  }

  sendMessage() {
    if ((!this.newMessage.trim() && this.selectedImages.length === 0) || !this.isLoggedIn) return;

    if (!this.currentConversationId) {
      if (this.selectedImages.length > 0) {
        const formData = new FormData();
        formData.append('subject', 'Support général');
        formData.append('initial_message', this.newMessage || '');
        
        this.selectedImages.forEach((image, index) => {
          formData.append(`image_${index}`, image.file);
        });
        
        this.chatService.createConversationWithImages(formData).subscribe({
          next: (response) => {
            this.currentConversationId = response?.conversation_id || response?.id;
            this.newMessage = '';
            this.selectedImages = [];
            if (this.currentConversationId) {
              this.loadMessages();
            }
          },
          error: (err) => console.error('Erreur création:', err)
        });
      } else {
        this.chatService.createConversation('Support général', this.newMessage).subscribe({
          next: (response) => {
            this.currentConversationId = response?.conversation_id || response?.id;
            this.newMessage = '';
            if (this.currentConversationId) {
              this.loadMessages();
            }
          },
          error: (err) => console.error('Erreur création:', err)
        });
      }
    } else {
      if (this.selectedImages.length > 0) {
        const formData = new FormData();
        formData.append('conversation_id', this.currentConversationId.toString());
        formData.append('message', this.newMessage || '');
        
        this.selectedImages.forEach((image, index) => {
          formData.append(`image_${index}`, image.file);
        });
        
        this.chatService.sendMessageWithImages(formData).subscribe({
          next: (response) => {
            this.newMessage = '';
            this.selectedImages = [];
            this.loadMessages();
          },
          error: (err) => console.error('Erreur envoi:', err)
        });
      } else {
        this.chatService.sendMessage(this.currentConversationId, this.newMessage).subscribe({
          next: (response) => {
            this.newMessage = '';
            this.loadMessages();
          },
          error: (err) => console.error('Erreur envoi:', err)
        });
      }
    }
  }

  markAsRead() {
    if (this.currentConversationId) {
      this.chatService.markAsRead(this.currentConversationId).subscribe();
    }
  }

  redirectToLogin() {
    window.location.href = '/login';
  }

  private subscribeToUpdates() {
    const unreadSub = this.chatService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    this.subscriptions.push(unreadSub);
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  onFileSelect(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.processFiles(files);
  }
  
  processFiles(files: File[]) {
    console.log('Processing files:', files.length);
    files.forEach(file => {
      if (this.selectedImages.length >= 3) return;
      
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
        console.log('Image added, total:', this.selectedImages.length);
        this.cdr.detectChanges(); // Force la détection des changements
      };
      reader.readAsDataURL(file);
    });
  }
  
  removeImage(index: number) {
    this.selectedImages.splice(index, 1);
  }
  
  getMessageText(message: string): string {
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
      const parsed = JSON.parse(imagesField);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
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