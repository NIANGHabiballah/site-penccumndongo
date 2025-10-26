import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SyncStatus } from '../types/dashboard.types';

@Injectable({
  providedIn: 'root'
})
export class DataPersistenceService {
  private readonly STORAGE_KEYS = {
    PARTICIPANTS: 'cp2i_participants',
    TEXTES: 'cp2i_textes',
    CORRECTEURS: 'cp2i_correcteurs',
    MESSAGES: 'cp2i_messages',
    STATS: 'cp2i_stats',
    LAST_SYNC: 'cp2i_last_sync'
  };

  private syncStatusSubject = new BehaviorSubject<SyncStatus>({
    lastSync: null,
    isOnline: navigator.onLine,
    pendingChanges: 0
  });

  constructor() {
    this.initializeOnlineStatus();
    this.loadLastSyncTime();
  }

  get syncStatus$(): Observable<SyncStatus> {
    return this.syncStatusSubject.asObservable();
  }

  // Sauvegarde des données
  saveData(key: string, data: any): void {
    try {
      const serializedData = JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      });
      localStorage.setItem(this.STORAGE_KEYS[key as keyof typeof this.STORAGE_KEYS] || key, serializedData);
      this.updateSyncStatus();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }

  // Chargement des données
  loadData(key: string): any {
    try {
      const item = localStorage.getItem(this.STORAGE_KEYS[key as keyof typeof this.STORAGE_KEYS] || key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      
      // Vérifier si les données ne sont pas trop anciennes (24h)
      const dataAge = new Date().getTime() - new Date(parsed.timestamp).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 heures
      
      if (dataAge > maxAge) {
        this.removeData(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      return null;
    }
  }

  // Suppression des données
  removeData(key: string): void {
    localStorage.removeItem(this.STORAGE_KEYS[key as keyof typeof this.STORAGE_KEYS] || key);
  }

  // Sauvegarde complète de l'état
  saveCompleteState(state: {
    participants: any[];
    textes: any[];
    correcteurs: any[];
    messages: any[];
    stats: any;
  }): void {
    Object.entries(state).forEach(([key, value]) => {
      this.saveData(key.toUpperCase(), value);
    });
    
    localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    this.updateSyncStatus();
  }

  // Chargement complet de l'état
  loadCompleteState(): any {
    return {
      participants: this.loadData('PARTICIPANTS') || [],
      textes: this.loadData('TEXTES') || [],
      correcteurs: this.loadData('CORRECTEURS') || [],
      messages: this.loadData('MESSAGES') || [],
      stats: this.loadData('STATS') || null
    };
  }

  // Gestion du statut en ligne/hors ligne
  private initializeOnlineStatus(): void {
    window.addEventListener('online', () => {
      this.updateSyncStatus(true);
      this.syncPendingChanges();
    });

    window.addEventListener('offline', () => {
      this.updateSyncStatus(false);
    });
  }

  private updateSyncStatus(isOnline?: boolean): void {
    const currentStatus = this.syncStatusSubject.value;
    this.syncStatusSubject.next({
      ...currentStatus,
      lastSync: new Date(),
      isOnline: isOnline !== undefined ? isOnline : navigator.onLine,
      pendingChanges: this.getPendingChangesCount()
    });
  }

  private loadLastSyncTime(): void {
    const lastSyncStr = localStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
    if (lastSyncStr) {
      const currentStatus = this.syncStatusSubject.value;
      this.syncStatusSubject.next({
        ...currentStatus,
        lastSync: new Date(lastSyncStr)
      });
    }
  }

  private getPendingChangesCount(): number {
    // Compter les modifications en attente de synchronisation
    const pendingKey = 'cp2i_pending_changes';
    const pending = localStorage.getItem(pendingKey);
    return pending ? JSON.parse(pending).length : 0;
  }

  // Gestion des modifications en attente
  addPendingChange(change: {
    type: 'create' | 'update' | 'delete';
    entity: string;
    data: any;
    timestamp: string;
  }): void {
    const pendingKey = 'cp2i_pending_changes';
    const existing = localStorage.getItem(pendingKey);
    const changes = existing ? JSON.parse(existing) : [];
    
    changes.push({
      ...change,
      id: Date.now().toString()
    });
    
    localStorage.setItem(pendingKey, JSON.stringify(changes));
    this.updateSyncStatus();
  }

  private syncPendingChanges(): void {
    const pendingKey = 'cp2i_pending_changes';
    const pending = localStorage.getItem(pendingKey);
    
    if (pending) {
      const changes = JSON.parse(pending);
      
      // Simuler la synchronisation
      setTimeout(() => {
        localStorage.removeItem(pendingKey);
        this.updateSyncStatus();
        console.log(`${changes.length} modifications synchronisées`);
      }, 2000);
    }
  }

  // Nettoyage des données anciennes
  cleanupOldData(): void {
    const keys = Object.values(this.STORAGE_KEYS);
    keys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        try {
          const parsed = JSON.parse(item);
          const dataAge = new Date().getTime() - new Date(parsed.timestamp).getTime();
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours
          
          if (dataAge > maxAge) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Supprimer les données corrompues
          localStorage.removeItem(key);
        }
      }
    });
  }

  // Export des données pour sauvegarde
  exportData(): string {
    const allData = {
      ...this.loadCompleteState(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    return JSON.stringify(allData, null, 2);
  }

  // Import des données depuis une sauvegarde
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.participants) this.saveData('PARTICIPANTS', data.participants);
      if (data.textes) this.saveData('TEXTES', data.textes);
      if (data.correcteurs) this.saveData('CORRECTEURS', data.correcteurs);
      if (data.messages) this.saveData('MESSAGES', data.messages);
      if (data.stats) this.saveData('STATS', data.stats);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      return false;
    }
  }

  // Statistiques de stockage
  getStorageStats(): {
    used: number;
    available: number;
    percentage: number;
  } {
    let used = 0;
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length;
      }
    }
    
    // Estimation de l'espace disponible (5MB pour localStorage)
    const available = 5 * 1024 * 1024;
    const percentage = (used / available) * 100;
    
    return {
      used,
      available,
      percentage: Math.round(percentage * 100) / 100
    };
  }
}