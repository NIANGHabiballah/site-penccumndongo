import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-testimonials',
  imports: [],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.css'
})
export class TestimonialsComponent implements OnInit {

  constructor(private meta: Meta, private title: Title) {}

  ngOnInit() {
    this.title.setTitle('Témoignages - Penccum Ndongo');
    this.meta.updateTag({ name: 'description', content: 'Découvrez les témoignages de nos clients satisfaits' });
    
    // JSON-LD pour les témoignages
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Penccum Ndongo",
      "review": [
        {
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": "Pape Malick NIANG"
          },
          "reviewBody": "Nous sommes réellement très satisfaits de vos réalisations, que nous apprécions sincèrement.",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5",
            "bestRating": "5"
          }
        }
      ]
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }
}
