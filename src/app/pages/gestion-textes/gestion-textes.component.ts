import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DashboardDataService, Texte, Correcteur } from '../../services/dashboard-data.service';

@Component({
  selector: 'app-gestion-textes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="gestion-container">
      <div class="header">
        <h1>Gestion des Textes</h1>
        <div class="header-actions">
          <select [(ngModel)]="statusFilter" (change)="filterTextes()" class="filter-select">
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="evalue">Évalué</option>
            <option value="valide">Validé</option>
            <option value="rejete">Rejeté</option>
          </select>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-number">{{textes.length}}</span>
          <span class="stat-label">Total textes</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{getCountByStatus('en_attente')}}</span>
          <span class="stat-label">En attente</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{getCountByStatus('en_cours')}}</span>
          <span class="stat-label">En cours</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{getCountByStatus('evalue')}}</span>
          <span class="stat-label">Évalués</span>
        </div>
      </div>

      <div class="table-container">
        <table class="textes-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Participant</th>
              <th>Date soumission</th>
              <th>Statut</th>
              <th>Correcteur</th>
              <th>Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let texte of filteredTextes">
              <td>
                <div class="texte-title" (click)="showTexteModal(texte)">
                  {{texte.titre}}
                </div>
              </td>
              <td>{{texte.participantNom}}</td>
              <td>{{texte.dateSubmission}}</td>
              <td>
                <span class="status-badge" [ngClass]="'status-' + texte.statut">
                  {{getStatusLabel(texte.statut)}}
                </span>
              </td>
              <td>{{texte.correcteurNom || 'Non assigné'}}</td>
              <td>
                <span *ngIf="texte.note" class="note-badge">{{texte.note}}/10</span>
                <span *ngIf="!texte.note">-</span>
              </td>
              <td>
                <button class="btn-icon" *ngIf="texte.statut === 'en_attente'" 
                        (click)="showAssignModal(texte)" title="Assigner correcteur">
                  <i class="fas fa-user-plus"></i>
                </button>
                <button class="btn-icon" (click)="showTexteModal(texte)" title="Voir détails">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" *ngIf="texte.statut === 'evalue'" 
                        (click)="validateTexte(texte)" title="Valider">
                  <i class="fas fa-check"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal de détails du texte -->
      <div class="modal" *ngIf="selectedTexte">
        <div class="modal-content large">
          <div class="modal-header">
            <h3>{{selectedTexte.titre}}</h3>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          <div class="texte-details">
            <div class="detail-row">
              <strong>Participant:</strong> {{selectedTexte.participantNom}}
            </div>
            <div class="detail-row">
              <strong>Date de soumission:</strong> {{selectedTexte.dateSubmission}}
            </div>
            <div class="detail-row">
              <strong>Statut:</strong> 
              <span class="status-badge" [ngClass]="'status-' + selectedTexte.statut">
                {{getStatusLabel(selectedTexte.statut)}}
              </span>
            </div>
            <div class="detail-row" *ngIf="selectedTexte.correcteurNom">
              <strong>Correcteur:</strong> {{selectedTexte.correcteurNom}}
            </div>
            <div class="detail-row" *ngIf="selectedTexte.note">
              <strong>Note:</strong> <span class="note-badge">{{selectedTexte.note}}/10</span>
            </div>
            <div class="texte-content">
              <strong>Contenu:</strong>
              <div class="content-text">{{selectedTexte.contenu}}</div>
            </div>
            <div class="detail-row" *ngIf="selectedTexte.commentaires">
              <strong>Commentaires:</strong>
              <div class="comments-text">{{selectedTexte.commentaires}}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal d'assignation de correcteur -->
      <div class="modal" *ngIf="showAssignCorrecteur">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Assigner un correcteur</h3>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          <div class="assign-form">
            <div class="form-group">
              <label>Sélectionner un correcteur:</label>
              <select [(ngModel)]="selectedCorrecteurId" class="form-select">
                <option value="">Choisir un correcteur</option>
                <option *ngFor="let correcteur of correcteurs" [value]="correcteur.id">
                  {{correcteur.nom}} - {{correcteur.specialite}}
                </option>
              </select>
            </div>
            <div class="modal-actions">
              <button class="btn btn-secondary" (click)="closeModal()">Annuler</button>
              <button class="btn btn-primary" (click)="assignCorrecteur()" 
                      [disabled]="!selectedCorrecteurId">Assigner</button>
            </div>
          </div>
        </div>
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

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .filter-select {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 6px;
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

    .textes-table {
      width: 100%;
      border-collapse: collapse;
    }

    .textes-table th,
    .textes-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .textes-table th {
      background: none !important;
      font-weight: 600;
      color: #2c3e50;
    }

    .texte-title {
      color: #0380C2;
      cursor: pointer;
      font-weight: 500;
    }

    .texte-title:hover {
      text-decoration: underline;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .status-en_attente {
      background: #fff3cd;
      color: #856404;
    }

    .status-en_cours {
      background: #cce5ff;
      color: #004085;
    }

    .status-evalue {
      background: #d1ecf1;
      color: #0c5460;
    }

    .status-valide {
      background: #d4edda;
      color: #155724;
    }

    .status-rejete {
      background: #f8d7da;
      color: #721c24;
    }

    .note-badge {
      background: #28a745;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
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

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal-content.large {
      max-width: 800px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }

    .texte-details {
      line-height: 1.6;
    }

    .detail-row {
      margin-bottom: 1rem;
    }

    .texte-content {
      margin: 1.5rem 0;
    }

    .content-text {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 0.5rem;
      white-space: pre-wrap;
    }

    .comments-text {
      background: #e7f3ff;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 0.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 8px;
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-primary {
      background: #0380C2;
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class GestionTextesComponent implements OnInit, OnDestroy {
  textes: Texte[] = [];
  filteredTextes: Texte[] = [];
  correcteurs: Correcteur[] = [];
  statusFilter = '';
  selectedTexte: Texte | null = null;
  showAssignCorrecteur = false;
  selectedCorrecteurId: number | null = null;
  texteToAssign: Texte | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(private dashboardService: DashboardDataService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.dashboardService.textes$.subscribe(textes => {
        this.textes = textes;
        this.filterTextes();
      })
    );

    this.subscriptions.push(
      this.dashboardService.correcteurs$.subscribe(correcteurs => {
        this.correcteurs = correcteurs;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  filterTextes() {
    this.filteredTextes = this.statusFilter 
      ? this.textes.filter(t => t.statut === this.statusFilter)
      : this.textes;
  }

  getCountByStatus(status: string): number {
    return this.textes.filter(t => t.statut === status).length;
  }

  getStatusLabel(status: string): string {
    const labels = {
      'en_attente': 'En attente',
      'en_cours': 'En cours',
      'evalue': 'Évalué',
      'valide': 'Validé',
      'rejete': 'Rejeté'
    };
    return labels[status as keyof typeof labels] || status;
  }

  showTexteModal(texte: Texte) {
    this.selectedTexte = texte;
  }

  showAssignModal(texte: Texte) {
    this.texteToAssign = texte;
    this.showAssignCorrecteur = true;
    this.selectedCorrecteurId = null;
  }

  assignCorrecteur() {
    if (this.texteToAssign && this.selectedCorrecteurId) {
      this.dashboardService.assignTexteToCorrecteur(this.texteToAssign.id, this.selectedCorrecteurId);
      this.closeModal();
    }
  }

  validateTexte(texte: Texte) {
    if (confirm('Valider ce texte ?')) {
      this.dashboardService.updateTexte(texte.id, { statut: 'valide' });
    }
  }

  closeModal() {
    this.selectedTexte = null;
    this.showAssignCorrecteur = false;
    this.texteToAssign = null;
    this.selectedCorrecteurId = null;
  }
}