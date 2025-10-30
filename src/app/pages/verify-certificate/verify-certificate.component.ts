import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { QrCertificateService } from '../../services/qr-certificate.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-verify-certificate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="verify-container">
      <div class="verify-header">
        <img src="/logo-penccumndongo.png" alt="Penccum Ndongo" class="logo">
        <h1>Vérification de Certificat</h1>
        <p class="subtitle">Concours de Poésie CP2i 2025</p>
      </div>

      <div class="verify-content">
        <!-- Formulaire de saisie du code -->
        <div *ngIf="!verificationResult && !loading" class="verification-form">
          <div class="form-card">
            <h2>Vérifier un Certificat</h2>
            <p class="form-description">Saisissez le code de vérification unique du certificat</p>
            
            <div class="input-group">
              <label for="codeInput">Code de vérification :</label>
              <input 
                type="text" 
                id="codeInput"
                [(ngModel)]="verificationCode"
                placeholder="CP2i-XX-2025-XXXXXXXX"
                class="code-input"
                (keyup.enter)="verifyCode()">
            </div>
            
            <button 
              class="verify-btn" 
              (click)="verifyCode()" 
              [disabled]="!verificationCode || loading">
              <i class="fa fa-search"></i>
              Vérifier le Certificat
            </button>
            
            <div class="help-text">
              <p><i class="fa fa-info-circle"></i> Le code se trouve sur le certificat au format : CP2i-XX-2025-XXXXXXXX</p>
            </div>
          </div>
        </div>

        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Vérification en cours...</p>
        </div>

        <div *ngIf="!loading && verificationResult" class="result-container">
          <div class="result-card" [ngClass]="verificationResult.valid ? 'valid' : 'invalid'">
            <div class="result-icon">
              <i [class]="verificationResult.valid ? 'fa fa-check-circle' : 'fa fa-times-circle'"></i>
            </div>

            <div class="result-content" *ngIf="verificationResult.valid">
              <h2>Certificat Authentique ✓</h2>
              <div class="certificate-info">
                <div class="info-row">
                  <span class="label">Participant:</span>
                  <span class="value">{{verificationResult.data?.participant_name}}</span>
                </div>
                <div class="info-row">
                  <span class="label">Concours:</span>
                  <span class="value">{{verificationResult.data?.concours_title}}</span>
                </div>
                <div class="info-row">
                  <span class="label">Organisateur:</span>
                  <span class="value">{{verificationResult.data?.organisateur}}</span>
                </div>
                <div class="info-row" *ngIf="verificationResult.data?.note_moyenne">
                  <span class="label">Note moyenne:</span>
                  <span class="value">{{verificationResult.data?.note_moyenne}}/20</span>
                </div>
                <div class="info-row">
                  <span class="label">Textes soumis:</span>
                  <span class="value">{{verificationResult.data?.total_textes || 0}}</span>
                </div>
                <div class="info-row">
                  <span class="label">Date d'inscription:</span>
                  <span class="value">{{formatDate(verificationResult.data?.date_inscription)}}</span>
                </div>
                <div class="info-row">
                  <span class="label">Date de délivrance:</span>
                  <span class="value">{{verificationResult.data?.ceremonie_date}}</span>
                </div>
                <div class="info-row">
                  <span class="label">Code vérifié:</span>
                  <span class="value">{{verificationCode}}</span>
                </div>
                <div class="info-row">
                  <span class="label">Vérifications:</span>
                  <span class="value">{{verificationResult.data?.verified_count || 1}} fois</span>
                </div>
              </div>
              
              <div class="authenticity-badge">
                <i class="fa fa-shield-alt"></i>
                <span>Certificat vérifié et authentique</span>
              </div>
            </div>

            <div class="result-content" *ngIf="!verificationResult.valid">
              <h2>Certificat Non Valide ❌</h2>
              <p class="error-message">{{getErrorMessage(verificationResult.reason)}}</p>
              
              <div class="error-details">
                <h3>Que faire ?</h3>
                <ul>
                  <li>Vérifiez que le code est correctement saisi</li>
                  <li>Contactez l'émetteur du certificat</li>
                  <li>Assurez-vous que le certificat n'a pas expiré</li>
                </ul>
              </div>
            </div>
            
            <div class="verify-actions">
              <button class="btn-secondary" (click)="resetVerification()">
                <i class="fa fa-arrow-left"></i> Vérifier un autre certificat
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="verify-footer">
        <p>&copy; 2025 Penccum Ndongo - Système de vérification de certificats</p>
        <div class="footer-links">
          <a href="https://penccumndongo.com">Site officiel</a>
          <a href="mailto:contact@penccumndongo.com">Contact</a>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./verify-certificate.component.css']
})
export class VerifyCertificateComponent implements OnInit {
  verificationResult: any = null;
  loading = false;
  certificateId: string | null = null;
  verificationCode: string = '';

  constructor(
    private route: ActivatedRoute,
    private qrService: QrCertificateService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.certificateId = params['id'];
      if (this.certificateId) {
        this.verificationCode = this.certificateId;
        this.verifyCertificate(this.certificateId);
      }
    });
  }
  
  verifyCode() {
    if (this.verificationCode && this.verificationCode.trim()) {
      this.verifyCertificate(this.verificationCode.trim());
    }
  }
  
  resetVerification() {
    this.verificationResult = null;
    this.verificationCode = '';
    this.loading = false;
  }

  verifyCertificate(code: string) {
    this.loading = true;
    
    // Appeler l'API de vérification de certificat
    this.http.get<any>(`https://penccumndongo.com/verify-certificate.php?code=${encodeURIComponent(code)}`)
      .subscribe({
        next: (result) => {
          this.verificationResult = result;
          this.loading = false;
        },
        error: (error) => {
          this.verificationResult = {
            valid: false,
            reason: 'Erreur de connexion au serveur'
          };
          this.loading = false;
        }
      });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getErrorMessage(reason: string): string {
    const messages = {
      'Format de code invalide. Le code doit être au format: CP2i-XX-2025-XXXXXXXX': reason,
      'Aucun participant trouvé avec cet ID. Vérifiez que le code est correct.': reason,
      'Code de vérification incorrect. Ce code ne correspond pas aux données du participant ou a été modifié.': reason,
      'Erreur de connexion au serveur': 'Impossible de vérifier le certificat. Vérifiez votre connexion internet.'
    };
    return messages[reason as keyof typeof messages] || reason || 'Ce certificat n\'est pas valide.';
  }
}