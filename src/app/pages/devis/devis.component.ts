import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-devis',
  imports: [FormsModule,],
  templateUrl: './devis.component.html',
  styleUrl: './devis.component.css'
})
export class DevisComponent {
    onSubmit() {
    alert('Votre demande de devis a bien été envoyée !');
  }

  ngOnInit() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

}
