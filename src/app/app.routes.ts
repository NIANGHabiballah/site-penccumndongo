import { Routes, RouterModule } from '@angular/router';
import { ServicesComponent } from './pages/services/services.component';
import { PortfolioComponent } from './pages/portfolio/portfolio.component';
import { TestimonialsComponent } from './pages/testimonials/testimonials.component';
import { NewsComponent } from './pages/news/news.component';

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
import { TafsirHabyNiangComponent } from './pages/equipe/tafsir-haby-niang.component';
import { KhadijatouSidibeComponent } from './pages/equipe/khadijatou-sidibe.component';
import { MentionsLegalesComponent } from './pages/mentions-legales/mentions-legales.component';
import { PolitiqueConfidentialiteComponent } from './pages/politique-confidentialite/politique-confidentialite.component';
import { CgvComponent } from './pages/cgv/cgv.component';
import { SecurityGuard } from './guards/security.guard';

export const routes: Routes = [
  { path: '', component: AccueilComponent },
  { path: 'accueil', component: AccueilComponent },
  { path: 'apropos', component: AproposComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'portfolio', component: PortfolioComponent },
  { path: 'testimonials', component: TestimonialsComponent },
  { path: 'news', component: NewsComponent },

  { path: 'devis', component: DevisComponent, canActivate: [SecurityGuard] },

  { path: 'opportunites', component: OpportunitesComponent },
  { path: 'formations', component: FormationsComponent, canActivate: [SecurityGuard] },
  { path: 'formation-infographie', component: FormationInfographieComponent, canActivate: [SecurityGuard] },
  { path: 'penc-boost', component: FormationInfographieComponent, canActivate: [SecurityGuard] },
  { path: 'cp2i', component: Cp2iComponent },
  
  // Routes des services
  { path: 'services/developpement-web', component: DeveloppementWebComponent },
  { path: 'services/community-management', component: CommunityManagementComponent },
  { path: 'services/design-graphique', component: DesignGraphiqueComponent },
  { path: 'services/marketing-digital', component: MarketingDigitalComponent },
  { path: 'services/formations-professionnelles', component: FormationsProComponent },
  
  // Routes des profils d'équipe
  { path: 'equipe/tafsir-haby-niang', component: TafsirHabyNiangComponent },
  { path: 'equipe/khadijatou-sidibe', component: KhadijatouSidibeComponent },
  
  // Routes des pages légales
  { path: 'mentions-legales', component: MentionsLegalesComponent },
  { path: 'politique-confidentialite', component: PolitiqueConfidentialiteComponent },
  { path: 'cgv', component: CgvComponent },
];