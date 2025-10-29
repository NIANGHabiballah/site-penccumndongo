import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticipantMessagesService } from '../../services/participant-messages.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-message-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="message-notification" *ngIf="unreadCount > 0">
      <i class="fas fa-envelope"></i>
      <span class="notification-badge">{{unreadCount}}</span>
    </div>
  `,
  styles: [`
    .message-notification {
      position: relative;
      display: inline-flex;
      align-items: center;
      color: #2196f3;
      cursor: pointer;
      transition: color 0.2s;
      margin-left: 0.5rem !important;
    }
    
    .message-notification:hover {
      color: #1976d2;
    }
    
    .notification-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #f44336;
      color: white;
      border-radius: 50%;
      padding: 2px 6px;
      font-size: 0.7rem;
      font-weight: bold;
      min-width: 16px;
      text-align: center;
      line-height: 1.2;
    }
    
    .fa-envelope {
      font-size: 1.2rem;
    }
  `]
})
export class MessageNotificationComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  private subscription?: Subscription;

  constructor(private messagesService: ParticipantMessagesService) {}

  ngOnInit() {
    // Initialiser le service
    this.messagesService.initialize();
    
    // S'abonner aux notifications
    this.subscription = this.messagesService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}