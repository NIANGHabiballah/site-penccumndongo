import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService } from '../../services/contact.service';
import { BannerComponent } from '../../components/banner/banner.component';
import { RecaptchaModule } from 'ng-recaptcha';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, BannerComponent, RecaptchaModule],

  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('350ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]

})
export class AccueilComponent {
  contactData = {
    firstname: '',
    lastname: '',
    phone: '',
    email: '',
    company: '',
    message: ''
  };

  captchaResolved = false;

    activeTab: 'mission' | 'vision' = 'mission';

    setTab(tab: 'mission' | 'vision') {
      this.activeTab = tab;
    }

onCaptchaResolved(response: string | null) {
  this.captchaResolved = !!response;
  this.captchaToken = response ?? '';
}

  constructor(private contactService: ContactService) {}

 captchaToken: string = '';

onSubmit() {
  // Récupérer le token reCAPTCHA
  const recaptchaResponse = (window as any).grecaptcha.getResponse();
  if (!recaptchaResponse) {
    alert('Veuillez valider le reCAPTCHA.');
    return;
  }
  this.captchaToken = recaptchaResponse;

  // Ajoutez le token à vos données si besoin
  const dataToSend = { ...this.contactData, captcha: this.captchaToken };

  this.contactService.sendContactForm(dataToSend).subscribe(response => {
    console.log('Contact form submitted successfully', response);
    // Réinitialiser le reCAPTCHA
    (window as any).grecaptcha.reset();
  });
}

private countersAnimated = false;

ngAfterViewInit() {
  if (this.countersAnimated) return; // Empêche de relancer l'animation
  this.countersAnimated = true;

  setTimeout(() => {
    const counters = document.querySelectorAll('.number');
    counters.forEach(counter => {
      counter.textContent = '0';
      const animate = () => {
        const target = +counter.getAttribute('data-target')!;
        const count = +counter.textContent!;
        const increment = Math.ceil(target / 80);
        // Script pour les boutons de scroll haut/bas
        const scrollTopBtn = document.getElementById('scrollTopBtn');
        const scrollBottomBtn = document.getElementById('scrollBottomBtn');

        if (scrollTopBtn && scrollBottomBtn) {
          scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
          scrollBottomBtn.onclick = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

          window.addEventListener('scroll', () => {
            if (scrollTopBtn)
              scrollTopBtn.style.display = window.scrollY > 200 ? 'block' : 'none';
            if (scrollBottomBtn)
              scrollBottomBtn.style.display = window.scrollY < (document.body.scrollHeight - window.innerHeight - 200) ? 'block' : 'none';
          });
        }
        if (count < target) {
          counter.textContent = `${Math.min(count + increment, target)}`;
          setTimeout(animate, 20);
        } else {
          counter.textContent = `${target}`;
        }
      };
      animate();
    });
  }, 100);
}

}