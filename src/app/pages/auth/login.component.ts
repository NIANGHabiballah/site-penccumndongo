import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
    }
    
    .welcome-btn.primary {
      background: white;
      color: #2c3e50;
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
    
    .input-wrapper input:focus, .select-wrapper select:focus {
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
      color: #3498db;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s ease;
    }
    
    .link-btn:hover {
      color: #2c3e50;
    }
    
    @media (max-width: 768px) {
      .auth-wrapper {
        flex-direction: column;
      }
      
      .welcome-card {
        padding: 2rem;
      }
    }
    
    @media (max-width: 480px) {
      .auth-card, .welcome-card {
        padding: 2rem;
        margin: 1rem;
      }
    }
  `],
  template: `
    <div class="auth-container">
      <div class="auth-wrapper">
        <div class="welcome-card">
          <h2>Bienvenue sur CP2i</h2>
          <p>Rejoignez la plus grande communauté de poètes de Côte d'Ivoire et participez à des concours prestigieux.</p>
          <div class="welcome-actions">
            <button type="button" class="welcome-btn primary" (click)="goToRegister()">
              <i class="fas fa-user-plus"></i>
              <span>S'inscrire</span>
            </button>
            <button type="button" class="welcome-btn secondary" (click)="login()">
              <i class="fas fa-sign-in-alt"></i>
              <span>Se connecter</span>
            </button>
          </div>
        </div>
        
        <div class="auth-card">
        <div class="auth-header">
          <div class="auth-icon">
            <i class="fas fa-sign-in-alt"></i>
          </div>
          <h1>Connexion</h1>
          <p>Accédez à votre espace CP2i</p>
        </div>
        
        <form (ngSubmit)="login()">
          <div class="input-group">
            <div class="input-wrapper">
              <i class="fas fa-envelope input-icon"></i>
              <input type="email" [(ngModel)]="credentials.email" name="email" placeholder="Votre email" required>
            </div>
          </div>
          
          <div class="input-group">
            <div class="input-wrapper">
              <i class="fas fa-lock input-icon"></i>
              <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="credentials.password" name="password" placeholder="Mot de passe" required>
              <button type="button" class="password-toggle" (click)="togglePassword()">
                <i [class]="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>
          

          
          <button type="submit" class="auth-btn">
            <i class="fas fa-sign-in-alt"></i>
            <span>Se connecter</span>
          </button>
        </form>
        
        <div class="auth-footer">
          <p>Pas encore de compte ?</p>
          <a routerLink="/auth/register" class="link-btn">Créer un compte</a>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  credentials = { email: '', password: '' };
  showPassword = false;

  constructor(private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }

  login() {
    // Redirection vers le dashboard participant par défaut
    this.router.navigate(['/dashboard-participant']);
  }
}