import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-tafsir-haby-niang',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tafsir-haby-niang.component.html',
  styleUrl: './tafsir-haby-niang.component.css'
})
export class TafsirHabyNiangComponent implements OnInit {

  constructor(private meta: Meta, private title: Title) {}

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // SEO Meta tags for better search engine visibility
    this.title.setTitle('Tafsir Haby Niang - Fondateur & CEO Penccum Ndongo | Entrepreneur Digital Sénégal');
    
    this.meta.updateTag({ 
      name: 'description', 
      content: 'Tafsir Haby Niang, Fondateur et CEO de Penccum Ndongo. Entrepreneur digital, développeur full-stack et innovateur social au Sénégal. Expert en transformation digitale et formation professionnelle.' 
    });
    
    this.meta.updateTag({ 
      name: 'keywords', 
      content: 'Tafsir Haby Niang, Penccum Ndongo, entrepreneur digital, CEO Sénégal, développeur full-stack, innovation sociale, transformation digitale, Penc\'Boost, formation professionnelle' 
    });
    
    this.meta.updateTag({ 
      property: 'og:title', 
      content: 'Tafsir Haby Niang - Fondateur & CEO Penccum Ndongo' 
    });
    
    this.meta.updateTag({ 
      property: 'og:description', 
      content: 'Entrepreneur digital passionné par l\'innovation sociale et la transformation digitale en Afrique. Fondateur de Penccum Ndongo et créateur du programme Penc\'Boost.' 
    });
    
    this.meta.updateTag({ 
      property: 'og:image', 
      content: 'https://penccumndongo.com/Tafsir.jpg' 
    });
    
    this.meta.updateTag({ 
      property: 'og:url', 
      content: 'https://penccumndongo.com/equipe/tafsir-haby-niang' 
    });
    
    this.meta.updateTag({ 
      name: 'twitter:card', 
      content: 'summary_large_image' 
    });
    
    this.meta.updateTag({ 
      name: 'twitter:title', 
      content: 'Tafsir Haby Niang - Entrepreneur Digital & CEO Penccum Ndongo' 
    });
    
    this.meta.updateTag({ 
      name: 'twitter:description', 
      content: 'Fondateur de Penccum Ndongo, expert en transformation digitale et innovation sociale au Sénégal.' 
    });
  }
}