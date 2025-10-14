import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./components/header/header.component";
import { FooterComponent } from "./components/footer/footer.component";
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'penccumndongo';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateCanonicalUrl(event.url);
    });
  }

  private updateCanonicalUrl(url: string): void {
    let canonicalUrl = 'https://penccumndongo.com';
    
    // Normaliser l'URL
    if (url === '/accueil' || url === '/accueil/') {
      canonicalUrl += '/';
    } else {
      canonicalUrl += url;
    }
    
    // Mettre à jour la balise canonical
    let link: HTMLLinkElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (link) {
      link.href = canonicalUrl;
    } else {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', canonicalUrl);
      document.head.appendChild(link);
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToBottom(): void {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
}
