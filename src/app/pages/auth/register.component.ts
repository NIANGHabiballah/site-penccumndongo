import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>📝 Inscription CP2i</h2>
        <form (ngSubmit)="register()">
          <div class="form-row">
            <div class="form-group">
              <label>Nom</label>
              <input type="text" [(ngModel)]="user.nom" name="nom" required>
            </div>
            <div class="form-group">
              <label>Prénom</label>
              <input type="text" [(ngModel)]="user.prenom" name="prenom" required>
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="user.email" name="email" required>
          </div>
          <div class="form-group">
            <label>Téléphone</label>
            <input type="tel" [(ngModel)]="user.telephone" name="telephone" required>
          </div>
          <div class="form-group">
            <label>Ville</label>
            <input type="text" [(ngModel)]="user.ville" name="ville">
          </div>
          <button type="submit" class="btn-primary">S'inscrire</button>
        </form>
        <p><a routerLink="/auth/login">Déjà inscrit ? Se connecter</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f8f9fa; }
    .auth-card { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); width: 500px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: 500; }
    .form-group input { width: 100%; padding: 12px; border: 2px solid #ecf0f1; border-radius: 8px; }
    .btn-primary { width: 100%; background: #27ae60; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; }
  `]
})
export class RegisterComponent {
  user = { nom: '', prenom: '', email: '', telephone: '', ville: '' };

  constructor(private router: Router) {}

  register() {
    console.log('Inscription:', this.user);
    this.router.navigate(['/auth/login']);
  }
}