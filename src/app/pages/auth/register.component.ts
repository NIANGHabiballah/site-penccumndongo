import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { Cp2iApiService, AuthResponse } from '../../services/cp2i-api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-wrapper">
        <div class="welcome-card">
          <h2>Bienvenue sur CP2i</h2>
          <p>Rejoignez la plus grande communauté de poètes d'Afrique et participez à des concours prestigieux. Concours ouvert à tous les Africains !</p>
          <div class="welcome-actions">
            <button type="button" class="welcome-btn primary" (click)="register()">
              <i class="fas fa-user-plus"></i>
              <span>Créer mon compte</span>
            </button>
            <button type="button" class="welcome-btn secondary" (click)="goToLogin()">
              <i class="fas fa-sign-in-alt"></i>
              <span>Se connecter</span>
            </button>
          </div>
        </div>
        
        <div class="auth-card">
        <div class="auth-header">
          <div class="auth-icon">
            <i class="fas fa-user-plus"></i>
          </div>
          <h1>Inscription</h1>
          <p>Rejoignez la communauté panafricaine CP2i</p>
        </div>
        
        <form (ngSubmit)="register()">
          <div class="input-group">
            <div class="input-wrapper">
              <i class="fas fa-user input-icon"></i>
              <input type="text" [(ngModel)]="user.nomComplet" name="nomComplet" placeholder="Nom complet" required>
            </div>
          </div>
          
          <div class="form-row">
            <div class="input-group">
              <div class="input-wrapper">
                <i class="fas fa-envelope input-icon"></i>
                <input type="email" [(ngModel)]="user.email" name="email" placeholder="Email" required>
              </div>
            </div>
            <div class="input-group">
              <div class="input-wrapper">
                <i class="fas fa-phone input-icon"></i>
                <input type="tel" [(ngModel)]="user.telephone" name="telephone" placeholder="Téléphone" required>
              </div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="input-group">
              <div class="input-wrapper">
                <i class="fas fa-lock input-icon"></i>
                <input type="password" [(ngModel)]="user.password" name="password" placeholder="Mot de passe" required>
              </div>
            </div>
            <div class="input-group">
              <div class="input-wrapper">
                <i class="fas fa-lock input-icon"></i>
                <input type="password" [(ngModel)]="user.confirmPassword" name="confirmPassword" placeholder="Confirmer" required>
              </div>
            </div>
          </div>
          
          <div class="input-group">
            <div class="input-wrapper">
              <i class="fas fa-map-marker-alt input-icon"></i>
              <input type="text" [(ngModel)]="user.ville" name="ville" placeholder="Ville (optionnel)">
            </div>
          </div>
          
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="acceptTerms" name="acceptTerms" required>
              <span class="checkmark"></span>
              <span class="checkbox-text">
                J'accepte les <a (click)="voirConditions()" class="terms-link">conditions générales</a> et le <a (click)="voirReglements()" class="terms-link">règlement du concours</a> CP2i
              </span>
            </label>
          </div>
          
          <div *ngIf="errorMessage" class="error-alert">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ errorMessage }}</span>
          </div>
          
          <div *ngIf="successMessage" class="success-alert">
            <i class="fas fa-check-circle"></i>
            <span>{{ successMessage }}</span>
          </div>
          
          <div *ngIf="successMessage && successMessage.includes('email')" class="info-alert">
            <i class="fas fa-info-circle"></i>
            <span>Vérifiez votre boîte mail (y compris les spams) et cliquez sur le lien de vérification.</span>
          </div>
          
          <button type="submit" class="auth-btn" [disabled]="!acceptTerms || isLoading">
            <i *ngIf="!isLoading" class="fas fa-user-plus"></i>
            <i *ngIf="isLoading" class="fas fa-spinner fa-spin"></i>
            <span>{{ isLoading ? 'Inscription...' : 'Créer mon compte' }}</span>
          </button>
        </form>
        
        <div class="auth-footer">
          <p>Déjà un compte ?</p>
          <a routerLink="/auth/login" class="link-btn">Se connecter</a>
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
      max-width: 1000px;
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
      background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
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
      border: none;
      cursor: pointer;
      min-height: 50px;
    }
    
    .welcome-btn.primary {
      background: white;
      color: #f39c12;
      border: 2px solid white;
    }
    
    .welcome-btn.primary:hover {
      background: transparent;
      color: white;
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
      background: linear-gradient(135deg, #f39c12, #e67e22);
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
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    
    .input-group {
      margin-bottom: 1rem;
    }
    
    .input-wrapper, .select-wrapper {
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
    
    .input-wrapper input, .select-wrapper select {
      width: 100%;
      padding: 1rem 1rem 1rem 3rem;
      border: 2px solid #ecf0f1;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: white;
    }
    
    .input-wrapper input:focus, .select-wrapper select:focus {
      outline: none;
      border-color: #f39c12;
      box-shadow: 0 0 0 3px rgba(243, 156, 18, 0.1);
    }
    
    .auth-btn {
      width: 100%;
      background: linear-gradient(135deg, #f39c12, #e67e22);
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
    
    .auth-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(243, 156, 18, 0.3);
    }
    
    .auth-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    
    .checkbox-group {
      margin-bottom: 1.5rem;
    }
    
    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 0.8rem;
      cursor: pointer;
      font-size: 0.9rem;
      line-height: 1.4;
    }
    
    .checkbox-label input[type="checkbox"] {
      display: none;
    }
    
    .checkmark {
      width: 20px;
      height: 20px;
      border: 2px solid #ecf0f1;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      flex-shrink: 0;
      margin-top: 2px;
    }
    
    .checkbox-label input[type="checkbox"]:checked + .checkmark {
      background: #f39c12;
      border-color: #f39c12;
    }
    
    .checkbox-label input[type="checkbox"]:checked + .checkmark::after {
      content: '✓';
      color: white;
      font-weight: bold;
      font-size: 14px;
    }
    
    .checkbox-text {
      color: #7f8c8d;
      flex: 1;
    }
    
    .terms-link {
      color: #f39c12;
      text-decoration: none;
      font-weight: 500;
    }
    
    .terms-link:hover {
      text-decoration: underline;
    }
    
    .auth-footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #ecf0f1;
    }
    
    .auth-footer p {
      color: #7f8c8d;
      margin-bottom: 0.5rem;
    }
    
    .link-btn {
      color: #f39c12;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s ease;
    }
    
    .link-btn:hover {
      color: #e67e22;
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
    
    .info-alert {
      background: #e7f3ff;
      border: 1px solid #b3d9ff;
      color: #0066cc;
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
    
    @media (max-width: 480px) {
      .auth-card {
        padding: 2rem;
        margin: 1rem;
      }
      
      .form-row {
        grid-template-columns: 1fr;
      }
      
      .auth-wrapper {
        flex-direction: column;
      }
      
      .welcome-card {
        padding: 2rem;
      }
    }
  `]
})
export class RegisterComponent {
  user = { nomComplet: '', email: '', telephone: '', password: '', confirmPassword: '', ville: '' };
  acceptTerms = false;
  selectedRole: 'participant' = 'participant';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private router: Router,
    private cp2iApi: Cp2iApiService
  ) {}

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  register() {
    this.errorMessage = '';
    this.successMessage = '';
    
    if (!this.user.nomComplet || !this.user.email || !this.user.password) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }
    
    if (this.user.password !== this.user.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }
    
    if (!this.acceptTerms) {
      this.errorMessage = 'Veuillez accepter les conditions générales';
      return;
    }

    this.isLoading = true;
    
    // Séparer le nom complet en prénom et nom
    const nameParts = this.user.nomComplet.trim().split(' ');
    const prenom = nameParts[0] || '';
    const nom = nameParts.slice(1).join(' ') || nameParts[0] || '';

    const registerData = {
      email: this.user.email,
      password: this.user.password,
      nom: nom,
      prenom: prenom,
      telephone: this.user.telephone || '',
      role: this.selectedRole
    };

    this.cp2iApi.register(registerData).subscribe({
      next: (response: any) => {
        if (response.email_sent) {
          this.successMessage = 'Inscription réussie ! Un email de vérification a été envoyé à votre adresse.';
          this.isLoading = false;
          // Ne pas rediriger automatiquement
        } else {
          this.successMessage = 'Inscription réussie ! Redirection vers la connexion...';
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Erreur lors de l\'inscription';
        this.isLoading = false;
      }
    });
  }

  voirReglements() {
    window.open('/reglements', '_blank');
  }

  voirConditions() {
    window.open('/politique-confidentialite', '_blank');
  }
}