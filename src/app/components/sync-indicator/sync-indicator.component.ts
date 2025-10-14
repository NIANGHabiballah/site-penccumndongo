import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DataPersistenceService } from '../../services/data-persistence.service';
import { SyncStatus } from '../../types/dashboard.types';

@Component({
  selector: 'app-sync-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sync-indicator" [ngClass]="getSyncClass()">
      <div class="sync-icon">
        <i class="fas" [ngClass]="getSyncIcon()"></i>
      </div>
      <div class="sync-info">
        <div class="sync-status">{{getSyncStatusText()}}</div>
        <div class="sync-details" *ngIf="syncStatus.lastSync">
          {{formatLastSync()}}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sync-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: white;
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      font-size: 0.8rem;
      border: 2px solid #28a745;
    }

    .sync-indicator.offline {
      border-color: #dc3545;
    }

    .sync-icon {
      color: #28a745;
    }

    .sync-indicator.offline .sync-icon {
      color: #dc3545;
    }

    .sync-status {
      font-weight: 600;
      color: #2c3e50;
    }

    .sync-details {
      font-size: 0.7rem;
      color: #6c757d;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class SyncIndicatorComponent implements OnInit, OnDestroy {
  syncStatus: SyncStatus = {
    lastSync: null,
    isOnline: true,
    pendingChanges: 0
  };
  
  private subscription?: Subscription;

  constructor(private persistenceService: DataPersistenceService) {}

  ngOnInit() {
    this.subscription = this.persistenceService.syncStatus$.subscribe(status => {
      this.syncStatus = status;
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  getSyncClass(): string {
    return this.syncStatus.isOnline ? 'online' : 'offline';
  }

  getSyncIcon(): string {
    return this.syncStatus.isOnline ? 'fa-wifi' : 'fa-wifi-slash';
  }

  getSyncStatusText(): string {
    return this.syncStatus.isOnline ? 'En ligne' : 'Hors ligne';
  }

  formatLastSync(): string {
    if (!this.syncStatus.lastSync) return '';
    
    const now = new Date();
    const diff = now.getTime() - this.syncStatus.lastSync.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Sync maintenant';
    if (minutes < 60) return `Sync il y a ${minutes}min`;
    return 'Sync ancienne';
  }
}