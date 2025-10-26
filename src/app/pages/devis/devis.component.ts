import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-devis',
  imports: [CommonModule, FormsModule],
  templateUrl: './devis.component.html',
  styleUrl: './devis.component.css'
})
export class DevisComponent {

  ngAfterViewInit() {
    // WhatsApp floating icon logic
    const whatsappFloat = document.getElementById('whatsapp-float');
    const whatsappIcon = document.querySelector('.whatsapp-icon');
    const whatsappText = document.getElementById('whatsapp-text');
    const whatsappLink = document.getElementById('whatsapp-link');
    if (whatsappIcon && whatsappFloat && whatsappText && whatsappLink) {
      whatsappIcon.addEventListener('click', (e) => {
        e.preventDefault();
        whatsappFloat.classList.toggle('active');
        if (whatsappFloat.classList.contains('active')) {
          whatsappText.style.display = 'inline-block';
        } else {
          whatsappText.style.display = 'none';
        }
      });
      whatsappText.addEventListener('click', () => {
        window.open(whatsappLink.getAttribute('href')!, '_blank');
      });
    }
  }
  successMsg = '';
  errorMsg = '';

  constructor(private http: HttpClient) {}

  onSubmit(form: NgForm) {
    this.successMsg = '';
    this.errorMsg = '';

    if (form.invalid) {
      this.errorMsg = "Merci de remplir tous les champs obligatoires.";
      return;
    }

    this.http.post<{success: boolean, message: string}>('https://penccumndongo.com/devis.php', form.value)
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
        error: () => {
          this.errorMsg = "Erreur lors de l'envoi du formulaire.";
          this.successMsg = '';
        }
      });
  }

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}