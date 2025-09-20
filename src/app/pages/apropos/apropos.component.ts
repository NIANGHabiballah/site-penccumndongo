import { Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Router, NavigationEnd } from '@angular/router';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-apropos',
  templateUrl: './apropos.component.html',
  styleUrls: ['./apropos.component.css'],
  standalone: true,
   imports: [
      RouterModule,
    ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(40px)' }),
        animate('700ms cubic-bezier(.4,2,.6,1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class AproposComponent {

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
  ngOnInit() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

  scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

scrollToBottom() {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}


}