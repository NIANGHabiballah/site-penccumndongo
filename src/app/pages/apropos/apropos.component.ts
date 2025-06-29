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
  ngOnInit() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

}