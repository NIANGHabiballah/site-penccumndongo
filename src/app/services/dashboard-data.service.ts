import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { DataPersistenceService } from './data-persistence.service';

export interface DashboardStats {
  participants: number;
  correcteurs: number;
  textesTotal: number;
  textesEnAttente: number;
  textesEvalues: number;
  textesValides: number;
  concoursActifs: number;
  moyenneNotes: number;
  participantsActifs: number;
  messagesNonLus: number;
}

export interface Participant {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  ville: string;
  dateInscription: string;
  statut: 'actif' | 'suspendu' | 'en_attente';
  textesSubmis: number;
  dernierTexte?: string;
}

export interface Texte {
  id: number;
  titre: string;
  contenu: string;
  participantId: number;
  participantNom: string;
  dateSubmission: string;
  statut: 'en_attente' | 'en_cours' | 'evalue' | 'valide' | 'rejete';
  note?: number;
  commentaires?: string;
  correcteurId?: number;
  correcteurNom?: string;
}

export interface Correcteur {
  id: number;
  nom: string;
  email: string;
  specialite: string;
  textesAssignes: number;
  textesEvalues: number;
  moyenneTempsEvaluation: number;
  statut: 'actif' | 'occupe' | 'indisponible';
}

export interface Message {
  id: number;
  expediteur: string;
  destinataire: string;
  sujet: string;
  contenu: string;
  dateEnvoi: string;
  lu: boolean;
  type: 'info' | 'urgent' | 'normal';
}

@Injectable({
  providedIn: 'root'
})
export class DashboardDataService {
  private apiUrl = 'http://localhost/cp2i-backend';
  
  private statsSubject = new BehaviorSubject<DashboardStats>({
    participants: 156,
    correcteurs: 12,
    textesTotal: 234,
    textesEnAttente: 45,
    textesEvalues: 189,
    textesValides: 167,
    concoursActifs: 3,
    moyenneNotes: 7.8,
    participantsActifs: 89,
    messagesNonLus: 8
  });

  private participantsSubject = new BehaviorSubject<Participant[]>([
    {
      id: 1,
      nom: 'Marie Kouassi',
      email: 'marie.kouassi@email.com',
      telephone: '+225 07 12 34 56',
      ville: 'Abidjan',
      dateInscription: '2024-01-15',
      statut: 'actif',
      textesSubmis: 3,
      dernierTexte: '2024-01-20'
    },
    {
      id: 2,
      nom: 'Jean Dupont',
      email: 'jean.dupont@email.com',
      telephone: '+225 05 98 76 54',
      ville: 'Bouaké',
      dateInscription: '2024-01-10',
      statut: 'actif',
      textesSubmis: 2
    }
  ]);

  private textesSubject = new BehaviorSubject<Texte[]>([
    {
      id: 1,
      titre: 'L\'Espoir au Cœur de l\'Afrique',
      contenu: 'Dans les terres rouges de mon pays...',
      participantId: 1,
      participantNom: 'Marie Kouassi',
      dateSubmission: '2024-01-20',
      statut: 'en_attente'
    },
    {
      id: 2,
      titre: 'Chant de la Liberté',
      contenu: 'Ô liberté, toi qui danses...',
      participantId: 2,
      participantNom: 'Jean Dupont',
      dateSubmission: '2024-01-19',
      statut: 'evalue',
      note: 8.5,
      commentaires: 'Excellent travail, très émouvant',
      correcteurId: 1,
      correcteurNom: 'Dr. Aminata Traoré'
    }
  ]);

  private correcteursSubject = new BehaviorSubject<Correcteur[]>([
    {
      id: 1,
      nom: 'Dr. Aminata Traoré',
      email: 'aminata.traore@cp2i.ci',
      specialite: 'Littérature africaine',
      textesAssignes: 15,
      textesEvalues: 12,
      moyenneTempsEvaluation: 2.5,
      statut: 'actif'
    },
    {
      id: 2,
      nom: 'Prof. Kouadio N\'Guessan',
      email: 'kouadio.nguessan@cp2i.ci',
      specialite: 'Poésie contemporaine',
      textesAssignes: 18,
      textesEvalues: 16,
      moyenneTempsEvaluation: 3.2,
      statut: 'actif'
    }
  ]);

