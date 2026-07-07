import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DashboardDataService, Participant } from '../../services/dashboard-data.service';

@Component({
  selector: 'app-gestion-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="gestion-container">
      <div class="header">
        <h1>Gestion des Utilisateurs</h1>
        <button class="btn btn-primary" (click)="showAddForm = true">
          <i class="fas fa-plus"></i> Ajouter Participant
        </button>
      </div>

      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-number">{{participants.length}}</span>
          <span class="stat-label">Participants</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{getActiveCount()}}</span>
          <span class="stat-label">Actifs</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{getTotalTextes()}}</span>
          <span class="stat-label">Textes soumis</span>
        </div>
      </div>

      <div class="table-container">
        <table class="participants-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Ville</th>
              <th>Date inscription</th>
              <th>Textes</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let participant of participants">
              <td>{{participant.nom}}</td>
              <td>{{participant.email}}</td>
              <td>{{participant.ville}}</td>
              <td>{{participant.dateInscription}}</td>
              <td>{{participant.textesSubmis}}</td>
              <td>
                <span class="status-badge" [ngClass]="'status-' + participant.statut">
                  {{getStatusLabel(participant.statut)}}
                </span>
              </td>
              <td>
                <button class="btn-icon" (click)="toggleStatus(participant)">
                  <i class="fas fa-toggle-on"></i>
                </button>
                <button class="btn-icon danger" (click)="deleteParticipant(participant.id)">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .gestion-container {
      padding: 1rem;
      background: none !important;
    }

    .header {
      margin-bottom: 1rem;
    }

    .header h1 {
      color: #2c3e50;
    }

    .stats-row {
      display: flex;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .stat-item {
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 2rem;
      font-weight: bold;
      color: #0380C2;
    }

    .stat-label {
      color: #666;
      font-size: 0.9rem;
    }

    .table-container {
      background: none !important;
      border-radius: 0 !important;
      overflow: visible !important;
      box-shadow: none !important;
    }

    .participants-table {
      width: 100%;
      border-collapse: collapse;
    }

    .participants-table th,
    .participants-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .participants-table th {
      background: none !important;
      font-weight: 600;
      color: #2c3e50;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .status-actif {
      background: #d4edda;
      color: #155724;
    }

    .status-suspendu {
      background: #f8d7da;
      color: #721c24;
    }

    .status-en_attente {
      background: #fff3cd;
      color: #856404;
    }

    .btn-icon {
      background: none;
      border: none;
      padding: 0.5rem;
      margin: 0 0.25rem;
      border-radius: 4px;
      cursor: pointer;
      color: #666;
    }

    .btn-icon:hover {
      background: #f0f0f0;
      color: #0380C2;
    }

    .btn-icon.danger:hover {
      color: #dc3545;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: #0380C2;
      color: white;
    }
  `]
})
export class GestionUtilisateursComponent implements OnInit, OnDestroy {
  participants: Participant[] = [];
  showAddForm = false;
  
  private subscriptions: Subscription[] = [];

  constructor(private dashboardService: DashboardDataService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.dashboardService.participants$.subscribe(participants => {
        this.participants = participants;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getActiveCount(): number {
    return this.participants.filter(p => p.statut === 'actif').length;
  }

  getTotalTextes(): number {
    return this.participants.reduce((sum, p) => sum + p.textesSubmis, 0);
  }

  getStatusLabel(status: string): string {
    const labels = {
      'actif': 'Actif',
      'suspendu': 'Suspendu',
      'en_attente': 'En attente'
    };
    return labels[status as keyof typeof labels] || status;
  }

  toggleStatus(participant: Participant) {
    const newStatus = participant.statut === 'actif' ? 'suspendu' : 'actif';
    this.dashboardService.updateParticipant(participant.id, { statut: newStatus });
  }

  deleteParticipant(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce participant ?')) {
      this.dashboardService.deleteParticipant(id);
    }
  }
}