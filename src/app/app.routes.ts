import { Routes, RouterModule } from '@angular/router';
import { ServicesComponent } from './pages/services/services.component';
import { PortfolioComponent } from './pages/portfolio/portfolio.component';
import { TestimonialsComponent } from './pages/testimonials/testimonials.component';
import { NewsComponent } from './pages/news/news.component';
import { ContactComponent } from './pages/contact/contact.component';
import { AproposComponent } from './pages/apropos/apropos.component';
import { AccueilComponent } from './pages/accueil/accueil.component';
import { DevisComponent } from './pages/devis/devis.component';

import { OpportunitesComponent } from './pages/opportunites/opportunites.component';
import { FormationInfographieComponent } from './pages/formation-infographie/formation-infographie.component';
import { FormationsComponent } from './pages/formations/formations.component';

import { Cp2iComponent } from './pages/cp2i/cp2i.component';
import { DeveloppementWebComponent } from './pages/services/developpement-web/developpement-web.component';
import { CommunityManagementComponent } from './pages/services/community-management/community-management.component';
import { DesignGraphiqueComponent } from './pages/services/design-graphique/design-graphique.component';
import { MarketingDigitalComponent } from './pages/services/marketing-digital/marketing-digital.component';
import { FormationsProComponent } from './pages/services/formations-pro/formations-pro.component';

export const routes: Routes = [
  { path: '', component: AccueilComponent },
  { path: 'accueil', redirectTo: '', pathMatch: 'full' },
  { path: 'apropos', component: AproposComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'portfolio', component: PortfolioComponent },
  { path: 'testimonials', component: TestimonialsComponent },
  { path: 'news', component: NewsComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'devis', component: DevisComponent },

  { path: 'opportunites', component: OpportunitesComponent },
  { path: 'formations', component: FormationsComponent },
  { path: 'formation-infographie', component: FormationInfographieComponent },
  { path: 'cp2i', component: Cp2iComponent },
  
  // Routes des services
  { path: 'services/developpement-web', component: DeveloppementWebComponent },
  { path: 'services/community-management', component: CommunityManagementComponent },
  { path: 'services/design-graphique', component: DesignGraphiqueComponent },
  { path: 'services/marketing-digital', component: MarketingDigitalComponent },
  { path: 'services/formations-professionnelles', component: FormationsProComponent },
];