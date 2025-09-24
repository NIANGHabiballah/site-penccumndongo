import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-politique-confidentialite',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './politique-confidentialite.component.html',
  styleUrls: ['./politique-confidentialite.component.css']
})
export class PolitiqueConfidentialiteComponent implements OnInit {

  // Date de mise à jour automatique
  lastUpdate: string = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}