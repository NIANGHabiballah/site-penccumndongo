import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardDataService } from './dashboard-data.service';

export interface AdvancedStats {
  participationRate: number;
  averageScore: number;
  completionRate: number;
  topPerformers: Array<{name: string, score: number}>;
  cityDistribution: Array<{city: string, count: number}>;
  monthlySubmissions: Array<{month: string, count: number}>;
  correcteurWorkload: Array<{name: string, assigned: number, completed: number}>;
  statusDistribution: Array<{status: string, count: number, percentage: number}>;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private advancedStatsSubject = new BehaviorSubject<AdvancedStats>({
    participationRate: 0,
    averageScore: 0,
    completionRate: 0,
    topPerformers: [],
    cityDistribution: [],
    monthlySubmissions: [],
    correcteurWorkload: [],
    statusDistribution: []
  });

  constructor(private dashboardService: DashboardDataService) {
    this.initializeStatistics();
  }

  get advancedStats$(): Observable<AdvancedStats> {
    return this.advancedStatsSubject.asObservable();
  }

  private initializeStatistics() {
    // Combiner les données pour calculer les statistiques avancées
    combineLatest([
      this.dashboardService.participants$,
      this.dashboardService.textes$,
      this.dashboardService.correcteurs$
    ]).pipe(
      map(([participants, textes, correcteurs]) => {
        return this.calculateAdvancedStats(participants, textes, correcteurs);
      })
    ).subscribe(stats => {
      this.advancedStatsSubject.next(stats);
    });
  }

