import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { StatisticsService, AdvancedStats } from '../../services/statistics.service';
import { DashboardDataService, DashboardStats } from '../../services/dashboard-data.service';

@Component({
  selector: 'app-statistiques',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-container">
      <div class="stats-header">
        <h1>Statistiques Avancées</h1>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="exportStats()">
            <i class="fas fa-download"></i> Exporter
          </button>
          <button class="btn btn-secondary" (click)="refreshStats()">
            <i class="fas fa-sync"></i> Actualiser
          </button>
        </div>
      </div>

      <!-- Métriques principales -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="metric-content">
            <h3>Taux de Participation</h3>
            <div class="metric-value">{{advancedStats.participationRate}}%</div>
            <div class="metric-trend positive">+5% ce mois</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <i class="fas fa-star"></i>
          </div>
          <div class="metric-content">
            <h3>Score Moyen</h3>
            <div class="metric-value">{{advancedStats.averageScore}}/10</div>
            <div class="metric-trend positive">+0.3 ce mois</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="metric-content">
            <h3>Taux de Completion</h3>
            <div class="metric-value">{{advancedStats.completionRate}}%</div>
            <div class="metric-trend positive">+8% ce mois</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <i class="fas fa-file-alt"></i>
          </div>
          <div class="metric-content">
            <h3>Total Textes</h3>
            <div class="metric-value">{{basicStats.textesTotal}}</div>
            <div class="metric-trend positive">+{{basicStats.textesEnAttente}} en attente</div>
          </div>
        </div>
      </div>

      <!-- Graphiques et analyses -->
      <div class="charts-grid">
        <!-- Top Performers -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Top Performers</h3>
            <i class="fas fa-trophy"></i>
          </div>
          <div class="chart-content">
            <div class="performer-list">
              <div class="performer-item" *ngFor="let performer of advancedStats.topPerformers; let i = index">
                <div class="performer-rank">{{i + 1}}</div>
                <div class="performer-name">{{performer.name}}</div>
                <div class="performer-score">{{performer.score}}/10</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Distribution par ville -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Répartition Géographique</h3>
            <i class="fas fa-map-marker-alt"></i>
          </div>
          <div class="chart-content">
            <div class="city-list">
              <div class="city-item" *ngFor="let city of advancedStats.cityDistribution">
                <div class="city-name">{{city.city}}</div>
                <div class="city-bar">
                  <div class="city-progress" [style.width.%]="getCityPercentage(city.count)"></div>
                </div>
                <div class="city-count">{{city.count}}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Soumissions mensuelles -->
        <div class="chart-card full-width">
          <div class="chart-header">
            <h3>Évolution des Soumissions</h3>
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="chart-content">
            <div class="monthly-chart">
              <div class="month-item" *ngFor="let month of advancedStats.monthlySubmissions">
                <div class="month-bar">
                  <div class="month-progress" [style.height.%]="getMonthPercentage(month.count)"></div>
                </div>
                <div class="month-label">{{month.month}}</div>
                <div class="month-count">{{month.count}}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charge de travail des correcteurs -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Correcteurs</h3>
            <i class="fas fa-user-check"></i>
          </div>
          <div class="chart-content">
            <div class="correcteur-list">
              <div class="correcteur-item" *ngFor="let correcteur of advancedStats.correcteurWorkload">
                <div class="correcteur-name">{{correcteur.name}}</div>
                <div class="correcteur-stats">
                  <span class="assigned">{{correcteur.assigned}} assignés</span>
                  <span class="completed">{{correcteur.completed}} terminés</span>
                </div>
                <div class="correcteur-progress">
                  <div class="progress-bar" [style.width.%]="getCorrecteurProgress(correcteur)"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Distribution des statuts -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Statuts des Textes</h3>
            <i class="fas fa-pie-chart"></i>
          </div>
          <div class="chart-content">
            <div class="status-list">
              <div class="status-item" *ngFor="let status of advancedStats.statusDistribution">
                <div class="status-label">{{status.status}}</div>
                <div class="status-bar">
                  <div class="status-progress" [style.width.%]="status.percentage" 
                       [ngClass]="getStatusClass(status.status)"></div>
                </div>
                <div class="status-percentage">{{status.percentage}}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-container {
      padding: 1rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .stats-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .stats-header h1 {
      color: #2c3e50;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #0380C2;
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .metric-icon {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #0380C2, #FF7F1A);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
    }

    .metric-content h3 {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 0.25rem;
    }

    .metric-trend {
      font-size: 0.8rem;
      font-weight: 500;
    }

    .metric-trend.positive {
      color: #28a745;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .chart-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .chart-card.full-width {
      grid-column: 1 / -1;
    }

    .chart-header {
      padding: 1.5rem;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8f9fa;
    }

    .chart-header h3 {
      color: #2c3e50;
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
    }

    .chart-header i {
      color: #0380C2;
      font-size: 1.2rem;
    }

    .chart-content {
      padding: 1.5rem;
    }

    /* Top Performers */
    .performer-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .performer-item:last-child {
      border-bottom: none;
    }

    .performer-rank {
      width: 30px;
      height: 30px;
      background: #FF7F1A;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;
      margin-right: 1rem;
    }

    .performer-name {
      flex: 1;
      font-weight: 500;
      color: #2c3e50;
    }

    .performer-score {
      font-weight: 600;
      color: #0380C2;
    }

    /* Distribution par ville */
    .city-item {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      gap: 1rem;
    }

    .city-name {
      width: 100px;
      font-weight: 500;
      color: #2c3e50;
    }

    .city-bar {
      flex: 1;
      height: 8px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .city-progress {
      height: 100%;
      background: linear-gradient(90deg, #0380C2, #FF7F1A);
      transition: width 0.3s ease;
    }

    .city-count {
      width: 40px;
      text-align: right;
      font-weight: 600;
      color: #666;
    }

    /* Soumissions mensuelles */
    .monthly-chart {
      display: flex;
      align-items: end;
      gap: 1rem;
      height: 200px;
      padding: 1rem 0;
    }

    .month-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .month-bar {
      width: 100%;
      height: 150px;
      background: #f0f0f0;
      border-radius: 4px;
      display: flex;
      align-items: end;
      overflow: hidden;
    }

    .month-progress {
      width: 100%;
      background: linear-gradient(180deg, #FF7F1A, #0380C2);
      transition: height 0.3s ease;
      border-radius: 4px 4px 0 0;
    }

    .month-label {
      font-weight: 500;
      color: #666;
      font-size: 0.9rem;
    }

    .month-count {
      font-weight: 600;
      color: #2c3e50;
      font-size: 0.8rem;
    }

    /* Correcteurs */
    .correcteur-item {
      margin-bottom: 1.5rem;
    }

    .correcteur-name {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .correcteur-stats {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .assigned {
      color: #FF7F1A;
    }

    .completed {
      color: #28a745;
    }

    .correcteur-progress {
      height: 6px;
      background: #f0f0f0;
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: #28a745;
      transition: width 0.3s ease;
    }

    /* Statuts */
    .status-item {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      gap: 1rem;
    }

    .status-label {
      width: 120px;
      font-weight: 500;
      color: #2c3e50;
      font-size: 0.9rem;
    }

    .status-bar {
      flex: 1;
      height: 8px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .status-progress {
      height: 100%;
      transition: width 0.3s ease;
    }

    .status-progress.en-attente {
      background: #ffc107;
    }

    .status-progress.en-cours {
      background: #17a2b8;
    }

    .status-progress.evalue {
      background: #6f42c1;
    }

    .status-progress.valide {
      background: #28a745;
    }

    .status-progress.rejete {
      background: #dc3545;
    }

    .status-percentage {
      width: 50px;
      text-align: right;
      font-weight: 600;
      color: #666;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .stats-container {
        padding: 1rem;
      }

      .stats-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .charts-grid {
        grid-template-columns: 1fr;
      }

      .monthly-chart {
        height: 150px;
      }

      .month-bar {
        height: 100px;
      }
    }
  `]
})
export class StatistiquesComponent implements OnInit, OnDestroy {
  basicStats: DashboardStats = {
    participants: 0,
    correcteurs: 0,
    textesTotal: 0,
    textesEnAttente: 0,
    textesEvalues: 0,
    textesValides: 0,
    concoursActifs: 0,
    moyenneNotes: 0,
    participantsActifs: 0,
    messagesNonLus: 0
  };

  advancedStats: AdvancedStats = {
    participationRate: 0,
    averageScore: 0,
    completionRate: 0,
    topPerformers: [],
    cityDistribution: [],
    monthlySubmissions: [],
    correcteurWorkload: [],
    statusDistribution: []
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private statisticsService: StatisticsService,
    private dashboardService: DashboardDataService
  ) {}

  ngOnInit() {
    this.loadStatistics();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadStatistics() {
    this.subscriptions.push(
      this.dashboardService.stats$.subscribe(stats => {
        this.basicStats = stats;
      })
    );

    this.subscriptions.push(
      this.statisticsService.advancedStats$.subscribe(stats => {
        this.advancedStats = stats;
      })
    );
  }

  getCityPercentage(count: number): number {
    const maxCount = Math.max(...this.advancedStats.cityDistribution.map(c => c.count));
    return maxCount > 0 ? (count / maxCount) * 100 : 0;
  }

  getMonthPercentage(count: number): number {
    const maxCount = Math.max(...this.advancedStats.monthlySubmissions.map(m => m.count));
    return maxCount > 0 ? (count / maxCount) * 100 : 0;
  }

  getCorrecteurProgress(correcteur: any): number {
    return correcteur.assigned > 0 ? (correcteur.completed / correcteur.assigned) * 100 : 0;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  refreshStats() {
    this.loadStatistics();
  }

  exportStats() {
    this.statisticsService.exportStatistics().subscribe(data => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cp2i-statistiques-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}