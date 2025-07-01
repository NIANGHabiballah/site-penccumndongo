import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-formations',
  imports: [ReactiveFormsModule, CommonModule,],
  templateUrl: './formations.component.html',
  styleUrl: './formations.component.css'
})
export class FormationsComponent {
  
showInscriptionModal = false;
inscriptionForm: FormGroup;
successMsg = '';
errorMsg = '';

  axesList = [
    "Leadership & Développement personnel",
    "Création graphique & design visuel",
    "Tech & Développement",
    "Marketing digital & Présence en ligne",
    "Insertion professionnelle & employabilité",
    "Santé & Bien-être au travail",
    "Création artistique & expression poétique"
  ];

constructor(private fb: FormBuilder, private http: HttpClient) {
  this.inscriptionForm = this.fb.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    dateNaissance: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telephone: ['', Validators.required],
    adresse: ['', Validators.required],
    ville: ['', Validators.required],
    niveauEtudes: ['', Validators.required],
    axes: [[], Validators.required],
    motivation: ['']
  });
}

  onAxeChange(event: any) {
    const axes = this.inscriptionForm.value.axes as string[];
    if (event.target.checked) {
      axes.push(event.target.value);
    } else {
      const index = axes.indexOf(event.target.value);
      if (index > -1) {
        axes.splice(index, 1);
      }
    }
    this.inscriptionForm.get('axes')?.setValue(axes);
    this.inscriptionForm.get('axes')?.markAsTouched();
  }

  submitInscription() {
    this.successMsg = '';
    this.errorMsg = '';
    if (this.inscriptionForm.invalid) {
      this.errorMsg = "Merci de remplir tous les champs obligatoires.";
      this.markAllAsTouched();
      return;
    }
    this.http.post<{success: boolean, message: string}>('http://localhost:8000/inscription.php', this.inscriptionForm.value)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.successMsg = res.message;
            this.errorMsg = '';
            this.inscriptionForm.reset();
          } else {
            this.errorMsg = res.message;
            this.successMsg = '';
          }
        },
        error: () => {
          this.errorMsg = "Erreur lors de l'envoi du formulaire.";
          this.successMsg = '';
        }
      });
  }

   markAllAsTouched() {
    Object.values(this.inscriptionForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  openInscriptionModal() {
  this.showInscriptionModal = true;
}

closeInscriptionModal() {
  this.showInscriptionModal = false;
}

  ngOnInit() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

}