  private messagesSubject = new BehaviorSubject<Message[]>([
    {
      id: 1,
      expediteur: 'Admin Principal',
      destinataire: 'Tous les participants',
      sujet: 'Nouvelle session de concours',
      contenu: 'Une nouvelle session de concours débute le 1er février...',
      dateEnvoi: '2024-01-25',
      lu: false,
      type: 'info'
    }
  ]);

  constructor(
    private http: HttpClient,
    private persistenceService: DataPersistenceService
  ) {
    this.loadPersistedData();
    // Mise à jour automatique des données toutes les 5 secondes pour tests
    interval(5000).subscribe(() => {
      this.refreshData();
      this.simulateRealTimeUpdates();
    });
    
    // Simulation d'activité en temps réel
    this.startRealTimeSimulation();
  }

  // Getters pour les observables
  get stats$(): Observable<DashboardStats> {
    return this.statsSubject.asObservable();
  }

  get participants$(): Observable<Participant[]> {
    return this.participantsSubject.asObservable();
  }

  get textes$(): Observable<Texte[]> {
    return this.textesSubject.asObservable();
  }

  get correcteurs$(): Observable<Correcteur[]> {
    return this.correcteursSubject.asObservable();
  }

  get messages$(): Observable<Message[]> {
    return this.messagesSubject.asObservable();
  }

  // Méthodes pour obtenir les données actuelles
  getCurrentStats(): DashboardStats {
    return this.statsSubject.value;
  }

  getCurrentParticipants(): Participant[] {
    return this.participantsSubject.value;
  }

  getCurrentTextes(): Texte[] {
    return this.textesSubject.value;
  }

  getCurrentCorrecteurs(): Correcteur[] {
    return this.correcteursSubject.value;
  }

  getCurrentMessages(): Message[] {
    return this.messagesSubject.value;
  }

  // Méthodes de mise à jour temps réel
  private refreshData(): void {
    const currentStats = this.statsSubject.value;
    const updatedStats: DashboardStats = {
      ...currentStats,
      participantsActifs: Math.floor(Math.random() * 20) + 80,
      messagesNonLus: Math.floor(Math.random() * 15),
      textesEnAttente: Math.max(0, currentStats.textesEnAttente + Math.floor(Math.random() * 6) - 3)
    };
    this.statsSubject.next(updatedStats);
  }

  private simulateRealTimeUpdates(): void {
    // Simulation de nouvelles soumissions
    if (Math.random() < 0.1) {
      this.addRandomTexte();
    }
    
    // Simulation de nouvelles inscriptions
    if (Math.random() < 0.05) {
      this.addRandomParticipant();
    }
    
    // Simulation d'évaluations
    if (Math.random() < 0.15) {
      this.updateRandomTexteStatus();
    }
  }

  private startRealTimeSimulation(): void {
    // Simulation d'activité continue
    setInterval(() => {
      const actions = ['newSubmission', 'evaluation', 'message', 'registration'];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      
      switch (randomAction) {
        case 'newSubmission':
          if (Math.random() < 0.3) this.addRandomTexte();
          break;
        case 'evaluation':
          if (Math.random() < 0.4) this.updateRandomTexteStatus();
          break;
        case 'message':
          if (Math.random() < 0.2) this.addRandomMessage();
          break;
        case 'registration':
          if (Math.random() < 0.1) this.addRandomParticipant();
          break;
      }
    }, 10000);
  }

  private addRandomTexte(): void {
    const participants = this.getCurrentParticipants();
    if (participants.length === 0) return;
    
    const randomParticipant = participants[Math.floor(Math.random() * participants.length)];
    const titres = [
      'Chant de l\'espoir',
      'Rêves d\'Afrique',
      'Lumière du matin',
      'Voix de la liberté',
      'Harmonie des cœurs',
      'Souffle de vie'
    ];
    
    const newTexte = {
      titre: titres[Math.floor(Math.random() * titres.length)] + ' ' + Date.now(),
      contenu: 'Contenu poétique généré automatiquement...',
      participantId: randomParticipant.id,
      participantNom: randomParticipant.nom,
      dateSubmission: new Date().toISOString().split('T')[0],
      statut: 'en_attente' as const
    };
    
    this.addTexte(newTexte);
  }

