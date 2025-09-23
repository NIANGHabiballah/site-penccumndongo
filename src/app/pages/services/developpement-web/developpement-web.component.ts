import { Component } from '@angular/core';

@Component({
  selector: 'app-developpement-web',
  imports: [],
  templateUrl: './developpement-web.component.html',
  styleUrl: './developpement-web.component.css'
})
export class DeveloppementWebComponent {
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
