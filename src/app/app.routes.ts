import { Routes, RouterModule } from '@angular/router';
import { ServicesComponent } from './pages/services/services.component';
import { PortfolioComponent } from './pages/portfolio/portfolio.component';
import { TestimonialsComponent } from './pages/testimonials/testimonials.component';
import { NewsComponent } from './pages/news/news.component';
import { ContactComponent } from './pages/contact/contact.component';
import { AproposComponent } from './pages/apropos/apropos.component';
import { AccueilComponent } from './pages/accueil/accueil.component';
import { DevisComponent } from './pages/devis/devis.component';

export const routes: Routes = [
  { path: '', redirectTo: '/accueil', pathMatch: 'full' },
  { path: 'accueil', component: AccueilComponent },
  { path: 'apropos', component: AproposComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'portfolio', component: PortfolioComponent },
  { path: 'testimonials', component: TestimonialsComponent },
  { path: 'news', component: NewsComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'devis', component: DevisComponent }
];