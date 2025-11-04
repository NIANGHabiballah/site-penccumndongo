import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TextAuthenticityService } from '../../services/text-authenticity.service';
import { Cp2iApiService } from '../../services/cp2i-api.service';

@Component({
  selector: 'app-authenticity-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Notification Toast -->
    <div class="toast-notification" 
         [class.show]="showNotificationFlag" 
         [class.success]="notificationType === 'success'"
         [class.error]="notificationType === 'error'">
      <div class="toast-content">
        <i class="fas" [class.fa-check-circle]="notificationType === 'success'" [class.fa-exclamation-circle]="notificationType === 'error'"></i>
        <span>{{notificationMessage}}</span>
      </div>
    </div>
    
    <div class="authenticity-admin">
      <div class="admin-header">
        <h2><i class="fas fa-shield-alt"></i> Vérification d'Authenticité - Administration</h2>
        <p>Gérer et analyser l'authenticité des textes soumis</p>
      </div>

      <!-- Statistiques -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon"><i class="fas fa-file-alt"></i></div>
          <div class="stat-content">
            <h3>{{totalTexts}}</h3>
            <p>Textes analysés</p>
          </div>
        </div>
        <div class="stat-card suspicious">
          <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
          <div class="stat-content">
            <h3>{{suspiciousTexts}}</h3>
            <p>Textes suspects</p>
          </div>
        </div>
        <div class="stat-card rejected">
          <div class="stat-icon"><i class="fas fa-times-circle"></i></div>
          <div class="stat-content">
            <h3>{{rejectedTexts}}</h3>
            <p>Textes rejetés</p>
          </div>
        </div>
        <div class="stat-card verified">
          <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
          <div class="stat-content">
            <h3>{{verifiedTexts}}</h3>
            <p>Textes vérifiés</p>
          </div>
        </div>
      </div>

      <!-- Actions rapides -->
      <div class="quick-actions">
        <button class="btn btn-primary" (click)="analyzeAllTexts()">
          <i class="fas fa-play"></i> Analyser tous les textes
        </button>
        <button class="btn btn-warning" (click)="reviewSuspicious()">
          <i class="fas fa-search"></i> Réviser suspects
        </button>
      </div>

      <!-- Test manuel -->
      <div class="manual-test">
        <h3><i class="fas fa-clipboard"></i> Test manuel d'authenticité</h3>
        <div class="test-form">
          <textarea [(ngModel)]="manualTestText" placeholder="Collez le texte à vérifier ici..." rows="12"></textarea>
          <div class="test-actions">
            <button class="btn btn-secondary" (click)="clearManualTest()">
              <i class="fas fa-eraser"></i> Effacer
            </button>
            <button class="btn btn-primary" (click)="analyzeManualText()" [disabled]="!manualTestText.trim()">
              <i class="fas fa-search"></i> Analyser ce texte
            </button>
          </div>
        </div>
        
        <!-- Résultat du test manuel -->
        <div class="manual-result" *ngIf="manualTestResult">
          <div class="result-header">
            <h4>Résultat de l'analyse</h4>
          </div>
          <div class="result-content" [ngClass]="{
            'result-accept': manualTestResult.recommendation === 'ACCEPT',
            'result-review': manualTestResult.recommendation === 'REVIEW',
            'result-reject': manualTestResult.recommendation === 'REJECT'
          }">
            <div class="result-score">Score: {{manualTestResult.suspicionScore}}/100</div>
            <div class="result-recommendation">{{getRecommendationLabel(manualTestResult.recommendation)}}</div>
            <div class="result-details">{{manualTestResult.details}}</div>
            
            <div class="result-breakdown">
              <div class="breakdown-item">
                <span class="breakdown-label">🤖 Détection IA:</span>
                <span class="breakdown-score">{{manualTestResult.aiDetection.score}}/100</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">📄 Détection Plagiat:</span>
                <span class="breakdown-score">{{manualTestResult.plagiarismCheck.score}}/100</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">🗄️ Base Interne:</span>
                <span class="breakdown-score">{{manualTestResult.internalCheck.score}}/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Liste des textes -->
      <div class="texts-list">
        <div class="list-header">
          <h3>Textes soumis</h3>
          <div class="filters">
            <select [(ngModel)]="statusFilter" (change)="filterTexts()">
              <option value="all">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="VERIFIE">Vérifiés</option>
              <option value="SUSPECT">Suspects</option>
              <option value="REJETE">Rejetés</option>
            </select>
          </div>
        </div>

        <div class="text-item" *ngFor="let text of filteredTexts">
          <div class="text-info">
            <h4>{{text.titre}}</h4>
            <p>{{text.prenom}} {{text.nom}} - {{text.created_at | date:'dd/MM/yyyy'}}</p>
          </div>
          <div class="authenticity-status">
            <span class="status-badge" [ngClass]="getStatusClass(text.authenticity_status)">
              {{getStatusLabel(text.authenticity_status)}}
            </span>
            <span class="score" *ngIf="text.authenticity_score">
              Score: {{text.authenticity_score}}/100
            </span>
          </div>
          <div class="text-actions">
            <button class="btn-icon" (click)="analyzeText(text)" title="Analyser" 
                    [disabled]="text.authenticity_status === 'VERIFIE' || text.authenticity_status === 'REJETE'">
              <i class="fas fa-search"></i> Analyser
            </button>
            <button class="btn-icon" (click)="sendMessage(text)" title="Contacter participant"
                    *ngIf="text.authenticity_status === 'SUSPECT' || text.authenticity_status === 'REJETE'">
              <i class="fas fa-envelope"></i> Message
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Message -->
    <div class="modal-overlay" *ngIf="showMessageModal" (click)="closeMessageModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Message au participant</h3>
          <button class="modal-close" (click)="closeMessageModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="participant-info" *ngIf="selectedText">
            <h4>{{selectedText.prenom}} {{selectedText.nom}}</h4>
            <p>Texte: "{{selectedText.titre}}"</p>
          </div>
          <div class="form-group">
            <label>Sujet</label>
            <input type="text" [(ngModel)]="messageForm.subject" class="form-control" 
                   placeholder="Concernant votre texte...">
          </div>
          <div class="form-group">
            <label>Message</label>
            <textarea [(ngModel)]="messageForm.content" class="form-control" rows="6"
                      placeholder="Bonjour, nous avons détecté..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="closeMessageModal()">Annuler</button>
          <button class="btn btn-primary" (click)="sendMessageToParticipant()">
            <i class="fas fa-paper-plane"></i> Envoyer
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .authenticity-admin { padding: 2rem; }
    .admin-header { margin-bottom: 2rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .stat-card.suspicious { border-left: 4px solid #ffc107; }
    .stat-card.rejected { border-left: 4px solid #dc3545; }
    .stat-card.verified { border-left: 4px solid #28a745; }
    .quick-actions { display: flex; gap: 1rem; margin-bottom: 2rem; }
    .texts-list { background: white; border-radius: 8px; padding: 1.5rem; }
    .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .text-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; }
    .text-actions { display: flex; align-items: center; gap: 0.5rem; }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.8rem; }
    .status-verified { background: #d4edda; color: #155724; }
    .status-suspicious { background: #fff3cd; color: #856404; }
    .status-rejected { background: #f8d7da; color: #721c24; }
    .status-pending { background: #e2e3e5; color: #495057; }
    .btn { padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; }
    .btn-primary { background: #007bff; color: white; }
    .btn-warning { background: #ffc107; color: #212529; }
    .btn-icon { background: #007bff; color: white; border: none; padding: 0.5rem 1rem; cursor: pointer; border-radius: 4px; margin: 0 0.25rem; }
    .btn-icon:disabled { background: #ccc; cursor: not-allowed; }
    .btn-icon:hover:not(:disabled) { background: #0056b3; }
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal-content { background: white; border-radius: 8px; padding: 2rem; max-width: 500px; width: 90%; }
    .form-group { margin-bottom: 1rem; }
    .form-control { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
    .toast-notification { position: fixed; top: 20px; right: 20px; background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); padding: 1rem 1.5rem; z-index: 1000; transform: translateX(400px); opacity: 0; transition: all 0.3s ease; border-left: 4px solid #28a745; max-width: 400px; }
    .toast-notification.show { transform: translateX(0); opacity: 1; }
    .toast-notification.success { border-left-color: #28a745; }
    .toast-notification.error { border-left-color: #dc3545; }
    .toast-content { display: flex; align-items: center; gap: 0.75rem; }
    .toast-content i { font-size: 1.2rem; }
    .toast-notification.success .toast-content i { color: #28a745; }
    .toast-notification.error .toast-content i { color: #dc3545; }
    .manual-test { background: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; }
    .test-form textarea { width: 100%; min-height: 300px; padding: 1rem; border: 2px solid #ddd; border-radius: 8px; font-family: inherit; font-size: 1rem; line-height: 1.5; resize: vertical; }
    .test-actions { display: flex; gap: 1rem; margin-top: 1rem; }
    .manual-result { margin-top: 1.5rem; padding: 1rem; border-radius: 8px; border: 2px solid #ddd; }
    .result-accept { border-color: #28a745; background: #d4edda; }
    .result-review { border-color: #ffc107; background: #fff3cd; }
    .result-reject { border-color: #dc3545; background: #f8d7da; }
    .result-score { font-size: 1.2rem; font-weight: bold; margin-bottom: 0.5rem; }
    .result-breakdown { margin-top: 1rem; }
    .breakdown-item { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee; }
    .breakdown-score { font-weight: bold; }
  `]
})
export class AuthenticityAdminComponent implements OnInit {
  texts: any[] = [];
  filteredTexts: any[] = [];
  statusFilter = 'all';
  
  totalTexts = 0;
  suspiciousTexts = 0;
  rejectedTexts = 0;
  verifiedTexts = 0;
  
  showMessageModal = false;
  selectedText: any = null;
  messageForm = {
    subject: '',
    content: ''
  };
  
  showNotificationFlag = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';
  
  manualTestText = '';
  manualTestResult: any = null;

  constructor(
    private authenticityService: TextAuthenticityService,
    private cp2iApi: Cp2iApiService
  ) {}

  ngOnInit() {
    this.loadTexts();
  }

  loadTexts() {
    this.cp2iApi.getAllTexts().subscribe({
      next: (response) => {
        this.texts = response.textes || [];
        this.filteredTexts = [...this.texts];
        this.updateStats();
        this.filterTexts();
      },
      error: (error) => {
        console.error('Erreur chargement textes:', error);
        this.texts = [];
        this.filteredTexts = [];
      }
    });
  }

  updateStats() {
    this.totalTexts = this.texts.length;
    this.suspiciousTexts = this.texts.filter(t => t.authenticity_status === 'SUSPECT').length;
    this.rejectedTexts = this.texts.filter(t => t.authenticity_status === 'REJETE').length;
    this.verifiedTexts = this.texts.filter(t => t.authenticity_status === 'VERIFIE').length;
    console.log('Stats updated:', { total: this.totalTexts, suspicious: this.suspiciousTexts, rejected: this.rejectedTexts, verified: this.verifiedTexts });
  }

  filterTexts() {
    console.log('Filtering with:', this.statusFilter);
    if (this.statusFilter === 'all') {
      this.filteredTexts = [...this.texts];
    } else {
      this.filteredTexts = this.texts.filter(t => {
        const status = t.authenticity_status || 'EN_ATTENTE';
        return status === this.statusFilter;
      });
    }
    console.log('Filtered texts:', this.filteredTexts.length);
  }

  async analyzeText(text: any) {
    console.log('Analyzing text:', text.titre);
    try {
      const result = await this.authenticityService.analyzeTextAuthenticity(text.contenu, text.participant_id);
      console.log('Analysis result:', result);
      
      if (result) {
        await this.authenticityService.saveAnalysisResult(text.id, result);
        
        // Mettre à jour le texte localement
        text.authenticity_status = result.recommendation === 'ACCEPT' ? 'VERIFIE' : 
                                  result.recommendation === 'REJECT' ? 'REJETE' : 'SUSPECT';
        text.authenticity_score = result.suspicionScore;
        
        this.updateStats();
        this.filterTexts();
        
        this.showNotification(`Analyse terminée: ${result.details} (Score: ${result.suspicionScore}/100)`, 'success');
      }
    } catch (error) {
      console.error('Erreur analyse:', error);
      this.showNotification('Erreur lors de l\'analyse du texte', 'error');
    }
  }

  async analyzeAllTexts() {
    const textsToAnalyze = this.texts.filter(t => !t.authenticity_status || t.authenticity_status === 'EN_ATTENTE');
    console.log('Analyzing', textsToAnalyze.length, 'texts');
    
    if (textsToAnalyze.length === 0) {
      this.showNotification('Tous les textes ont déjà été analysés', 'error');
      return;
    }
    
    this.showNotification(`Analyse de ${textsToAnalyze.length} texte(s) en cours...`, 'success');
    
    for (let i = 0; i < textsToAnalyze.length; i++) {
      const text = textsToAnalyze[i];
      console.log(`Analyzing ${i + 1}/${textsToAnalyze.length}: ${text.titre}`);
      await this.analyzeText(text);
      
      // Petite pause entre les analyses
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.showNotification('Analyse de tous les textes terminée', 'success');
  }

  sendMessage(text: any) {
    this.selectedText = text;
    this.messageForm = {
      subject: `Concernant votre texte "${text.titre}"`,
      content: ''
    };
    this.showMessageModal = true;
  }

  sendMessageToParticipant() {
    if (!this.selectedText || !this.messageForm.subject || !this.messageForm.content) return;

    // Utiliser l'API de messagerie standard de l'admin
    const messageData = {
      subject: this.messageForm.subject,
      content: this.messageForm.content,
      send_to_all: false,
      recipients: [this.selectedText.participant_id]
    };

    this.cp2iApi.sendMessage(messageData).subscribe({
      next: () => {
        this.closeMessageModal();
        this.showNotification('Message envoyé avec succès au participant', 'success');
      },
      error: (error) => {
        console.error('Erreur envoi message:', error);
        this.showNotification('Erreur lors de l\'envoi du message', 'error');
      }
    });
  }

  closeMessageModal() {
    this.showMessageModal = false;
    this.selectedText = null;
  }
  
  showNotification(message: string, type: 'success' | 'error') {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotificationFlag = true;
    
    setTimeout(() => {
      this.showNotificationFlag = false;
    }, 4000);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'VERIFIE': return 'status-verified';
      case 'SUSPECT': return 'status-suspicious';
      case 'REJETE': return 'status-rejected';
      default: return 'status-pending';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'VERIFIE': return 'Vérifié';
      case 'SUSPECT': return 'Suspect';
      case 'REJETE': return 'Rejeté';
      default: return 'En attente';
    }
  }

  reviewSuspicious() {
    this.statusFilter = 'SUSPECT';
    this.filterTexts();
  }
  
  async analyzeManualText() {
    if (!this.manualTestText.trim()) return;
    
    try {
      this.showNotification('Analyse du texte en cours...', 'success');
      this.manualTestResult = await this.authenticityService.analyzeTextAuthenticity(this.manualTestText.trim());
      this.showNotification('Analyse terminée', 'success');
    } catch (error) {
      console.error('Erreur analyse manuelle:', error);
      this.showNotification('Erreur lors de l\'analyse', 'error');
    }
  }
  
  clearManualTest() {
    this.manualTestText = '';
    this.manualTestResult = null;
  }
  
  getRecommendationLabel(recommendation: string): string {
    switch (recommendation) {
      case 'ACCEPT': return 'ACCEPTÉ - Texte authentique';
      case 'REVIEW': return 'À RÉVISER - Texte suspect';
      case 'REJECT': return 'REJETÉ - Texte non authentique';
      default: return recommendation;
    }
  }
}