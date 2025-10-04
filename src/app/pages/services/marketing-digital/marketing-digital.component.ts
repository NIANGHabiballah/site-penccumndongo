import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-marketing-digital',
  imports: [RouterModule],
  templateUrl: './marketing-digital.component.html',
  styleUrl: './marketing-digital.component.css'
})
export class MarketingDigitalComponent {
  constructor(private router: Router) {}

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  navigateToContact(): void {
    this.router.navigate(['/']).then(() => {
      setTimeout(() => {
        const element = document.getElementById('contact');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    });
  }
}
