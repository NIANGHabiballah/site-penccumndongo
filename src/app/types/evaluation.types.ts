export interface Evaluation {
  id: number;
  texteId: number;
  correcteurId: number;
  correcteurNom: string;
  note: number;
  remarques: string;
  dateCorrection: string;
  criteres: {
    pertinence: number;
    coherence: number;
    correctionLangue: number;
    presentation: number;
  };
}

export interface ParticipantNote {
  participantId: number;
  participantNom: string;
  participantPrenom: string;
  texteId: number;
  titrTexte: string;
  theme: string;
  langue: string;
  datesoumission: string;
  evaluations: Evaluation[];
  noteMoyenne: number;
  positionClassement: number;
  totalParticipants: number;
}

export interface ClassementParticipant {
  participantId: number;
  participantNom: string;
  participantPrenom: string;
  noteMoyenne: number;
  nombreTextes: number;
  position: number;
}

export interface StatistiquesEvaluation {
  totalEvaluations: number;
  noteMoyenneGenerale: number;
  meilleurNote: number;
  noteMinimale: number;
  repartitionNotes: {
    excellent: number; // 18-20
    tresBien: number;  // 16-17
    bien: number;      // 14-15
    assezBien: number; // 12-13
    passable: number;  // 10-11
    insuffisant: number; // 0-9
  };
}