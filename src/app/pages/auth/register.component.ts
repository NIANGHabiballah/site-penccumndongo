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
          <div class="already-account-banner">
            <i class="fas fa-info-circle"></i>
            Vous avez déjà un compte ?
            <a routerLink="/auth/login" class="already-account-link">Connectez-vous ici</a>
          </div>
        </div>

        <!-- BLOCAGE INSCRIPTION -->
        <div *ngIf="inscriptionFermee" class="inscription-fermee">
          <div class="fermee-icon"><i class="fas fa-lock"></i></div>
          <h2>Inscriptions non ouvertes</h2>
          <p>Les inscriptions au <strong>Concours CP2i 2026</strong> ouvriront officiellement le :</p>
          <div class="fermee-date">02 Novembre 2026</div>
          <p class="fermee-sub">Revenez à cette date pour vous inscrire. En attendant, suivez-nous sur nos réseaux sociaux !</p>
          <a routerLink="/auth/login" class="btn-login-fermee">
            <i class="fas fa-sign-in-alt"></i> Déjà inscrit ? Se connecter
          </a>
        </div>

        <form *ngIf="!inscriptionFermee" (ngSubmit)="register()">
          <div class="input-group">
            <label class="field-label">Prénom et nom de famille *</label>
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
          
          <div class="form-row">
            <div class="input-group">
              <label class="field-label">Téléphone principal *</label>
              <div class="input-wrapper" [class.error]="fieldErrors.telephone">
                <i class="fas fa-phone input-icon"></i>
                <input type="tel" [(ngModel)]="user.telephone" name="telephone" placeholder="+221 77 123 45 67" required title="Incluez l'indicatif de votre pays">
              </div>
              <small class="field-help">Votre numéro principal avec indicatif pays (ex: +221 77 123 45 67)</small>
              <div *ngIf="fieldErrors.telephone" class="field-error">
                <i class="fas fa-exclamation-circle"></i>
                <span>{{fieldErrors.telephone}}</span>
              </div>
            </div>
            <div class="input-group">
              <label class="field-label">WhatsApp *</label>
              <div class="input-wrapper" [class.error]="fieldErrors.whatsapp">
                <i class="fab fa-whatsapp input-icon"></i>
                <input type="tel" [(ngModel)]="user.whatsapp" name="whatsapp" placeholder="+221 77 123 45 67" required title="Votre numéro WhatsApp avec indicatif pays">
              </div>
              <small class="field-help">Votre numéro WhatsApp avec indicatif pays (ex: +221 77 123 45 67)</small>
              <div *ngIf="fieldErrors.whatsapp" class="field-error">
                <i class="fas fa-exclamation-circle"></i>
                <span>{{fieldErrors.whatsapp}}</span>
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
              <label class="field-label">Confirmation *</label>
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
          
          <div class="input-group" style="margin-top: 2rem;">
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
            <a *ngIf="emailDejaUtilise" (click)="goToLogin()" class="login-redirect-link">
              <i class="fas fa-sign-in-alt"></i> Se connecter maintenant
            </a>
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
      padding: 1.5rem;
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
      padding: 2rem 2.5rem;
      flex: 1;
      overflow-y: auto;
    }
    
    .welcome-card {
      background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
      padding: 2.5rem 2rem;
      color: white;
      text-align: center;
      flex: 0 0 280px;
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
      font-weight: 700;
      font-size: 1.2rem;
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
      margin-bottom: 1.5rem;
    }
    
    .auth-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #f39c12, #e67e22);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
      color: white;
      font-size: 1.4rem;
    }
    
    .auth-header h1 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 0.3rem;
    }
    
    .auth-header p {
      color: #7f8c8d;
      font-size: 0.9rem;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      align-items: start;
    }
    
    .form-row .input-group {
      margin-bottom: 0;
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
      left: 0.8rem;
      color: #7f8c8d;
      z-index: 2;
      font-size: 0.9rem;
    }
    
    .input-wrapper input, .select-wrapper select {
      width: 100%;
      padding: 0.7rem 0.8rem 0.7rem 2.5rem;
      border: 2px solid #ecf0f1;
      border-radius: 10px;
      font-size: 0.9rem;
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
      padding: 0.85rem 2rem;
      border-radius: 25px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.75rem;
      min-height: 46px;
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
      margin-bottom: 1rem;
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
      margin-top: 1rem;
      padding-top: 1rem;
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
      font-size: 0.82rem;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.3rem;
    }
    
    .field-help {
      display: block;
      font-size: 0.75rem;
      color: #7f8c8d;
      margin-top: 0.2rem;
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
    
    .inscription-fermee {
      text-align: center;
      padding: 2rem 1rem;
    }
    
    .fermee-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #e74c3c, #c0392b);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      color: white;
      font-size: 2rem;
    }
    
    .inscription-fermee h2 {
      font-size: 1.6rem;
      color: #2c3e50;
      margin-bottom: 1rem;
    }
    
    .inscription-fermee p {
      color: #7f8c8d;
      margin-bottom: 1rem;
      font-size: 1rem;
    }
    
    .fermee-date {
      font-size: 1.8rem;
      font-weight: 900;
      color: #f39c12;
      background: #fff3cd;
      border: 2px solid #ffc107;
      border-radius: 12px;
      padding: 0.75rem 2rem;
      display: inline-block;
      margin: 1rem 0;
    }
    
    .fermee-sub {
      font-size: 0.9rem;
      color: #95a5a6;
      margin-bottom: 1.5rem;
    }
    
    .btn-login-fermee {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #f39c12, #e67e22);
      color: white;
      padding: 0.9rem 2rem;
      border-radius: 25px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1rem;
      transition: all 0.3s;
    }
    
    .btn-login-fermee:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(243,156,18,0.3);
    }
    
    .already-account-banner {
      background: #fff3cd;
      border: 1px solid #ffc107;
      color: #856404;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .already-account-link {
      color: #f39c12;
      font-weight: 700;
      text-decoration: underline;
      cursor: pointer;
    }
    
    .already-account-link:hover {
      color: #e67e22;
    }
    
    .login-redirect-link {
      display: block;
      margin-top: 0.5rem;
      color: #c33;
      font-weight: 700;
      text-decoration: underline;
      cursor: pointer;
      font-size: 0.95rem;
    }
    
    .login-redirect-link:hover {
      color: #a00;
    }
    
    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
      
      .auth-wrapper {
        flex-direction: column;
      }
    }
    
    @media (max-width: 480px) {
      .auth-card {
        padding: 2rem;
        margin: 1rem;
      }
      
      .welcome-card {
        padding: 2rem;
      }
    }
  `]
})
export class RegisterComponent {
  user = { nomComplet: '', email: '', telephone: '', whatsapp: '', password: '', confirmPassword: '', ville: '' };
  acceptTerms = false;
  selectedRole: 'participant' = 'participant';
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  fieldErrors: any = {};
  emailDejaUtilise = false;

  readonly ouvertureInscription = new Date('2026-11-02');
  get inscriptionFermee(): boolean {
    return new Date() < this.ouvertureInscription;
  }

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
    this.emailDejaUtilise = false;
    
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
      this.fieldErrors.telephone = 'Le numéro de téléphone principal est requis';
      hasErrors = true;
    } else if (!/^\+?[1-9]\d{1,14}$/.test(this.user.telephone.replace(/\s/g, ''))) {
      this.fieldErrors.telephone = 'Format de téléphone invalide (incluez l\'indicatif pays: +221...)';
      hasErrors = true;
    }
    
    if (!this.user.whatsapp) {
      this.fieldErrors.whatsapp = 'Le numéro WhatsApp est requis';
      hasErrors = true;
    } else if (!/^\+?[1-9]\d{1,14}$/.test(this.user.whatsapp.replace(/\s/g, ''))) {
      this.fieldErrors.whatsapp = 'Format WhatsApp invalide (incluez l\'indicatif pays: +221...)';
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
      whatsapp: this.user.whatsapp,
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
            this.emailDejaUtilise = true;
            this.errorMessage = 'Vous avez déjà un compte. Connectez-vous directement !';
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