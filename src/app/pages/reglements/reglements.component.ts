import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-reglements',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reglements-container">
      <div class="container">
        <div class="reglements-header">
          <h1>Règlements Officiels du CP2i</h1>
          <div class="edition-badge">{{reglements?.edition}} Édition - {{reglements?.annee}}</div>
        </div>

        <div class="reglements-content" *ngIf="reglements">
          <section class="reglement-section">
            <h2><i class="fas fa-building"></i> 1. ORGANISATION</h2>
            <p>{{reglements.organisation.description}}</p>
            <p><strong>Objectif :</strong> {{reglements.organisation.objectif}}</p>
          </section>

          <section class="reglement-section">
            <h2><i class="fas fa-users"></i> 2. PARTICIPATION</h2>
            <p>{{reglements.participation.ouverture}}</p>
            <p><strong>Période d'inscription :</strong> {{reglements.participation.periode_inscription}}</p>
            <p><strong>Date limite de soumission :</strong> {{reglements.participation.date_limite_soumission}}</p>
            
            <h3>Langues :</h3>
            <ul>
              <li *ngFor="let langue of reglements.participation.langues">{{langue}}</li>
            </ul>

            <h3>Thèmes :</h3>
            <ul>
              <li *ngFor="let theme of reglements.participation.themes">{{theme}}</li>
            </ul>
          </section>

          <section class="reglement-section">
            <h2><i class="fas fa-file-text"></i> 3. SOUMISSION</h2>
            <ul>
              <li>{{reglements.soumission.format}}</li>
              <li>Maximum {{reglements.soumission.limite_vers}}</li>
              <li>{{reglements.soumission.originalite}}</li>
            </ul>
            <h3>Informations requises :</h3>
            <ul>
              <li *ngFor="let info of reglements.soumission.informations_requises">{{info}}</li>
            </ul>
          </section>

          <section class="reglement-section">
            <h2><i class="fas fa-search"></i> 4. PROCESSUS DE SÉLECTION</h2>
            <p>{{reglements.selection.comite}}</p>
            <p>{{reglements.selection.criteres}}</p>

            <p>{{reglements.selection.publication}}</p>
            <p><strong>Mention spéciale :</strong> {{reglements.selection.mention_speciale}}</p>
          </section>

          <section class="reglement-section">
            <h2><i class="fas fa-trophy"></i> 5. RÉCOMPENSES</h2>
            <ul>
              <li>{{reglements.recompenses.prix_par_langue}}</li>
              <li>{{reglements.recompenses.ceremonie}}</li>
              <li>{{reglements.recompenses.details}}</li>
            </ul>
          </section>

          <section class="reglement-section">
            <h2><i class="fas fa-gavel"></i> 6. CONDITIONS GÉNÉRALES</h2>
            <ul>
              <li>{{reglements.conditions.droits}}</li>
              <li>{{reglements.conditions.utilisation}}</li>
              <li>{{reglements.conditions.fraude}}</li>
              <li>{{reglements.conditions.acceptation}}</li>
            </ul>
          </section>

          <section class="reglement-section nouveautes" *ngIf="reglements.nouveautes_2025">
            <h2><i class="fas fa-star"></i> NOUVEAUTÉS {{reglements.annee}}</h2>
            <ul>
              <li><strong>Nouveaux thèmes :</strong> {{reglements.nouveautes_2025.themes_supplementaires}}</li>
              <li><strong>Limite augmentée :</strong> {{reglements.nouveautes_2025.limite_vers_augmentee}}</li>
              <li><strong>Période prolongée :</strong> {{reglements.nouveautes_2025.periode_prolongee}}</li>
              <li><strong>Plateforme numérique :</strong> {{reglements.nouveautes_2025.plateforme_numerique}}</li>
              <li><strong>Suivi en temps réel :</strong> {{reglements.nouveautes_2025.suivi_temps_reel}}</li>
            </ul>
          </section>

          <section class="reglement-section">
            <h2><i class="fas fa-users"></i> PARTICIPATION</h2>
            <p><strong>Lien d'inscription :</strong> <a href="{{reglements.participation_info.lien_inscription}}" target="_blank" class="link-inscription">{{reglements.participation_info.lien_inscription}}</a></p>
            <p class="bonne-chance">Bonne chance à tous les participants !</p>
          </section>

          <section class="reglement-section partenaires">
            <h2><i class="fas fa-handshake"></i> NOS PARTENAIRES OFFICIELS</h2>
            <div class="partenaires-grid">
              <div *ngFor="let partenaire of reglements.partenaires" class="partenaire-item">
                <img [src]="partenaire.logo" [alt]="partenaire.nom" class="partenaire-logo" onerror="this.style.display='none'">
                <span class="partenaire-nom">{{partenaire.nom}}</span>
              </div>
            </div>
            <p class="remerciements">Nous remercions chaleureusement nos partenaires pour leur soutien dans la réalisation de cette troisième édition du Concours de Poésie Inédit & Innovant (CP2i).</p>
          </section>

          <section class="reglement-section contact">
            <h2><i class="fas fa-envelope"></i> CONTACT</h2>
            <p><strong>Téléphone :</strong> {{reglements.contact.telephone}}</p>
            <p><strong>Email :</strong> {{reglements.contact.email}}</p>
            <p><strong>Site web :</strong> {{reglements.contact.site}}</p>
            <p><strong>Suivez-nous sur :</strong></p>
            <div class="reseaux-sociaux">
              <a *ngFor="let reseau of reglements.contact.reseaux" [href]="reseau.lien" target="_blank" class="reseau-link">{{reseau.nom}}</a>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary-blue: #0380c2;
      --primary-orange: #f39c12;
      --dark-blue: #2c3e50;
      --text-dark: #2c3e50;
      --text-light: #7f8c8d;
      --white: #ffffff;
      --light-gray: #f8f9fa;
      --border-radius: 15px;
      --shadow-light: 0 5px 15px rgba(0,0,0,0.08);
      --shadow-medium: 0 10px 30px rgba(0,0,0,0.15);
      --transition: all 0.3s ease;
    }

    .reglements-container {
      padding: 8rem 0 2rem;
      background: linear-gradient(135deg, var(--light-gray) 0%, #ecf0f1 100%);
      min-height: 100vh;
      position: relative;
    }

    .reglements-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 300px;
      background: linear-gradient(135deg, var(--primary-blue), var(--primary-orange));
      opacity: 0.1;
      z-index: 0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      position: relative;
      z-index: 1;
    }

    .reglements-header {
      text-align: center;
      margin-bottom: 4rem;
      position: relative;
    }

    .reglements-header::before {
      content: '';
      position: absolute;
      top: -2rem;
      left: 50%;
      transform: translateX(-50%);
      width: 100px;
      height: 4px;
      background: linear-gradient(135deg, var(--primary-blue), var(--primary-orange));
      border-radius: 2px;
    }

    .reglements-header h1 {
      font-size: clamp(2rem, 5vw, 3.5rem);
      color: var(--text-dark);
      margin-bottom: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }

    .edition-badge {
      background: linear-gradient(135deg, var(--primary-blue), var(--primary-orange));
      color: var(--white);
      padding: 1rem 2rem;
      border-radius: 50px;
      font-weight: 600;
      font-size: 1.1rem;
      display: inline-block;
      box-shadow: var(--shadow-medium);
      position: relative;
      overflow: hidden;
    }

    .edition-badge::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.5s;
    }

    .edition-badge:hover::before {
      left: 100%;
    }

    .reglements-content {
      max-width: 900px;
      margin: 0 auto;
    }

    .reglement-section {
      background: var(--white);
      padding: 3rem;
      margin-bottom: 2.5rem;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-light);
      position: relative;
      overflow: hidden;
      transition: var(--transition);
    }

    .reglement-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 5px;
      height: 100%;
      background: linear-gradient(135deg, var(--primary-blue), var(--primary-orange));
    }

    .reglement-section:hover {
      transform: translateY(-5px);
      box-shadow: var(--shadow-medium);
    }

    .reglement-section h2 {
      color: var(--text-dark);
      font-size: 1.8rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      font-weight: 600;
    }

    .reglement-section h2 i {
      font-size: 1.5rem;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white !important;
    }

    .reglement-section:nth-child(odd) h2 i {
      background: var(--primary-blue);
    }

    .reglement-section:nth-child(even) h2 i {
      background: var(--primary-orange);
    }

    .reglement-section h3 {
      color: var(--primary-blue);
      margin: 2rem 0 1rem;
      font-size: 1.3rem;
      font-weight: 600;
    }

    .reglement-section p {
      color: var(--text-light);
      line-height: 1.8;
      margin-bottom: 1.5rem;
      font-size: 1.05rem;
    }

    .reglement-section ul {
      margin: 1.5rem 0;
      padding-left: 0;
      list-style: none;
    }

    .reglement-section li {
      margin-bottom: 1rem;
      line-height: 1.7;
      padding-left: 2rem;
      position: relative;
      color: var(--text-light);
      font-size: 1.05rem;
    }

    .reglement-section li::before {
      content: '✓';
      position: absolute;
      left: 0;
      top: 0;
      color: var(--primary-orange);
      font-weight: bold;
      font-size: 1.2rem;
    }

    .nouveautes {
      background: linear-gradient(135deg, #fff5e6, #fef9e7);
      border-left: 5px solid var(--primary-orange);
      position: relative;
    }

    .nouveautes::after {
      content: 'NOUVEAU';
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: var(--primary-orange);
      color: var(--white);
      padding: 0.3rem 0.8rem;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .contact {
      background: linear-gradient(135deg, var(--dark-blue), var(--primary-blue));
      color: var(--white);
      position: relative;
      overflow: hidden;
    }

    .contact::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: float 6s ease-in-out infinite;
    }

    .contact h2 {
      color: var(--white) !important;
    }

    .contact h2 i {
      background: var(--primary-orange) !important;
      color: var(--white) !important;
    }

    .contact p {
      color: rgba(255,255,255,0.9) !important;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(180deg); }
    }

    @media (max-width: 768px) {
      .container {
        padding: 0 1rem;
      }
      
      .reglements-header h1 {
        font-size: 2rem;
      }
      
      .reglement-section {
        padding: 2rem 1.5rem;
      }
      
      .reglement-section h2 {
        font-size: 1.5rem;
      }
    }

    .link-inscription {
      color: var(--primary-blue);
      text-decoration: none;
      font-weight: 600;
      word-break: break-all;
    }

    .link-inscription:hover {
      color: var(--primary-orange);
    }

    .bonne-chance {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--primary-orange);
      text-align: center;
      margin: 2rem 0;
    }

    .partenaires {
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    }

    .partenaires-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }

    .partenaire-item {
      background: var(--white);
      padding: 1.5rem 1rem;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: var(--transition);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      min-height: 120px;
    }

    .partenaire-item:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .partenaire-logo {
      max-width: 80px;
      max-height: 60px;
      width: auto;
      height: auto;
      object-fit: contain;
      filter: grayscale(100%);
      transition: var(--transition);
    }

    .partenaire-item:hover .partenaire-logo {
      filter: grayscale(0%);
      transform: scale(1.05);
    }

    .partenaire-nom {
      font-weight: 500;
      color: var(--text-dark);
      font-size: 0.9rem;
      line-height: 1.3;
    }

    .remerciements {
      font-style: italic;
      color: var(--text-light);
      text-align: center;
      margin-top: 2rem;
    }

    @media (max-width: 480px) {
      .reglements-container {
        padding: 6rem 0 2rem;
      }
      
      .reglement-section {
        padding: 1.5rem 1rem;
        margin-bottom: 1.5rem;
      }
      
      .partenaires-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 320px) {
      .partenaires-grid {
        grid-template-columns: 1fr;
      }
    }

    .reseaux-sociaux {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
      position: relative;
      z-index: 5;
    }

    .reseau-link {
      color: rgba(255,255,255,0.9) !important;
      text-decoration: none !important;
      padding: 1rem 2rem;
      background: rgba(255,255,255,0.2);
      border-radius: 30px;
      transition: none;
      font-weight: 600;
      display: inline-block !important;
      cursor: pointer !important;
      min-height: 50px;
      min-width: 120px;
      text-align: center;
      line-height: 1.5;
      border: 2px solid rgba(255,255,255,0.3);
      margin: 0.5rem;
      position: relative;
      z-index: 10;
      pointer-events: auto;
    }

    .reseau-link:hover {
      background: var(--primary-orange);
      color: white;
      border-color: var(--primary-orange);
    }

    .reseau-link:active {
      background: #e67e22;
      transform: scale(0.98);
    }
  `]
})
export class ReglementsComponent implements OnInit {
  reglements: any = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    // Données statiques en cas d'erreur API
    this.reglements = {
      edition: '3ème',
      annee: '2025',
      organisation: {
        description: 'La 3ème édition du Concours de Poésie Inédit et Innovant (CP2i) est organisée par Penccum Ndongo, une entreprise spécialisée dans la promotion des solutions numériques et l\'accompagnement des initiatives culturelles et créatives.',
        objectif: 'Cette année, le CP2i vise à offrir une plateforme d\'expression aux poètes, jeunes et confirmés, pour explorer et partager leur vision sur des thématiques d\'actualité.'
      },
      participation: {
        ouverture: 'Le concours est ouvert à toute personne résidant au Sénégal et à l\'international.',
        periode_inscription: 'du 3 au 23 novembre 2025',
        date_limite_soumission: '23 novembre 2025 à 23h59',
        langues: ['français', 'wolof', 'anglais', 'arabe'],
        themes: ['Patriotisme', 'Justice et dignité', 'Beauté Africaine', 'Jeunesse responsable', 'Sous l\'emprise des écrans']
      },
      soumission: {
        format: 'Un seul poème par participant en format numérique',
        limite_vers: '40 vers maximum',
        originalite: 'Le texte doit être inédit, jamais publié ni présenté dans d\'autres concours',
        informations_requises: ['nom', 'prénom', 'adresse', 'numéro de téléphone', 'email', 'texte']
      },
      selection: {
        comite: 'Les poèmes seront évalués par un comité de lecture composé d\'\u00e9crivains, d\'universitaires et de professionnels du milieu artistique et littéraire.',
        criteres: 'Les meilleurs textes dans chaque langue seront sélectionnés pour la finale.',

        publication: 'Les poèmes finalistes seront publiés sur nos plateformes sociales pour une phase d\'appréciation publique.',
        mention_speciale: 'Le poème le plus aimé et commenté recevra une mention spéciale.'
      },
      recompenses: {
        prix_par_langue: 'Des prix seront attribués aux lauréats des différentes langues',
        ceremonie: 'Les poèmes sélectionnés pourront faire l\'objet de publications ou d\'interprétations lors de la cérémonie de remise des prix',
        details: 'Les détails sur les récompenses seront précisés lors de l\'annonce des finalistes'
      },
      conditions: {
        droits: 'En participant au concours, les auteurs acceptent de céder leurs droits de reproduction et de diffusion à Penccum Ndongo',
        utilisation: 'Les participants autorisent l\'utilisation de leur nom, pseudonyme, image et textes sans contrepartie financière pour les actions liées au concours',
        fraude: 'Toute tentative de fraude entraînera l\'\u00e9limination immédiate du participant concerné',
        acceptation: 'La participation au concours implique l\'acceptation pleine et entière de ce règlement'
      },
      nouveautes_2025: {
        themes_officiels: 'Patriotisme, Justice et dignité, Beauté Africaine, Jeunesse responsable, Sous l\'emprise des écrans',
        limite_vers_augmentee: '40 vers (au lieu de 30)',
        periode_prolongee: 'Inscriptions prolongées jusqu\'au 31 janvier',
        plateforme_numerique: 'Soumission entièrement numérique via le site web',
        suivi_temps_reel: 'Suivi en temps réel du statut de participation'
      },
      participation_info: {
        lien_inscription: 'https://penccumndongo.com/cp2i',
        telephone: '+221 76 841 54 14'
      },
      partenaires: [
        { nom: 'Partenaire 1', logo: 'P1.jpg' },
        { nom: 'Partenaire 2', logo: 'P2.png' },
        { nom: 'Partenaire 3', logo: 'P3.jpg' },
        { nom: 'Partenaire 4', logo: 'P4.jpeg' },
        { nom: 'Partenaire 5', logo: 'P5.png' },
        { nom: 'Partenaire 6', logo: 'P6.jpg' },
        { nom: 'Partenaire 7', logo: 'P7.jpg' },
        { nom: 'Partenaire 8', logo: 'P8.jpg' },
        { nom: 'Partenaire 9', logo: 'P9.jpg' }
      ],
      contact: {
        email: 'penc.pencumndongo@gmail.com',
        site: 'https://penccumndongo.com',
        telephone: '+221 76 841 54 14 / +221 77 629 06 39',
        reseaux: [
          { nom: 'Instagram', lien: 'https://www.instagram.com/penccumndongo' },
          { nom: 'TikTok', lien: 'https://www.tiktok.com/@penccumndongo' },
          { nom: 'LinkedIn', lien: 'https://www.linkedin.com/company/penccum-ndongo' },
          { nom: 'WhatsApp', lien: 'https://wa.me/221768415414' },
          { nom: 'Facebook', lien: 'https://www.facebook.com/penccumndongo' }
        ]
      }
    };
    
    // Tentative de chargement depuis l'API
    this.apiService.getReglementsCourants().subscribe({
      next: (data) => this.reglements = data,
      error: (err) => console.log('Utilisation des données statiques')
    });
  }
}