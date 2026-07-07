import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mentions-legales',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mentions-legales.component.html',
  styleUrls: ['./mentions-legales.component.css']
})
export class MentionsLegalesComponent implements OnInit {
  lastUpdate: string = '';

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.setLastUpdateDate();
  }

  private setLastUpdateDate(): void {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long' 
    };
    this.lastUpdate = now.toLocaleDateString('fr-FR', options);
  }
}