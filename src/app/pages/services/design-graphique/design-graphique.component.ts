import { Component } from '@angular/core';

@Component({
  selector: 'app-design-graphique',
  imports: [],
  templateUrl: './design-graphique.component.html',
  styleUrl: './design-graphique.component.css'
})
export class DesignGraphiqueComponent {
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  filterPortfolio(category: string): void {
    // Logique de filtrage du portfolio
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    // Mettre à jour les boutons actifs
    categoryButtons.forEach(btn => btn.classList.remove('active'));
    const activeButton = document.querySelector(`[onclick*="${category}"]`) as HTMLElement;
    if (activeButton) {
      activeButton.classList.add('active');
    }
    
    // Filtrer les éléments
    portfolioItems.forEach(item => {
      const itemElement = item as HTMLElement;
      if (category === 'all' || itemElement.dataset['category'] === category) {
        itemElement.style.display = 'block';
      } else {
        itemElement.style.display = 'none';
      }
    });
  }
}