  private calculateAdvancedStats(participants: any[], textes: any[], correcteurs: any[]): AdvancedStats {
    // Taux de participation
    const activeParticipants = participants.filter(p => p.textesSubmis > 0).length;
    const participationRate = participants.length > 0 ? (activeParticipants / participants.length) * 100 : 0;

    // Score moyen
    const evaluatedTextes = textes.filter(t => t.note !== undefined);
    const averageScore = evaluatedTextes.length > 0 
      ? evaluatedTextes.reduce((sum, t) => sum + (t.note || 0), 0) / evaluatedTextes.length 
      : 0;

    // Taux de completion
    const completedTextes = textes.filter(t => t.statut === 'evalue' || t.statut === 'valide').length;
    const completionRate = textes.length > 0 ? (completedTextes / textes.length) * 100 : 0;

    // Top performers
    const participantScores = participants.map(p => {
      const participantTextes = textes.filter(t => t.participantId === p.id && t.note !== undefined);
      const avgScore = participantTextes.length > 0 
        ? participantTextes.reduce((sum, t) => sum + (t.note || 0), 0) / participantTextes.length 
        : 0;
      return { name: p.nom, score: Math.round(avgScore * 10) / 10 };
    }).filter(p => p.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

    // Distribution par ville
    const cityCount = participants.reduce((acc, p) => {
      acc[p.ville] = (acc[p.ville] || 0) + 1;
      return acc;
    }, {} as {[key: string]: number});
    
    const cityDistribution = Object.entries(cityCount)
      .map(([city, count]) => ({ city, count: count as number }))
      .sort((a, b) => (b.count as number) - (a.count as number));

    // Soumissions mensuelles (simulation)
    const monthlySubmissions = [
      { month: 'Jan', count: Math.floor(Math.random() * 50) + 20 },
      { month: 'Fév', count: Math.floor(Math.random() * 50) + 25 },
      { month: 'Mar', count: Math.floor(Math.random() * 50) + 30 },
      { month: 'Avr', count: Math.floor(Math.random() * 50) + 35 },
      { month: 'Mai', count: Math.floor(Math.random() * 50) + 40 },
      { month: 'Juin', count: textes.length }
    ];

    // Charge de travail des correcteurs
    const correcteurWorkload = correcteurs.map(c => {
      const assignedTextes = textes.filter(t => t.correcteurId === c.id);
      const completedTextes = assignedTextes.filter(t => t.statut === 'evalue');
      return {
        name: c.nom,
        assigned: assignedTextes.length,
        completed: completedTextes.length
      };
    });

    // Distribution des statuts
    const statusCount = textes.reduce((acc, t) => {
      acc[t.statut] = (acc[t.statut] || 0) + 1;
      return acc;
    }, {} as {[key: string]: number});

    const statusDistribution = Object.entries(statusCount).map(([status, count]) => ({
      status: this.getStatusLabel(status),
      count: count as number,
      percentage: textes.length > 0 ? Math.round(((count as number) / textes.length) * 100) : 0
    }));

    return {
      participationRate: Math.round(participationRate * 10) / 10,
      averageScore: Math.round(averageScore * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      topPerformers: participantScores,
      cityDistribution,
      monthlySubmissions,
      correcteurWorkload,
      statusDistribution
    };
  }

  private getStatusLabel(status: string): string {
    const labels = {
      'en_attente': 'En attente',
      'en_cours': 'En cours',
      'evalue': 'Évalué',
      'valide': 'Validé',
      'rejete': 'Rejeté'
    };
    return labels[status as keyof typeof labels] || status;
  }

  // Méthodes pour obtenir des statistiques spécifiques
  getParticipantPerformance(participantId: number): Observable<any> {
    return combineLatest([
      this.dashboardService.participants$,
      this.dashboardService.textes$
    ]).pipe(
      map(([participants, textes]) => {
        const participant = participants.find(p => p.id === participantId);
        if (!participant) return null;

        const participantTextes = textes.filter(t => t.participantId === participantId);
        const evaluatedTextes = participantTextes.filter(t => t.note !== undefined);
        
        const averageScore = evaluatedTextes.length > 0 
          ? evaluatedTextes.reduce((sum, t) => sum + (t.note || 0), 0) / evaluatedTextes.length 
          : 0;

        const bestScore = evaluatedTextes.length > 0 
          ? Math.max(...evaluatedTextes.map(t => t.note || 0)) 
          : 0;

        return {
          participant: participant.nom,
          totalSubmissions: participantTextes.length,
          evaluatedSubmissions: evaluatedTextes.length,
          averageScore: Math.round(averageScore * 10) / 10,
          bestScore,
          recentSubmissions: participantTextes
            .sort((a, b) => new Date(b.dateSubmission).getTime() - new Date(a.dateSubmission).getTime())
            .slice(0, 5)
        };
      })
    );
  }

  getCorrecteurPerformance(correcteurId: number): Observable<any> {
    return combineLatest([
      this.dashboardService.correcteurs$,
      this.dashboardService.textes$
    ]).pipe(
      map(([correcteurs, textes]) => {
        const correcteur = correcteurs.find(c => c.id === correcteurId);
        if (!correcteur) return null;

        const assignedTextes = textes.filter(t => t.correcteurId === correcteurId);
        const completedTextes = assignedTextes.filter(t => t.statut === 'evalue');
        
        const averageGrade = completedTextes.length > 0 
          ? completedTextes.reduce((sum, t) => sum + (t.note || 0), 0) / completedTextes.length 
          : 0;

        return {
          correcteur: correcteur.nom,
          specialite: correcteur.specialite,
          assignedCount: assignedTextes.length,
          completedCount: completedTextes.length,
          pendingCount: assignedTextes.length - completedTextes.length,
          averageGrade: Math.round(averageGrade * 10) / 10,
          completionRate: assignedTextes.length > 0 
            ? Math.round((completedTextes.length / assignedTextes.length) * 100) 
            : 0
        };
      })
    );
  }

  // Méthode pour exporter les statistiques
  exportStatistics(): Observable<any> {
    return combineLatest([
      this.dashboardService.stats$,
      this.advancedStats$
    ]).pipe(
      map(([basicStats, advancedStats]) => ({
        exportDate: new Date().toISOString(),
        basicStats,
        advancedStats,
        summary: {
          totalParticipants: basicStats.participants,
          totalTextes: basicStats.textesTotal,
          averageScore: advancedStats.averageScore,
          participationRate: advancedStats.participationRate,
          completionRate: advancedStats.completionRate
        }
      }))
    );
  }
}