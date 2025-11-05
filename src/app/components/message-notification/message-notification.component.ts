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
      <span class="notification-badge">{{unreadCount}}</span>
    </div>
  `,
  styles: [`
    .message-notification {
      position: relative;
      display: inline-flex;
      align-items: center;
      margin-left: 0.5rem !important;
    }
    
    .notification-badge {
      background: #FF7F1A !important;
      color: white !important;
      border-radius: 50% !important;
      padding: 2px 6px !important;
      font-size: 0.7rem !important;
      font-weight: bold !important;
      min-width: 18px !important;
      text-align: center !important;
      line-height: 1.2 !important;
      display: inline-block !important;
      z-index: 10 !important;
      position: relative !important;
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