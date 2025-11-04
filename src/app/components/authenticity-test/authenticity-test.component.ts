import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TextAuthenticityService, AuthenticityResult } from '../../services/text-authenticity.service';

@Component({
  selector: 'app-authenticity-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="authenticity-tester">
      <h2>🔍 Test d'Authenticité de Texte</h2>
      <p class="description">Testez le système de détection de plagiat et d'IA</p>
      
      <div class="test-form">
        <textarea 
          [(ngModel)]="testText" 
          placeholder="Collez ici un texte à analyser..."
          rows="10"
          class="test-textarea">
        </textarea>
        
        <button 
          (click)="analyzeText()" 
          [disabled]="isAnalyzing || !testText.trim()"
          class="analyze-btn">
          {{isAnalyzing ? 'Analyse en cours...' : 'Analyser le Texte'}}
        </button>
      </div>

      <div *ngIf="result" class="results">
        <div class="score-card" [ngClass]="getScoreClass(result.suspicionScore)">
          <h3>Score d'Authenticité: {{result.suspicionScore}}/100</h3>
          <p class="recommendation">{{result.recommendation}}</p>
          <p class="details">{{result.details}}</p>
        </div>

        <div class="analysis-details">
          <div class="analysis-section">
            <h4>🤖 Détection IA</h4>
            <div class="score">Score: {{result.aiDetection.score}}/100</div>
            <ul *ngIf="result.aiDetection.indicators.length > 0">
              <li *ngFor="let indicator of result.aiDetection.indicators">{{indicator}}</li>
            </ul>
            <p *ngIf="result.aiDetection.indicators.length === 0" class="no-issues">Aucun indicateur IA détecté</p>
          </div>

          <div class="analysis-section">
            <h4>📄 Détection Plagiat</h4>
            <div class="score">Score: {{result.plagiarismCheck.score}}/100</div>
            <div *ngIf="result.plagiarismCheck.matches.length > 0">
              <p><strong>Correspondances trouvées:</strong></p>
              <ul>
                <li *ngFor="let match of result.plagiarismCheck.matches">
                  "{{match.phrase}}" - {{match.source}}
                </li>
              </ul>
            </div>
            <p *ngIf="result.plagiarismCheck.matches.length === 0" class="no-issues">Aucun plagiat détecté</p>
          </div>

          <div class="analysis-section">
            <h4>🗄️ Base Interne</h4>
            <div class="score">Score: {{result.internalCheck.score}}/100</div>
            <div *ngIf="result.internalCheck.similarTexts.length > 0">
              <p><strong>Textes similaires:</strong></p>
              <ul>
                <li *ngFor="let similar of result.internalCheck.similarTexts">
                  {{similar.title}} ({{similar.edition}})
                </li>
              </ul>
            </div>
            <p *ngIf="result.internalCheck.similarTexts.length === 0" class="no-issues">Aucune similarité interne</p>
          </div>
        </div>
      </div>

      <div class="test-examples">
        <h3>Exemples de Test</h3>
        <button (click)="loadExample('authentic')" class="example-btn">Texte Authentique</button>
        <button (click)="loadExample('ai')" class="example-btn">Texte IA Suspect</button>
        <button (click)="loadExample('plagiat')" class="example-btn">Texte Plagiat</button>
      </div>
    </div>
  `,
  styles: [`
    .authenticity-tester {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .test-textarea {
      width: 100%;
      padding: 1rem;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      font-family: inherit;
      resize: vertical;
      margin-bottom: 1rem;
    }

    .analyze-btn {
      background: #0380C2;
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    .score-card.high { background: #d4edda; }
    .score-card.medium { background: #fff3cd; }
    .score-card.low { background: #f8d7da; }

    .analysis-section {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
      margin: 1rem 0;
    }

    .example-btn {
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      padding: 0.5rem 1rem;
      margin: 0.5rem;
      border-radius: 6px;
      cursor: pointer;
    }
  `]
})
export class AuthenticityTestComponent {
  testText = '';
  isAnalyzing = false;
  result: AuthenticityResult | null = null;

  constructor(private authenticityService: TextAuthenticityService) {}

  async analyzeText() {
    if (!this.testText.trim()) return;

    this.isAnalyzing = true;
    try {
      this.result = await this.authenticityService.analyzeTextAuthenticity(this.testText);
    } catch (error) {
      console.error('Erreur analyse:', error);
    } finally {
      this.isAnalyzing = false;
    }
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  loadExample(type: string) {
    const examples = {
      authentic: `Mon cœur bat la chamade
Quand je pense à toi
Tes yeux sont mes étoiles`,

      ai: `En tant que poète, il est important de noter que la beauté réside dans l'ensemble des émotions humaines.`,

      plagiat: `Heureux qui, comme Ulysse, a fait un beau voyage`
    };

    this.testText = examples[type as keyof typeof examples] || '';
    this.result = null;
  }
}