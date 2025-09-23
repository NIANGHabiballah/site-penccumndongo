import { Component } from '@angular/core';

@Component({
  selector: 'app-formations-pro',
  imports: [],
  templateUrl: './formations-pro.component.html',
  styleUrl: './formations-pro.component.css'
})
export class FormationsProComponent {
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
