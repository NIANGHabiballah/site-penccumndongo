import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterModule,],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: 'smooth' }); }
  }
}