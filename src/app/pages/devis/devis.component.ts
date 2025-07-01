import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-devis',
  imports: [CommonModule, FormsModule,],
  templateUrl: './devis.component.html',
  styleUrl: './devis.component.css'
})
export class DevisComponent {
  successMsg = '';
  errorMsg = '';

    constructor(private http: HttpClient) {}

  onSubmit(form: NgForm) {
    if (form.invalid) {
      this.errorMsg = "Merci de remplir tous les champs obligatoires.";
      this.successMsg = '';
      return;
    }
    this.http.post<{success: boolean, message: string}>('http://localhost:8000/devis.php', form.value)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.successMsg = res.message;
            this.errorMsg = '';
            form.resetForm();
          } else {
            this.errorMsg = res.message;
            this.successMsg = '';
          }
        },
        error: (err) => {
          this.errorMsg = "Erreur lors de l'envoi du formulaire.";
          this.successMsg = '';
        }
      });
  }

  ngOnInit() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

}
