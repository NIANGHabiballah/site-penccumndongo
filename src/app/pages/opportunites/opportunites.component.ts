import { Component } from '@angular/core';

@Component({
  selector: 'app-opportunites',
  imports: [],
  templateUrl: './opportunites.component.html',
  styleUrl: './opportunites.component.css'
})
export class OpportunitesComponent {
    ngOnInit() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

}
