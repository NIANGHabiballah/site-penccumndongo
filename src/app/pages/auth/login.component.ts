import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>🔐 Connexion CP2i</h2>
        <form (ngSubmit)="login()">
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="credentials.email" name="email" required>
          </div>
          <div class="form-group">
            <label>Mot de passe</label>
            <input type="password" [(ngModel)]="credentials.password" name="password" required>
          </div>
          <div class="form-group">
            <label>Type de compte</label>
            <select [(ngModel)]="credentials.type" name="type">
              <option value="participant">Participant</option>
              <option value="correcteur">Correcteur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <button type="submit" class="btn-primary">Se connecter</button>
        </form>
        <p><a routerLink="/auth/register">Pas de compte ? S'inscrire</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f8f9fa; }
    .auth-card { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); width: 400px; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: 500; }
    .form-group input, .form-group select { width: 100%; padding: 12px; border: 2px solid #ecf0f1; border-radius: 8px; }
    .btn-primary { width: 100%; background: #3498db; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; }
  `]
})
export class LoginComponent {
  credentials = { email: '', password: '', type: 'participant' };

  constructor(private router: Router) {}

  login() {
    if (this.credentials.type === 'participant') {
      this.router.navigate(['/dashboard-participant']);
    } else if (this.credentials.type === 'correcteur') {
      this.router.navigate(['/dashboard-correcteur']);
    } else {
      this.router.navigate(['/dashboard-admin']);
    }
  }
}