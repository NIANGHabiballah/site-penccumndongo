import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Participant {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  ville: string;
  dateInscription: string;
  statut: 'actif' | 'inactif' | 'suspendu';
}

export interface Correcteur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  specialite: string;
  textesAssignes: number;
  textesCorrigees: number;
  statut: 'actif' | 'inactif';
}

export interface Texte {
  id: number;
  titre: string;
  participantId: number;
  participantNom: string;
  theme: string;
  langue: string;
  datesoumission: string;
  statut: 'en_attente' | 'en_cours' | 'corrige';
  note?: number;
  commentaires?: string;
  correcteurId?: number;
}

export interface Statistiques {
  participants: number;
  correcteurs: number;
  textesTotal: number;
  textesEnAttente: number;
  textesCorrigees: number;
  tauxProgression: number;
}

@Injectable({
  providedIn: 'root'
})
export class Cp2iService {
  private participantsSubject = new BehaviorSubject<Participant[]>([
    {
      id: 1,
      nom: 'Diallo',
      prenom: 'Aminata',
      email: 'aminata.diallo@email.com',
      telephone: '+221 77 123 45 67',
      ville: 'Dakar',
      dateInscription: '2024-01-10',
      statut: 'actif'
    },
    {
      id: 2,
      nom: 'Sow',
      prenom: 'Moussa',
      email: 'moussa.sow@email.com',
      telephone: '+221 76 987 65 43',
      ville: 'Thiès',
      dateInscription: '2024-01-12',
      statut: 'actif'
    }
  ]);

  private correcteursSubject = new BehaviorSubject<Correcteur[]>([
    {
      id: 1,
      nom: 'Professeur Sow',
      prenom: 'Abdoulaye',
      email: 'prof.sow@ucad.edu.sn',
      specialite: 'Littérature française',
      textesAssignes: 15,
      textesCorrigees: 12,
      statut: 'actif'
    },
    {
      id: 2,
      nom: 'Dr. Ndiaye',
      prenom: 'Fatou',
      email: 'f.ndiaye@esp.sn',
      specialite: 'Littérature wolof',
      textesAssignes: 10,
      textesCorrigees: 8,
      statut: 'actif'
    }
  ]);

  private textesSubject = new BehaviorSubject<Texte[]>([
    {
      id: 1,
      titre: 'L\'espoir d\'un avenir meilleur',
      participantId: 1,
      participantNom: 'Aminata Diallo',
      theme: 'Espoir',
      langue: 'Français',
      datesoumission: '2024-01-15',
      statut: 'corrige',
      note: 16,
      commentaires: 'Excellent travail, très créatif',
      correcteurId: 1
    },
    {
      id: 2,
      titre: 'Xarit ak jëf',
      participantId: 2,
      participantNom: 'Moussa Sow',
      theme: 'Amitié',
      langue: 'Wolof',
      datesoumission: '2024-01-16',
      statut: 'en_cours',
      correcteurId: 2
    }
  ]);

  constructor() {}

  // Participants
  getParticipants(): Observable<Participant[]> {
    return this.participantsSubject.asObservable();
  }

  ajouterParticipant(participant: Omit<Participant, 'id'>): void {
    const participants = this.participantsSubject.value;
    const newParticipant = {
      ...participant,
      id: Math.max(...participants.map(p => p.id)) + 1
    };
    this.participantsSubject.next([...participants, newParticipant]);
  }

  // Correcteurs
  getCorrecteurs(): Observable<Correcteur[]> {
    return this.correcteursSubject.asObservable();
  }

  ajouterCorrecteur(correcteur: Omit<Correcteur, 'id'>): void {
    const correcteurs = this.correcteursSubject.value;
    const newCorrecteur = {
      ...correcteur,
      id: Math.max(...correcteurs.map(c => c.id)) + 1
    };
    this.correcteursSubject.next([...correcteurs, newCorrecteur]);
  }

  // Textes
  getTextes(): Observable<Texte[]> {
    return this.textesSubject.asObservable();
  }

  soumettreTexte(texte: Omit<Texte, 'id' | 'statut'>): void {
    const textes = this.textesSubject.value;
    const newTexte = {
      ...texte,
      id: Math.max(...textes.map(t => t.id)) + 1,
      statut: 'en_attente' as const
    };
    this.textesSubject.next([...textes, newTexte]);
  }

  corrigerTexte(texteId: number, note: number, commentaires: string, correcteurId: number): void {
    const textes = this.textesSubject.value;
    const updatedTextes = textes.map(texte => 
      texte.id === texteId 
        ? { ...texte, statut: 'corrige' as const, note, commentaires, correcteurId }
        : texte
    );
    this.textesSubject.next(updatedTextes);
  }

  // Statistiques
  getStatistiques(): Observable<Statistiques> {
    return new Observable(observer => {
      const participants = this.participantsSubject.value;
      const correcteurs = this.correcteursSubject.value;
      const textes = this.textesSubject.value;

      const stats: Statistiques = {
        participants: participants.length,
        correcteurs: correcteurs.filter(c => c.statut === 'actif').length,
        textesTotal: textes.length,
        textesEnAttente: textes.filter(t => t.statut === 'en_attente').length,
        textesCorrigees: textes.filter(t => t.statut === 'corrige').length,
        tauxProgression: textes.length > 0 ? 
          (textes.filter(t => t.statut === 'corrige').length / textes.length) * 100 : 0
      };

      observer.next(stats);
      observer.complete();
    });
  }

  // Messages et notifications
  envoyerNotification(destinataire: 'tous' | 'participants' | 'correcteurs', message: string): void {
    console.log(`Notification envoyée à ${destinataire}: ${message}`);
    // Implémentation de l'envoi de notifications
  }

  // Chatbot
  obtenirReponseChatbot(question: string): string {
    const faq = [
      {
        mots_cles: ['inscription', 'inscrire', 'comment'],
        reponse: 'Pour vous inscrire au concours CP2i, cliquez sur le bouton "Inscription" et remplissez le formulaire avec vos informations personnelles.'
      },
      {
        mots_cles: ['soumettre', 'envoyer', 'texte'],
        reponse: 'Pour soumettre votre texte, connectez-vous à votre espace participant et utilisez le formulaire de soumission dans la section "Mes Soumissions".'
      },
      {
        mots_cles: ['résultats', 'notes', 'correction'],
        reponse: 'Les résultats sont disponibles dans votre espace personnel, section "Résultats & Notes". Vous recevrez également une notification par email.'
      },
      {
        mots_cles: ['aide', 'support', 'problème'],
        reponse: 'Pour une assistance personnalisée, vous pouvez contacter notre équipe via le formulaire de contact ou demander à parler avec un conseiller.'
      }
    ];

    const questionLower = question.toLowerCase();
    
    for (const item of faq) {
      if (item.mots_cles.some(mot => questionLower.includes(mot))) {
        return item.reponse;
      }
    }

    return 'Je ne comprends pas votre question. Pouvez-vous la reformuler ou contacter notre équipe support pour une aide personnalisée ?';
  }
}