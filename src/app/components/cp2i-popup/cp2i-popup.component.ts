import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cp2i-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cp2i-popup.component.html',
  styleUrls: ['./cp2i-popup.component.css']
})
export class Cp2iPopupComponent implements OnInit {
  showPopup = false;

  constructor(private router: Router) {}

  ngOnInit() {
    const lastShown = localStorage.getItem('cp2i-popup-shown');
    const today = new Date().toDateString();
    
    if (lastShown !== today) {
      setTimeout(() => {
        this.showPopup = true;
      }, 2000);
    }
  }

  closePopup() {
    this.showPopup = false;
    localStorage.setItem('cp2i-popup-shown', new Date().toDateString());
  }

  goToInscription() {
    this.closePopup();
    this.router.navigate(['/cp2i']);
  }

  goToLogin() {
    this.closePopup();
    this.router.navigate(['/auth']);
  }
}