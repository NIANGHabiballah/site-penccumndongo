import { Injectable } from '@angular/core';
import { interval, BehaviorSubject } from 'rxjs';
import { DashboardDataService } from './dashboard-data.service';
import { RealtimeSyncService } from './realtime-sync.service';

@Injectable({
  providedIn: 'root'
})
export class AutoUpdateService {
  private isActiveSubject = new BehaviorSubject<boolean>(true);
  private updateIntervals: any[] = [];

  constructor(
    private dashboardService: DashboardDataService,
    private realtimeService: RealtimeSyncService
  ) {
    this.startAutoUpdates();
  }

  get isActive$() {
    return this.isActiveSubject.asObservable();
  }

  private startAutoUpdates(): void {
    // Mise à jour des statistiques toutes les 3 secondes
    this.updateIntervals.push(
      setInterval(() => {
        this.updateLiveStats();
      }, 3000)
    );

    // Simulation d'activité utilisateur toutes les 8 secondes
    this.updateIntervals.push(
      setInterval(() => {
        this.simulateUserActivity();
      }, 8000)
    );

    // Mise à jour des données temps réel toutes les 15 secondes
    this.updateIntervals.push(
      setInterval(() => {
        this.updateRealTimeData();
      }, 15000)
    );
  }

  private updateLiveStats(): void {
    const currentStats = this.dashboardService.getCurrentStats();
    
    // Simulation de fluctuations réalistes
    const fluctuations = {
      participantsActifs: Math.max(50, currentStats.participantsActifs + Math.floor(Math.random() * 10) - 5),
      messagesNonLus: Math.max(0, currentStats.messagesNonLus + Math.floor(Math.random() * 4) - 2)
    };

    // Mettre à jour seulement si les valeurs ont changé
    if (fluctuations.participantsActifs !== currentStats.participantsActifs ||
        fluctuations.messagesNonLus !== currentStats.messagesNonLus) {
      
      const updatedStats = {
        ...currentStats,
        ...fluctuations
      };
      
      // Émettre l'événement de mise à jour
      this.realtimeService.sendEvent('stats_updated', {
        section: 'live_stats',
        changes: fluctuations
      });
    }
  }

  private simulateUserActivity(): void {
    const activities = [
      () => this.simulateNewRegistration(),
      () => this.simulateTextSubmission(),
      () => this.simulateEvaluation(),
      () => this.simulateMessage()
    ];

    // Probabilité d'activité : 30%
    if (Math.random() < 0.3) {
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      randomActivity();
    }
  }

  private simulateNewRegistration(): void {
    const names = [
      'Aminata Coulibaly', 'Youssouf Kone', 'Fatoumata Diarra',
      'Ibrahim Traore', 'Mariam Sangare', 'Sekou Ouattara'
    ];
    
    const cities = ['Abidjan', 'Bouaké', 'Yamoussoukro', 'Korhogo', 'San-Pédro'];
    
    const newParticipant = {
      nom: names[Math.floor(Math.random() * names.length)],
      email: `user${Date.now()}@email.com`,
      telephone: '+225 ' + Math.floor(Math.random() * 90000000 + 10000000),
      ville: cities[Math.floor(Math.random() * cities.length)],
      dateInscription: new Date().toISOString().split('T')[0],
      statut: 'actif' as const,
      textesSubmis: 0
    };

    this.dashboardService.addParticipant(newParticipant);
    
    this.realtimeService.sendEvent('participant_added', {
      name: newParticipant.nom,
      city: newParticipant.ville,
      message: `${newParticipant.nom} s'est inscrit depuis ${newParticipant.ville}`
    });
  }

  private simulateTextSubmission(): void {
    const participants = this.dashboardService.getCurrentParticipants();
    if (participants.length === 0) return;

    const randomParticipant = participants[Math.floor(Math.random() * participants.length)];
    
    const titles = [
      'Chant de l\'espoir', 'Rêves d\'Afrique', 'Lumière du matin',
      'Voix de la liberté', 'Harmonie des cœurs', 'Souffle de vie',
      'Étoiles du soir', 'Danse des mots', 'Mélodie du cœur'
    ];

    const newTexte = {
      titre: titles[Math.floor(Math.random() * titles.length)],
      contenu: 'Contenu poétique généré automatiquement pour la démonstration...',
      participantId: randomParticipant.id,
      participantNom: randomParticipant.nom,
      dateSubmission: new Date().toISOString().split('T')[0],
      statut: 'en_attente' as const
    };

    this.dashboardService.addTexte(newTexte);
    
    this.realtimeService.sendEvent('texte_submitted', {
      title: newTexte.titre,
      participant: randomParticipant.nom,
      message: `Nouveau texte "${newTexte.titre}" soumis par ${randomParticipant.nom}`
    });
  }

  private simulateEvaluation(): void {
    const textes = this.dashboardService.getCurrentTextes();
    const textesEnCours = textes.filter(t => t.statut === 'en_cours');
    
    if (textesEnCours.length === 0) return;

    const randomTexte = textesEnCours[Math.floor(Math.random() * textesEnCours.length)];
    const note = Math.floor(Math.random() * 6) + 5; // Note entre 5 et 10
    
    const comments = [
      'Excellente maîtrise du style poétique',
      'Très belle expression des émotions',
      'Travail remarquable sur le rythme',
      'Originalité et créativité appréciées',
      'Belle utilisation des métaphores'
    ];

    this.dashboardService.updateTexte(randomTexte.id, {
      statut: 'evalue',
      note,
      commentaires: comments[Math.floor(Math.random() * comments.length)]
    });

    this.realtimeService.sendEvent('texte_evaluated', {
      title: randomTexte.titre,
      note,
      correcteur: randomTexte.correcteurNom || 'Correcteur',
      message: `"${randomTexte.titre}" évalué avec la note ${note}/10`
    });
  }

  private simulateMessage(): void {
    const subjects = [
      'Nouvelle session de concours ouverte',
      'Résultats du concours disponibles',
      'Rappel: Date limite de soumission',
      'Félicitations aux lauréats',
      'Mise à jour du règlement'
    ];

    const message = {
      expediteur: 'Administration CP2i',
      destinataire: 'Tous les participants',
      sujet: subjects[Math.floor(Math.random() * subjects.length)],
      contenu: 'Message automatique généré pour la démonstration du système temps réel.',
      dateEnvoi: new Date().toISOString().split('T')[0],
      lu: false,
      type: 'info' as const
    };

    this.dashboardService.addMessage(message);
    
    this.realtimeService.sendEvent('message_sent', {
      subject: message.sujet,
      sender: message.expediteur,
      message: `Nouveau message: "${message.sujet}"`
    });
  }

  private updateRealTimeData(): void {
    // Simulation de mise à jour des données depuis le serveur
    const participants = this.dashboardService.getCurrentParticipants();
    const textes = this.dashboardService.getCurrentTextes();
    
    // Mise à jour aléatoire du nombre de textes soumis pour certains participants
    participants.forEach(participant => {
      const participantTextes = textes.filter(t => t.participantId === participant.id);
      if (participantTextes.length !== participant.textesSubmis) {
        this.dashboardService.updateParticipant(participant.id, {
          textesSubmis: participantTextes.length
        });
      }
    });
  }

  // Méthodes de contrôle
  pause(): void {
    this.isActiveSubject.next(false);
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals = [];
  }

  resume(): void {
    if (!this.isActiveSubject.value) {
      this.isActiveSubject.next(true);
      this.startAutoUpdates();
    }
  }

  destroy(): void {
    this.pause();
    this.isActiveSubject.complete();
  }
}