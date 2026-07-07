import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-khadijatou-sidibe',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './khadijatou-sidibe.component.html',
  styleUrl: './khadijatou-sidibe.component.css'
})
export class KhadijatouSidibeComponent implements OnInit {

  constructor(private meta: Meta, private title: Title) {}

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // SEO Meta tags for better search engine visibility
    this.title.setTitle('Khadijatou SIDIBE - Assistante de Direction Penccum Ndongo | Professionnelle Administrative Sénégal');
    
    this.meta.updateTag({ 
      name: 'description', 
      content: 'Khadijatou SIDIBE, Assistante de Direction chez Penccum Ndongo. Professionnelle experte en gestion administrative, coordination et support exécutif au Sénégal.' 
    });
    
    this.meta.updateTag({ 
      name: 'keywords', 
      content: 'Khadijatou SIDIBE, Penccum Ndongo, assistante de direction, gestion administrative, coordination, support exécutif, professionnelle Sénégal, administration entreprise' 
    });
    
    this.meta.updateTag({ 
      property: 'og:title', 
      content: 'Khadijatou SIDIBE - Assistante de Direction Penccum Ndongo' 
    });
    
    this.meta.updateTag({ 
      property: 'og:description', 
      content: 'Professionnelle rigoureuse spécialisée en gestion administrative et coordination. Pilier essentiel de l\'équipe Penccum Ndongo.' 
    });
    
    this.meta.updateTag({ 
      property: 'og:image', 
      content: 'https://penccumndongo.com/ks.jpeg' 
    });
    
    this.meta.updateTag({ 
      property: 'og:url', 
      content: 'https://penccumndongo.com/equipe/khadijatou-sidibe' 
    });
    
    this.meta.updateTag({ 
      name: 'twitter:card', 
      content: 'summary_large_image' 
    });
    
    this.meta.updateTag({ 
      name: 'twitter:title', 
      content: 'Khadijatou SIDIBE - Assistante de Direction & Coordinatrice Administrative' 
    });
    
    this.meta.updateTag({ 
      name: 'twitter:description', 
      content: 'Experte en gestion administrative et coordination chez Penccum Ndongo, entreprise de transformation digitale au Sénégal.' 
    });
  }
}