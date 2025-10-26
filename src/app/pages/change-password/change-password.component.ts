import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Cp2iApiService } from '../../services/cp2i-api.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-wrapper">
        <div class="welcome-card">
          <h2>Récupération de compte</h2>
          <p>Saisissez votre email pour recevoir un lien de réinitialisation de mot de passe.</p>
          <div class="welcome-actions">
            <button type="button" class="welcome-btn secondary" (click)="goToLogin()">
              <i class="fas fa-arrow-left"></i>
              <span>Retour à la connexion</span>
            </button>
          </div>
        </div>
        
        <div class="auth-card">
          <!-- Étape 1: Demande de réinitialisation -->
          <div *ngIf="!resetToken" class="auth-header">
            <div class="auth-icon">
              <i class="fas fa-key"></i>
            </div>
            <h1>Mot de passe oublié</h1>
            <p>Entrez votre email pour recevoir un lien de réinitialisation</p>
          </div>
          
          <!-- Étape 2: Réinitialisation avec token -->
          <div *ngIf="resetToken" class="auth-header">
            <div class="auth-icon">
              <i class="fas fa-lock"></i>
            </div>
            <h1>Nouveau mot de passe</h1>
            <p>Créez votre nouveau mot de passe</p>
          </div>
          
          <!-- Formulaire demande de réinitialisation -->
          <form *ngIf="!resetToken" (ngSubmit)="requestReset()">
            <div class="input-group">
              <div class="input-wrapper">
                <i class="fas fa-envelope input-icon"></i>
                <input type="email" [(ngModel)]="email" name="email" placeholder="Votre email" required>
              </div>
            </div>
            
            <div *ngIf="errorMessage" class="error-alert">
              <i class="fas fa-exclamation-circle"></i>
              <span>{{ errorMessage }}</span>
            </div>
            
            <div *ngIf="successMessage" class="success-alert">
              <i class="fas fa-check-circle"></i>
              <span>{{ successMessage }}</span>
            </div>
            
            <button type="submit" class="auth-btn" [disabled]="isLoading">
              <i *ngIf="!isLoading" class="fas fa-paper-plane"></i>
              <i *ngIf="isLoading" class="fas fa-spinner fa-spin"></i>
              <span>{{ isLoading ? 'Envoi...' : 'Envoyer le lien' }}</span>
            </button>
          </form>
          
          <!-- Formulaire réinitialisation -->
          <form *ngIf="resetToken" (ngSubmit)="resetPassword()">
            <div class="input-group">
              <div class="input-wrapper">
                <i class="fas fa-envelope input-icon"></i>
                <input type="email" [(ngModel)]="email" name="email" placeholder="Votre email" readonly>
              </div>
            </div>
            
            <div class="input-group">
              <div class="input-wrapper">
                <i class="fas fa-lock input-icon"></i>
                <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="newPassword" name="newPassword" placeholder="Nouveau mot de passe" required>
                <button type="button" class="password-toggle" (click)="togglePassword()">
                  <i [class]="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
            </div>
            
            <div class="input-group">
              <div class="input-wrapper">
                <i class="fas fa-lock input-icon"></i>
                <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="Confirmer le mot de passe" required>
              </div>
            </div>
            
            <div *ngIf="errorMessage" class="error-alert">
              <i class="fas fa-exclamation-circle"></i>
              <span>{{ errorMessage }}</span>
            </div>
            
            <div *ngIf="successMessage" class="success-alert">
              <i class="fas fa-check-circle"></i>
              <span>{{ successMessage }}</span>
            </div>
            
            <button type="submit" class="auth-btn" [disabled]="isLoading">
              <i *ngIf="!isLoading" class="fas fa-key"></i>
              <i *ngIf="isLoading" class="fas fa-spinner fa-spin"></i>
              <span>{{ isLoading ? 'Réinitialisation...' : 'Réinitialiser' }}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      padding: 2rem;
    }
    
    .auth-wrapper {
      display: flex;
      max-width: 900px;
      width: 100%;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    }
    
    .auth-card {
      background: white;
      padding: 3rem;
      flex: 1;
    }
    
    .welcome-card {
      background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
      padding: 3rem;
      color: white;
      text-align: center;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .welcome-card h2 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: white;
    }
    
    .welcome-card p {
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 2rem;
      opacity: 0.9;
      color: white;
    }
    
    .welcome-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .welcome-btn {
      padding: 1rem 2rem;
      border-radius: 25px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-height: 50px;
      border: none;
      cursor: pointer;
    }
    
    .welcome-btn.secondary {
      background: transparent;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.5);
    }
    
    .welcome-btn.secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: white;
    }
    
    .auth-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    
    .auth-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #2c3e50, #3498db);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      color: white;
      font-size: 2rem;
    }
    
    .auth-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }
    
    .auth-header p {
      color: #7f8c8d;
      font-size: 1rem;
    }
    
    .input-group {
      margin-bottom: 1.5rem;
    }
    
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    
    .input-icon {
      position: absolute;
      left: 1rem;
      color: #7f8c8d;
      z-index: 2;
    }
    
    .input-wrapper input {
      width: 100%;
      padding: 1rem 3rem 1rem 3rem;
      border: 2px solid #ecf0f1;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: white;
    }
    
    .password-toggle {
      position: absolute;
      right: 1rem;
      background: none;
      border: none;
      color: #7f8c8d;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      transition: color 0.3s ease;
    }
    
    .password-toggle:hover {
      color: #3498db;
    }
    
    .input-wrapper input:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }
    
    .auth-btn {
      width: 100%;
      background: linear-gradient(135deg, #2c3e50, #3498db);
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 25px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;
      min-height: 50px;
    }
    
    .auth-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(52, 152, 219, 0.3);
    }
    
    .error-alert {
      background: #fee;
      border: 1px solid #fcc;
      color: #c33;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }
    
    .success-alert {
      background: #efe;
      border: 1px solid #cfc;
      color: #3c3;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }
    
    .auth-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    @media (max-width: 768px) {
      .auth-container {
        padding: 2rem 1rem;
        align-items: center;
      }
      
      .auth-wrapper {
        flex-direction: column;
        margin-top: 0;
      }
      
      .welcome-card {
        padding: 1.5rem;
        min-height: auto;
        border-radius: 20px 20px 0 0;
      }
      
      .auth-card {
        padding: 2rem;
        border-radius: 0 0 20px 20px;
      }
      
      .welcome-card h2 {
        font-size: 1.5rem;
      }
      
      .welcome-card p {
        font-size: 1rem;
        margin-bottom: 1.5rem;
      }
    }
  `]
})
export class ChangePasswordComponent implements OnInit {
  email = '';
  newPassword = '';
  confirmPassword = '';
  resetToken = '';
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private cp2iApi: Cp2iApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Vérifier si on a un token dans l'URL
    this.route.queryParams.subscribe(params => {
      this.resetToken = params['token'] || '';
      this.email = params['email'] || '';
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  requestReset() {
    this.errorMessage = '';
    this.successMessage = '';
    
    if (!this.email) {
      this.errorMessage = 'Veuillez saisir votre email';
      return;
    }

    this.isLoading = true;
    this.cp2iApi.requestPasswordReset(this.email).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Erreur lors de l\'envoi';
        this.isLoading = false;
      }
    });
  }

  resetPassword() {
    this.errorMessage = '';
    
    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (this.newPassword.length < 4) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 4 caractères';
      return;
    }

    this.isLoading = true;
    this.cp2iApi.resetPassword(this.resetToken, this.email, this.newPassword).subscribe({
      next: (response) => {
        this.successMessage = 'Mot de passe réinitialisé avec succès ! Redirection...';
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Erreur lors de la réinitialisation';
        this.isLoading = false;
      }
    });
  }
}