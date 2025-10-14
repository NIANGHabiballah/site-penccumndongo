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
  }

  getLineCount(): number {
    return this.texte.contenu.split('\n').filter(line => line.trim().length > 0).length;
  }

  isFormValid(): boolean {
    return !!this.texte.titre && 
           !!this.texte.contenu && 
           this.getLineCount() <= 40;
  }

  onSubmit() {
    if (!this.isFormValid()) {
      if (this.getLineCount() > 40) {
        alert('Votre texte dépasse la limite de 40 vers. Veuillez le raccourcir.');
      } else {
        alert('Veuillez remplir tous les champs obligatoires.');
      }
      return;
    }

    this.isSubmitting = true;
    
    this.cp2iApi.submitText(this.texte).subscribe({
      next: (response) => {
        alert('Texte soumis avec succès ! Vous recevrez une notification une fois évalué.');
        this.resetForm();
        this.router.navigate(['/dashboard-participant']);
      },
      error: (error) => {
        alert(error.error?.error || 'Erreur lors de la soumission. Veuillez réessayer.');
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  resetForm() {
    this.texte = {
      titre: '',
      contenu: '',
      langue: 'francais'
    };
  }
}