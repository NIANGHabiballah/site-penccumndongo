import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-formations-pro',
  imports: [RouterModule],
  templateUrl: './formations-pro.component.html',
  styleUrl: './formations-pro.component.css'
})
export class FormationsProComponent {
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
