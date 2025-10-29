import { Component, OnInit, OnDestroy } from '@angular/core';
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
                <div class="message-text">{{message.message}}</div>
                <div class="message-time">{{formatTime(message.timestamp)}}</div>
              </div>
            </div>
          </div>

          <div class="chat-input">
            <input 
              type="text" 
              [(ngModel)]="newMessage" 
              placeholder="Tapez votre message..."
              (keydown.enter)="sendMessage()"
              [disabled]="!isLoggedIn">
            <button (click)="sendMessage()" [disabled]="!newMessage.trim() || !isLoggedIn">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>


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
    }

    .messages {
      flex: 1 !important;
      padding: 1rem !important;
      overflow-y: auto !important;
      background: #f5f5f5 !important;
      max-height: 350px !important;
      min-height: 200px !important;
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
      z-index: 10 !important;
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
    }

    .chat-input button:disabled {
      background: #ccc;
      cursor: not-allowed;
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
      .chat-window {
        width: 300px;
        height: 400px;
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
  
  private subscriptions: Subscription[] = [];

  constructor(private chatService: ChatSupportService) {
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
    if (!this.newMessage.trim() || !this.isLoggedIn) return;

    console.log('Envoi message:', this.newMessage, 'ConversationId:', this.currentConversationId);

    if (!this.currentConversationId) {
      this.chatService.createConversation('Support général', this.newMessage).subscribe({
        next: (response) => {
          console.log('Conversation créée:', response);
          this.currentConversationId = response.conversation_id;
          this.newMessage = '';
          this.loadMessages();
        },
        error: (err) => console.error('Erreur création:', err)
      });
    } else {
      this.chatService.sendMessage(this.currentConversationId, this.newMessage).subscribe({
        next: (response) => {
          console.log('Message envoyé:', response);
          this.newMessage = '';
          this.loadMessages();
        },
        error: (err) => console.error('Erreur envoi:', err)
      });
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
}