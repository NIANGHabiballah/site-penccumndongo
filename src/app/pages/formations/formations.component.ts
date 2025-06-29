import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-formations',
  imports: [ReactiveFormsModule, CommonModule,],
  templateUrl: './formations.component.html',
  styleUrl: './formations.component.css'
})
export class FormationsComponent {
  
showInscriptionModal = false;
inscriptionForm: FormGroup;
axesList = [
  'Communication',
  'Leadership',
  'Prise de parole',
  'Créativité',
  'Gestion de projet',
  'Développement personnel',
  'Autre'
];

constructor(private fb: FormBuilder) {
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

openInscriptionModal() {
  this.showInscriptionModal = true;
}

closeInscriptionModal() {
  this.showInscriptionModal = false;
}

submitInscription() {
  if (this.inscriptionForm.valid) {
    // Traitez l'inscription ici (API, email, etc.)
    alert('Inscription envoyée !');
    this.inscriptionForm.reset();
    this.closeInscriptionModal();
  }
 }

 onAxeChange(event: any) {
  const axes = this.inscriptionForm.value.axes as string[];
  if (event.target.checked) {
    axes.push(event.target.value);
  } else {
    const index = axes.indexOf(event.target.value);
    if (index > -1) axes.splice(index, 1);
  }
  this.inscriptionForm.patchValue({ axes: axes });
  this.inscriptionForm.get('axes')?.updateValueAndValidity();
}

  ngOnInit() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

}