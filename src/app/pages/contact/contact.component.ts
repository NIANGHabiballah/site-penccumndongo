import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RecaptchaModule } from 'ng-recaptcha';

@Component({
  selector: 'app-contact',
  imports: [CommonModule, FormsModule, RecaptchaModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  successMsg = '';
  errorMsg = '';
  recaptchaToken = '';

  constructor(private http: HttpClient) {}

  onRecaptchaResolved(token: string | null) {
    this.recaptchaToken = token || '';
  }

  onSubmit(form: NgForm) {
    this.successMsg = '';
    this.errorMsg = '';

    if (form.invalid) {
      this.errorMsg = "Merci de remplir tous les champs obligatoires.";
      return;
    }

    if (!this.recaptchaToken) {
      this.errorMsg = "Veuillez valider le reCAPTCHA.";
      return;
    }

    const formData = {
      ...form.value,
      recaptchaToken: this.recaptchaToken
    };

    this.http.post<{success: boolean, message: string}>('https://penccumndongo.com/contact.php', formData)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.successMsg = res.message;
            this.errorMsg = '';
            form.resetForm();
            this.recaptchaToken = '';
          } else {
            this.errorMsg = res.message;
            this.successMsg = '';
          }
        },
        error: () => {
          this.errorMsg = "Erreur lors de l'envoi du message.";
          this.successMsg = '';
        }
      });
  }

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