  private addRandomParticipant(): void {
    const noms = ['Aminata Diallo', 'Kouadio Yao', 'Fatou Traoré', 'Ibrahim Kone', 'Mariam Ouattara'];
    const villes = ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Korhogo'];
    
    const randomNom = noms[Math.floor(Math.random() * noms.length)];
    const randomVille = villes[Math.floor(Math.random() * villes.length)];
    
    const newParticipant = {
      nom: randomNom + ' ' + Date.now().toString().slice(-4),
      email: `participant${Date.now()}@email.com`,
      telephone: '+225 ' + Math.floor(Math.random() * 90000000 + 10000000),
      ville: randomVille,
      dateInscription: new Date().toISOString().split('T')[0],
      statut: 'actif' as const,
      textesSubmis: 0
    };
    
    this.addParticipant(newParticipant);
  }

  private updateRandomTexteStatus(): void {
    const textes = this.getCurrentTextes();
    const textesEnAttente = textes.filter(t => t.statut === 'en_attente' || t.statut === 'en_cours');
    
    if (textesEnAttente.length > 0) {
      const randomTexte = textesEnAttente[Math.floor(Math.random() * textesEnAttente.length)];
      const correcteurs = this.getCurrentCorrecteurs();
      
      if (randomTexte.statut === 'en_attente' && correcteurs.length > 0) {
        const randomCorrecteur = correcteurs[Math.floor(Math.random() * correcteurs.length)];
        this.assignTexteToCorrecteur(randomTexte.id, randomCorrecteur.id);
      } else if (randomTexte.statut === 'en_cours') {
        const note = Math.floor(Math.random() * 6) + 5; // Note entre 5 et 10
        this.updateTexte(randomTexte.id, {
          statut: 'evalue',
          note,
          commentaires: 'Excellente œuvre poétique avec une belle maîtrise du style.'
        });
      }
    }
  }

  private addRandomMessage(): void {
    const sujets = [
      'Nouvelle session de concours',
      'Résultats disponibles',
      'Rappel d\'inscription',
      'Mise à jour du règlement',
      'Félicitations aux lauréats'
    ];
    
    const message = {
      expediteur: 'Système CP2i',
      destinataire: 'Tous les participants',
      sujet: sujets[Math.floor(Math.random() * sujets.length)],
      contenu: 'Message automatique généré par le système...',
      dateEnvoi: new Date().toISOString().split('T')[0],
      lu: false,
      type: 'info' as const
    };
    
    this.addMessage(message);
  }

  // Méthodes CRUD pour participants
  addParticipant(participant: Omit<Participant, 'id'>): void {
    const participants = this.getCurrentParticipants();
    const newParticipant: Participant = {
      ...participant,
      id: Math.max(...participants.map(p => p.id)) + 1
    };
    this.participantsSubject.next([...participants, newParticipant]);
    this.updateStats();
    this.saveDataToPersistence();
  }

  updateParticipant(id: number, updates: Partial<Participant>): void {
    const participants = this.getCurrentParticipants();
    const index = participants.findIndex(p => p.id === id);
    if (index !== -1) {
      participants[index] = { ...participants[index], ...updates };
      this.participantsSubject.next([...participants]);
    }
  }

  deleteParticipant(id: number): void {
    const participants = this.getCurrentParticipants().filter(p => p.id !== id);
    this.participantsSubject.next(participants);
    this.updateStats();
  }

  // Méthodes CRUD pour textes
  addTexte(texte: Omit<Texte, 'id'>): void {
    const textes = this.getCurrentTextes();
    const newTexte: Texte = {
      ...texte,
      id: Math.max(...textes.map(t => t.id)) + 1
    };
    this.textesSubject.next([...textes, newTexte]);
    this.updateStats();
    this.saveDataToPersistence();
  }

  updateTexte(id: number, updates: Partial<Texte>): void {
    const textes = this.getCurrentTextes();
    const index = textes.findIndex(t => t.id === id);
    if (index !== -1) {
      textes[index] = { ...textes[index], ...updates };
      this.textesSubject.next([...textes]);
      this.updateStats();
    }
  }

  // Méthodes pour correcteurs
  assignTexteToCorrecteur(texteId: number, correcteurId: number): void {
    this.updateTexte(texteId, { 
      statut: 'en_cours', 
      correcteurId,
      correcteurNom: this.getCurrentCorrecteurs().find(c => c.id === correcteurId)?.nom 
    });
  }

