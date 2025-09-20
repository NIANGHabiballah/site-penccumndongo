import { Component } from '@angular/core';

@Component({
  selector: 'app-opportunites',
  imports: [],
  templateUrl: './opportunites.component.html',
  styleUrl: './opportunites.component.css'
})
export class OpportunitesComponent {

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
