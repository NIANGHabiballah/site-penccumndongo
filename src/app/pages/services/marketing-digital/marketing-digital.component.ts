import { Component } from '@angular/core';

@Component({
  selector: 'app-marketing-digital',
  imports: [],
  templateUrl: './marketing-digital.component.html',
  styleUrl: './marketing-digital.component.css'
})
export class MarketingDigitalComponent {
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
