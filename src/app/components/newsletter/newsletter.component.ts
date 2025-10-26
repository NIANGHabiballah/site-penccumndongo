import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NewsletterService } from '../../services/newsletter.service';

@Component({
  selector: 'app-newsletter',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.css']
})
export class NewsletterComponent {
  email: string = '';
  isLoading: boolean = false;
  isSubscribed: boolean = false;
  errorMessage: string = '';

  constructor(private newsletterService: NewsletterService) {}

  onSubmit() {
    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Veuillez saisir une adresse email valide';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Inscription via service réel
    this.newsletterService.subscribeCustom(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.isSubscribed = true;
          this.email = '';
          
          // Reset après 3 secondes
          setTimeout(() => {
            this.isSubscribed = false;
          }, 3000);
        } else {
          this.errorMessage = response.message || 'Erreur lors de l\'inscription';
        }
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 403) {
          this.errorMessage = 'Accès refusé. Veuillez réessayer plus tard.';
        } else if (error.status === 0) {
          this.errorMessage = 'Problème de connexion. Vérifiez votre réseau.';
        } else {
          this.errorMessage = 'Service temporairement indisponible.';
        }
        console.error('Newsletter error:', error);
      }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}