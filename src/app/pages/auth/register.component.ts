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
            <label class="field-label">Nom complet *</label>
            <div class="input-wrapper" [class.error]="fieldErrors.nomComplet">
              <i class="fas fa-user input-icon"></i>
              <input type="text" [(ngModel)]="user.nomComplet" name="nomComplet" placeholder="Prénom et nom de famille" required>
            </div>
            <small class="field-help">⚠️ Ce nom apparaîtra sur votre attestation de participation</small>
            <div *ngIf="fieldErrors.nomComplet" class="field-error">
              <i class="fas fa-exclamation-circle"></i>
              <span>{{fieldErrors.nomComplet}}</span>
            </div>
          </div>
          
          <div class="form-row">
            <div class="input-group">
              <label class="field-label">Adresse email *</label>
              <div class="input-wrapper" [class.error]="fieldErrors.email">
                <i class="fas fa-envelope input-icon"></i>
                <input type="email" [(ngModel)]="user.email" name="email" placeholder="votre@email.com" required>
              </div>
              <div *ngIf="fieldErrors.email" class="field-error">
                <i class="fas fa-exclamation-circle"></i>
                <span>{{fieldErrors.email}}</span>
              </div>
            </div>
            <div class="input-group">
              <label class="field-label">Numéro de téléphone *</label>
              <div class="input-wrapper" [class.error]="fieldErrors.telephone">
                <i class="fas fa-phone input-icon"></i>
                <input type="tel" [(ngModel)]="user.telephone" name="telephone" placeholder="+221 77 123 45 67" required title="Incluez l'indicatif de votre pays">
              </div>
              <small class="field-help">Incluez l'indicatif de votre pays (ex: +221 77 123 45 67)</small>
              <div *ngIf="fieldErrors.telephone" class="field-error">
                <i class="fas fa-exclamation-circle"></i>
                <span>{{fieldErrors.telephone}}</span>
              </div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="input-group">
              <label class="field-label">Mot de passe *</label>
              <div class="input-wrapper" [class.error]="fieldErrors.password">
                <i class="fas fa-lock input-icon"></i>
                <input type="password" [(ngModel)]="user.password" name="password" placeholder="Minimum 6 caractères" required>
              </div>
              <div *ngIf="fieldErrors.password" class="field-error">
                <i class="fas fa-exclamation-circle"></i>
                <span>{{fieldErrors.password}}</span>
              </div>
            </div>
            <div class="input-group">
              <label class="field-label">Confirmer le mot de passe *</label>
              <div class="input-wrapper" [class.error]="fieldErrors.confirmPassword">
                <i class="fas fa-lock input-icon"></i>
                <input type="password" [(ngModel)]="user.confirmPassword" name="confirmPassword" placeholder="Retapez votre mot de passe" required>
              </div>
              <div *ngIf="fieldErrors.confirmPassword" class="field-error">
                <i class="fas fa-exclamation-circle"></i>
                <span>{{fieldErrors.confirmPassword}}</span>
              </div>
            </div>
          </div>
          
          <div class="input-group">
            <label class="field-label">Adresse complète (Ville, Région, Pays) *</label>
            <div class="input-wrapper" [class.error]="fieldErrors.ville">
              <i class="fas fa-map-marker-alt input-icon"></i>
              <input type="text" [(ngModel)]="user.ville" name="ville" placeholder="Ville, Région, Pays" required title="Indiquez votre ville, région/département et pays">
            </div>
            <small class="field-help">Exemple: Dakar, Région de Dakar, Sénégal</small>
            <div *ngIf="fieldErrors.ville" class="field-error">
              <i class="fas fa-exclamation-circle"></i>
              <span>{{fieldErrors.ville}}</span>
            </div>
          </div>
          
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="acceptTerms" name="acceptTerms" required>
              <span class="checkmark"></span>
              <span class="checkbox-text">
                J'accepte les <a (click)="voirConditions()" class="terms-link">conditions générales</a> et le <a (click)="voirReglements()" class="terms-link">règlement du concours</a> CP2i *
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
    
    .field-label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }
    
    .field-help {
      display: block;
      font-size: 0.8rem;
      color: #7f8c8d;
      margin-top: 0.3rem;
      font-style: italic;
    }
    
    .field-error {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.8rem;
      color: #e74c3c;
      margin-top: 0.3rem;
      font-weight: 500;
    }
    
    .input-wrapper.error input,
    .select-wrapper.error select {
      border-color: #e74c3c;
      box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
    }
    
    .input-wrapper.error .input-icon {
      color: #e74c3c;
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
  fieldErrors: any = {};

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
    this.fieldErrors = {};
    
    // Validation détaillée de chaque champ
    let hasErrors = false;
    
    if (!this.user.nomComplet || this.user.nomComplet.trim().length < 2) {
      this.fieldErrors.nomComplet = 'Le nom complet est requis (minimum 2 caractères)';
      hasErrors = true;
    }
    
    if (!this.user.email) {
      this.fieldErrors.email = 'L\'adresse email est requise';
      hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.user.email)) {
      this.fieldErrors.email = 'Format d\'email invalide (exemple: nom@domaine.com)';
      hasErrors = true;
    }
    
    if (!this.user.telephone) {
      this.fieldErrors.telephone = 'Le numéro de téléphone est requis';
      hasErrors = true;
    } else if (!/^\+?[1-9]\d{1,14}$/.test(this.user.telephone.replace(/\s/g, ''))) {
      this.fieldErrors.telephone = 'Format de téléphone invalide (incluez l\'indicatif pays: +221...)';
      hasErrors = true;
    }
    
    if (!this.user.password) {
      this.fieldErrors.password = 'Le mot de passe est requis';
      hasErrors = true;
    } else if (this.user.password.length < 6) {
      this.fieldErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      hasErrors = true;
    }
    
    if (!this.user.confirmPassword) {
      this.fieldErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
      hasErrors = true;
    } else if (this.user.password !== this.user.confirmPassword) {
      this.fieldErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      hasErrors = true;
    }
    
    if (!this.user.ville || this.user.ville.trim().length < 3) {
      this.fieldErrors.ville = 'La localisation est requise (ville, région, pays)';
      hasErrors = true;
    }
    
    if (!this.acceptTerms) {
      this.errorMessage = 'Veuillez accepter les conditions générales et le règlement du concours';
      hasErrors = true;
    }
    
    if (hasErrors) {
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
      telephone: this.user.telephone,
      ville: this.user.ville,
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
        this.isLoading = false;
        console.log('Registration error:', error);
        
        // Messages d'erreur spécifiques du serveur
        if (error.error?.error && typeof error.error.error === 'string') {
          const serverError = error.error.error.toLowerCase();
          
          if (serverError.includes('email') && serverError.includes('utilisé')) {
            this.fieldErrors.email = 'Cette adresse email est déjà utilisée';
          } else if (serverError.includes('email')) {
            this.fieldErrors.email = 'Problème avec l\'adresse email';
          } else if (serverError.includes('téléphone') || serverError.includes('telephone')) {
            this.fieldErrors.telephone = 'Problème avec le numéro de téléphone';
          } else {
            this.errorMessage = error.error.error;
          }
        } else if (error.error?.error) {
          this.errorMessage = String(error.error.error);
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Erreur lors de l\'inscription. Vérifiez votre connexion et réessayez.';
        }
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