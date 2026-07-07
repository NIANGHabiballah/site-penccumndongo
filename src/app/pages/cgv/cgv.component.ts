import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cgv',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cgv.component.html',
  styleUrls: ['./cgv.component.css']
})
export class CgvComponent implements OnInit {
  lastUpdate: string = '';
  currentYear: number = new Date().getFullYear();

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.setLastUpdateDate();
  }

  private setLastUpdateDate(): void {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    };
    this.lastUpdate = now.toLocaleDateString('fr-FR', options);
  }
}