  // Méthodes pour messages
  addMessage(message: Omit<Message, 'id'>): void {
    const messages = this.getCurrentMessages();
    const newMessage: Message = {
      ...message,
      id: Math.max(...messages.map(m => m.id)) + 1
    };
    this.messagesSubject.next([...messages, newMessage]);
  }

  markMessageAsRead(id: number): void {
    const messages = this.getCurrentMessages();
    const index = messages.findIndex(m => m.id === id);
    if (index !== -1) {
      messages[index].lu = true;
      this.messagesSubject.next([...messages]);
      this.updateStats();
    }
  }

  // Chargement des données persistées
  private loadPersistedData(): void {
    const persistedData = this.persistenceService.loadCompleteState();
    
    if (persistedData.participants.length > 0) {
      this.participantsSubject.next(persistedData.participants);
    }
    
    if (persistedData.textes.length > 0) {
      this.textesSubject.next(persistedData.textes);
    }
    
    if (persistedData.correcteurs.length > 0) {
      this.correcteursSubject.next(persistedData.correcteurs);
    }
    
    if (persistedData.messages.length > 0) {
      this.messagesSubject.next(persistedData.messages);
    }
  }

  // Sauvegarde automatique des données
  private saveDataToPersistence(): void {
    const currentState = {
      participants: this.getCurrentParticipants(),
      textes: this.getCurrentTextes(),
      correcteurs: this.getCurrentCorrecteurs(),
      messages: this.getCurrentMessages(),
      stats: this.getCurrentStats()
    };
    
    this.persistenceService.saveCompleteState(currentState);
  }

  // Mise à jour des statistiques
  private updateStats(): void {
    const participants = this.getCurrentParticipants();
    const textes = this.getCurrentTextes();
    const messages = this.getCurrentMessages();
    
    const updatedStats: DashboardStats = {
      participants: participants.length,
      correcteurs: this.getCurrentCorrecteurs().length,
      textesTotal: textes.length,
      textesEnAttente: textes.filter(t => t.statut === 'en_attente').length,
      textesEvalues: textes.filter(t => t.statut === 'evalue').length,
      textesValides: textes.filter(t => t.statut === 'valide').length,
      concoursActifs: 3,
      moyenneNotes: this.calculateAverageScore(textes),
      participantsActifs: participants.filter(p => p.statut === 'actif').length,
      messagesNonLus: messages.filter(m => !m.lu).length
    };
    
    this.statsSubject.next(updatedStats);
  }

  private calculateAverageScore(textes: Texte[]): number {
    const evaluatedTextes = textes.filter(t => t.note !== undefined);
    if (evaluatedTextes.length === 0) return 0;
    
    const sum = evaluatedTextes.reduce((acc, t) => acc + (t.note || 0), 0);
    return Math.round((sum / evaluatedTextes.length) * 10) / 10;
  }

  // Méthodes pour les statistiques avancées
  getParticipantsByCity(): { [city: string]: number } {
    const participants = this.getCurrentParticipants();
    return participants.reduce((acc, p) => {
      acc[p.ville] = (acc[p.ville] || 0) + 1;
      return acc;
    }, {} as { [city: string]: number });
  }

  getTextesStatusDistribution(): { [status: string]: number } {
    const textes = this.getCurrentTextes();
    return textes.reduce((acc, t) => {
      acc[t.statut] = (acc[t.statut] || 0) + 1;
      return acc;
    }, {} as { [status: string]: number });
  }

  getCorrecteurPerformance(): Array<{correcteur: string, textesEvalues: number, moyenneNotes: number}> {
    const textes = this.getCurrentTextes();
    const correcteurs = this.getCurrentCorrecteurs();
    
    return correcteurs.map(c => {
      const textesCorrecteur = textes.filter(t => t.correcteurId === c.id && t.note !== undefined);
      const moyenneNotes = textesCorrecteur.length > 0 
        ? textesCorrecteur.reduce((acc, t) => acc + (t.note || 0), 0) / textesCorrecteur.length
        : 0;
      
      return {
        correcteur: c.nom,
        textesEvalues: textesCorrecteur.length,
        moyenneNotes: Math.round(moyenneNotes * 10) / 10
      };
    });
  }
}