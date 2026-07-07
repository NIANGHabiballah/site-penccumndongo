import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RealtimeSyncService, RealTimeEvent } from '../../services/realtime-sync.service';

@Component({
  selector: 'app-realtime-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <!-- Indicateur de connexion -->
      <div class="connection-status" [class.connected]="isConnected" [class.disconnected]="!isConnected">
        <i class="fas" [ngClass]="isConnected ? 'fa-wifi' : 'fa-wifi-slash'"></i>
        <span>{{isConnected ? 'Connecté' : 'Déconnecté'}}</span>
      </div>

      <!-- Dernière activité -->
      <div class="last-activity" *ngIf="lastActivity">
        <i class="fas fa-clock"></i>
        <span>{{lastActivity}}</span>
      </div>

      <!-- Notifications en temps réel -->
      <div class="notifications-list" *ngIf="recentEvents.length > 0">
        <div class="notification-item" 
             *ngFor="let event of recentEvents; trackBy: trackByEvent"
             [ngClass]="getEventClass(event.type)"
             [@slideIn]>
          <div class="notification-icon">
            <i class="fas" [ngClass]="getEventIcon(event.type)"></i>
          </div>
          <div class="notification-content">
            <div class="notification-message">{{event.data.message}}</div>
            <div class="notification-time">{{formatTime(event.timestamp)}}</div>
          </div>
        </div>
      </div>

      <!-- Bouton pour voir toutes les notifications -->
      <button class="view-all-btn" (click)="toggleAllNotifications()" *ngIf="recentEvents.length > 3">
        <i class="fas fa-list"></i>
        Voir tout ({{recentEvents.length}})
      </button>
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      z-index: 1000;
      font-family: 'Segoe UI', sans-serif;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      transition: all 0.3s ease;
    }

    .connection-status.connected {
      background: #d4edda;
      color: #155724;
    }

    .connection-status.disconnected {
      background: #f8d7da;
      color: #721c24;
    }

    .last-activity {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #e7f3ff;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #0c5460;
      margin-bottom: 1rem;
      border-left: 4px solid #0380C2;
    }

    .notifications-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      margin-bottom: 0.5rem;
      border-left: 4px solid #0380C2;
      transition: all 0.3s ease;
    }

    .notification-item:hover {
      transform: translateX(-5px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .notification-item.participant_added {
      border-left-color: #28a745;
    }

    .notification-item.texte_submitted {
      border-left-color: #FF7F1A;
    }

    .notification-item.texte_evaluated {
      border-left-color: #6f42c1;
    }

    .notification-item.message_sent {
      border-left-color: #17a2b8;
    }

    .notification-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .participant_added .notification-icon {
      background: #28a745;
    }

    .texte_submitted .notification-icon {
      background: #FF7F1A;
    }

    .texte_evaluated .notification-icon {
      background: #6f42c1;
    }

    .message_sent .notification-icon {
      background: #17a2b8;
    }

    .notification-content {
      flex: 1;
    }

    .notification-message {
      font-weight: 500;
      color: #2c3e50;
      margin-bottom: 0.25rem;
      line-height: 1.4;
    }

    .notification-time {
      font-size: 0.8rem;
      color: #6c757d;
    }

    .view-all-btn {
      width: 100%;
      padding: 0.75rem;
      background: #0380C2;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;
      transition: all 0.3s ease;
    }

    .view-all-btn:hover {
      background: #026aa7;
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .notifications-container {
        position: relative;
        top: auto;
        right: auto;
        width: 100%;
        margin: 1rem 0;
      }
    }
  `],
  animations: [
    // Animation d'entrée pour les notifications
  ]
})
export class RealtimeNotificationsComponent implements OnInit, OnDestroy {
  isConnected = false;
  lastActivity = '';
  recentEvents: RealTimeEvent[] = [];
  showAllNotifications = false;
  
  private subscriptions: Subscription[] = [];

  constructor(private realtimeService: RealtimeSyncService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.realtimeService.connectionStatus$.subscribe(status => {
        this.isConnected = status;
      })
    );

    this.subscriptions.push(
      this.realtimeService.lastActivity$.subscribe(activity => {
        this.lastActivity = activity;
      })
    );

    this.subscriptions.push(
      this.realtimeService.events$.subscribe(event => {
        this.addNotification(event);
      })
    );

    // Charger les événements récents
    this.recentEvents = this.realtimeService.getRecentEvents(5);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  addNotification(event: RealTimeEvent) {
    this.recentEvents.unshift(event);
    
    // Garder seulement les 10 dernières notifications
    if (this.recentEvents.length > 10) {
      this.recentEvents = this.recentEvents.slice(0, 10);
    }

    // Auto-suppression après 30 secondes pour les notifications moins importantes
    if (event.type !== 'texte_evaluated') {
      setTimeout(() => {
        this.removeNotification(event);
      }, 30000);
    }
  }

  removeNotification(event: RealTimeEvent) {
    const index = this.recentEvents.findIndex(e => 
      e.timestamp === event.timestamp && e.type === event.type
    );
    if (index > -1) {
      this.recentEvents.splice(index, 1);
    }
  }

  getEventClass(type: string): string {
    return type;
  }

  getEventIcon(type: string): string {
    const icons = {
      'participant_added': 'fa-user-plus',
      'texte_submitted': 'fa-file-alt',
      'texte_evaluated': 'fa-star',
      'message_sent': 'fa-envelope',
      'stats_updated': 'fa-chart-line'
    };
    return icons[type as keyof typeof icons] || 'fa-bell';
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  toggleAllNotifications() {
    this.showAllNotifications = !this.showAllNotifications;
    if (this.showAllNotifications) {
      this.recentEvents = this.realtimeService.getRecentEvents(20);
    } else {
      this.recentEvents = this.realtimeService.getRecentEvents(5);
    }
  }

  trackByEvent(index: number, event: RealTimeEvent): string {
    return event.timestamp + event.type;
  }
}