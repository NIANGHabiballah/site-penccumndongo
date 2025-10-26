import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-opportunites',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './opportunites.component.html',
  styleUrl: './opportunites.component.css'
})
export class OpportunitesComponent implements OnInit {

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}