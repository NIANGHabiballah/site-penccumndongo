import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-apropos',
  templateUrl: './apropos.component.html',
  styleUrls: ['./apropos.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule]
})
export class AproposComponent implements OnInit {

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}