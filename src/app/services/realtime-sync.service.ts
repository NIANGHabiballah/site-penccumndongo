import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { DashboardDataService } from './dashboard-data.service';

export interface RealTimeEvent {
  type: 'participant_added' | 'texte_submitted' | 'texte_evaluated' | 'message_sent' | 'stats_updated';
  data: any;
  timestamp: string;
  userId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeSyncService {
  private eventsSubject = new Subject<RealTimeEvent>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private lastActivitySubject = new BehaviorSubject<string>('');
  
  // Simulation WebSocket pour les tests
  private simulationInterval: any;
  private eventQueue: RealTimeEvent[] = [];

  constructor(private dashboardService: DashboardDataService) {
    this.initializeRealTimeSync();
  }

  get events$(): Observable<RealTimeEvent> {
    return this.eventsSubject.asObservable();
  }

  get connectionStatus$(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  get lastActivity$(): Observable<string> {
    return this.lastActivitySubject.asObservable();
  }

  private initializeRealTimeSync(): void {
    // Simulation de connexion WebSocket
    setTimeout(() => {
      this.connectionStatusSubject.next(true);
      this.startEventSimulation();
    }, 1000);

    // Écouter les événements du service de données
    this.dashboardService.participants$.subscribe(() => {
      this.broadcastEvent({
        type: 'stats_updated',
        data: { section: 'participants' },
        timestamp: new Date().toISOString()
      });
    });

    this.dashboardService.textes$.subscribe(() => {
      this.broadcastEvent({
        type: 'stats_updated',
        data: { section: 'textes' },
        timestamp: new Date().toISOString()
      });
    });
  }

  private startEventSimulation(): void {
    // Simulation d'événements temps réel
    this.simulationInterval = setInterval(() => {
      this.generateRandomEvent();
    }, 8000);
  }

  private generateRandomEvent(): void {
    const eventTypes = [
      'participant_added',
      'texte_submitted', 
      'texte_evaluated',
      'message_sent'
    ];

    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)] as any;
    
    const event: RealTimeEvent = {
      type: randomType,
      data: this.generateEventData(randomType),
      timestamp: new Date().toISOString(),
      userId: Math.floor(Math.random() * 100) + 1
    };

    this.broadcastEvent(event);
  }

  private generateEventData(type: string): any {
    switch (type) {
      case 'participant_added':
        return {
          name: 'Nouveau Participant',
          city: 'Abidjan',
          message: 'Un nouveau participant s\'est inscrit'
        };
      
      case 'texte_submitted':
        return {
          title: 'Nouveau Texte Poétique',
          participant: 'Marie Kouassi',
          message: 'Un nouveau texte a été soumis'
        };
      
      case 'texte_evaluated':
        return {
          title: 'Évaluation Terminée',
          note: Math.floor(Math.random() * 6) + 5,
          correcteur: 'Dr. Aminata Traoré',
          message: 'Une évaluation a été complétée'
        };
      
      case 'message_sent':
        return {
          subject: 'Nouvelle Annonce',
          sender: 'Administration CP2i',
          message: 'Un nouveau message a été diffusé'
        };
      
      default:
        return {};
    }
  }

  private broadcastEvent(event: RealTimeEvent): void {
    this.eventsSubject.next(event);
    this.lastActivitySubject.next(this.formatLastActivity(event));
    this.eventQueue.push(event);
    
    // Garder seulement les 50 derniers événements
    if (this.eventQueue.length > 50) {
      this.eventQueue = this.eventQueue.slice(-50);
    }
  }

  private formatLastActivity(event: RealTimeEvent): string {
    const time = new Date(event.timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    switch (event.type) {
      case 'participant_added':
        return `${time} - Nouvelle inscription: ${event.data.name}`;
      case 'texte_submitted':
        return `${time} - Nouveau texte: "${event.data.title}"`;
      case 'texte_evaluated':
        return `${time} - Évaluation: ${event.data.note}/10 par ${event.data.correcteur}`;
      case 'message_sent':
        return `${time} - Message: ${event.data.subject}`;
      default:
        return `${time} - Activité système`;
    }
  }

  // Méthodes publiques pour l'interaction
  sendEvent(type: RealTimeEvent['type'], data: any): void {
    const event: RealTimeEvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
      userId: 1 // Devrait venir de l'auth
    };
    
    this.broadcastEvent(event);
  }

  getRecentEvents(limit: number = 10): RealTimeEvent[] {
    return this.eventQueue.slice(-limit).reverse();
  }

  clearEvents(): void {
    this.eventQueue = [];
  }

  // Simulation de déconnexion/reconnexion
  simulateDisconnection(): void {
    this.connectionStatusSubject.next(false);
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    
    // Reconnexion automatique après 3 secondes
    setTimeout(() => {
      this.connectionStatusSubject.next(true);
      this.startEventSimulation();
    }, 3000);
  }

  // Nettoyage
  destroy(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    this.eventsSubject.complete();
    this.connectionStatusSubject.complete();
    this.lastActivitySubject.complete();
  }
}