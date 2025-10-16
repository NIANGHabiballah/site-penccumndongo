import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Cp2iApiService, Texte } from '../../services/cp2i-api.service';

@Component({
  selector: 'app-soumission-texte',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './soumission-texte.component.html',
  styleUrls: ['./soumission-texte.component.css']
})
export class SoumissionTexteComponent implements OnInit {
  texte: Texte = {
    titre: '',
    contenu: '',
    langue: 'francais'
  };

  isSubmitting = false;

  constructor(
    private cp2iApi: Cp2iApiService,
    private router: Router
  ) {}

  ngOnInit() {
    // Vérifier si l'utilisateur est connecté
    if (!this.cp2iApi.isAuthenticated()) {
      this.router.navigate(['/cp2i']);
      return;
    }
    
    // Vérifier si l'utilisateur a déjà soumis un texte
    this.cp2iApi.getUserTexts().subscribe({
      next: (data) => {
        if (data.textes && data.textes.length > 0) {
          this.showToast('Vous avez déjà soumis un texte pour cette édition.', 'error');
          setTimeout(() => {
            this.router.navigate(['/dashboard-participant']);
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Erreur lors de la vérification:', error);
      }
    });
  }

  getLineCount(): number {
    return this.texte.contenu.split('\n').filter(line => line.trim().length > 0).length;
  }

  isFormValid(): boolean {
    return !!this.texte.titre && 
           !!this.texte.contenu && 
           this.getLineCount() <= 40;
  }

  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';

  onSubmit() {
    if (!this.isFormValid()) {
      if (this.getLineCount() > 40) {
        this.showToast('Votre texte dépasse la limite de 40 vers. Veuillez le raccourcir.', 'error');
      } else {
        this.showToast('Veuillez remplir tous les champs obligatoires.', 'error');
      }
      return;
    }

    this.isSubmitting = true;
    
    this.cp2iApi.submitText(this.texte).subscribe({
      next: (response) => {
        this.showToast('Texte soumis avec succès ! Vous recevrez une notification une fois évalué.', 'success');
        this.resetForm();
        setTimeout(() => {
          this.router.navigate(['/dashboard-participant']);
        }, 2000);
      },
      error: (error) => {
        this.showToast(error.error?.error || 'Erreur lors de la soumission. Veuillez réessayer.', 'error');
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  showToast(message: string, type: 'success' | 'error') {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;
    
    setTimeout(() => {
      this.showNotification = false;
    }, 4000);
  }

  resetForm() {
    this.texte = {
      titre: '',
      contenu: '',
      langue: 'francais'
    };
  }
}