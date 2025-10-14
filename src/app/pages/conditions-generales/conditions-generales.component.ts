import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-conditions-generales',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="conditions-container">
      <div class="container">
        <div class="conditions-header">
          <h1>Conditions Générales d'Utilisation</h1>
          <p class="last-update">Dernière mise à jour : Janvier 2025</p>
        </div>

        <div class="conditions-content">
          <section class="condition-section">
            <h2><i class="fas fa-info-circle"></i> 1. OBJET ET CHAMP D'APPLICATION</h2>
            <p>Les présentes conditions générales d'utilisation régissent l'accès et l'utilisation du site web de <strong>Penccum Ndongo</strong> ainsi que l'ensemble de nos services numériques.</p>
            <p>L'utilisation de notre site implique l'acceptation pleine et entière des présentes conditions générales.</p>
          </section>

          <section class="condition-section">
            <h2><i class="fas fa-building"></i> 2. MENTIONS LÉGALES</h2>
            <ul>
              <li><strong>Raison sociale :</strong> Penccum Ndongo</li>
              <li><strong>Adresse :</strong> Yeumbeul, Comico Série B 156, Dakar, Sénégal</li>
              <li><strong>Email :</strong> penc.pencumndongo&#64;gmail.com</li>
              <li><strong>Téléphone :</strong> +221 77 629 06 39 / +221 76 841 54 14</li>
              <li><strong>Directeur de publication :</strong> Tafsir Haby Niang</li>
            </ul>
          </section>

          <section class="condition-section">
            <h2><i class="fas fa-cogs"></i> 3. SERVICES PROPOSÉS</h2>
            <p>Penccum Ndongo propose les services suivants :</p>
            <ul>
              <li>Développement web et applications mobiles</li>
              <li>Community management et gestion des réseaux sociaux</li>
              <li>Design graphique et sérigraphie</li>
              <li>Formations professionnelles en digital</li>
              <li>Organisation d'événements culturels (CP2i)</li>
              <li>Conseil en communication digitale</li>
            </ul>
          </section>

          <section class="condition-section">
            <h2><i class="fas fa-globe"></i> 4. CONDITIONS D'UTILISATION DU SITE</h2>
            <p>L'accès au site est libre et gratuit. L'utilisateur s'engage à :</p>
            <ul>
              <li>Respecter la propriété intellectuelle de Penccum Ndongo</li>
              <li>Ne pas diffuser de contenu illégal, diffamatoire ou contraire aux bonnes mœurs</li>
              <li>Ne pas perturber le fonctionnement du site</li>
              <li>Fournir des informations exactes lors des formulaires de contact</li>
            </ul>
          </section>

          <section class="condition-section">
            <h2><i class="fas fa-shield-alt"></i> 5. PROTECTION DES DONNÉES PERSONNELLES</h2>
            <p>Conformément au RGPD, nous collectons et traitons vos données personnelles pour :</p>
            <ul>
              <li>Répondre à vos demandes de devis et de contact</li>
              <li>Vous envoyer notre newsletter (avec votre consentement)</li>
              <li>Améliorer nos services</li>
            </ul>
            <p><strong>Vos droits :</strong> Vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition concernant vos données personnelles.</p>
            <p><strong>Durée de conservation :</strong> 3 ans maximum après le dernier contact.</p>
          </section>

          <section class="condition-section">
            <h2><i class="fas fa-copyright"></i> 6. PROPRIÉTÉ INTELLECTUELLE</h2>
            <p>Tous les éléments du site (textes, images, logos, vidéos) sont protégés par le droit d'auteur.</p>
            <ul>
              <li>Toute reproduction sans autorisation est interdite</li>
              <li>Les créations réalisées pour nos clients leur appartiennent après paiement intégral</li>
              <li>Penccum Ndongo conserve le droit d'utiliser ses réalisations à des fins promotionnelles</li>
            </ul>
          </section>

          <section class="condition-section">
            <h2><i class="fas fa-exclamation-triangle"></i> 7. RESPONSABILITÉ</h2>
            <p>Penccum Ndongo s'efforce d'assurer la disponibilité et la sécurité du site, mais ne peut garantir :</p>
            <ul>
              <li>L'absence d'interruptions techniques</li>
              <li>L'exactitude absolue des informations</li>
              <li>La sécurité totale des transmissions</li>
            </ul>
            <p>Notre responsabilité est limitée aux dommages directs et prévisibles.</p>
          </section>

          <section class="condition-section">
            <h2><i class="fas fa-file-contract"></i> 8. DEVIS ET COMMANDES</h2>
            <ul>
              <li><strong>Devis :</strong> Gratuits et valables 30 jours</li>
              <li><strong>Paiement :</strong> 50% à la commande, 50% à la livraison</li>
              <li><strong>Délais :</strong> Indicatifs et peuvent varier selon la complexité</li>
              <li><strong>Modifications :</strong> Possibles mais peuvent entraîner des coûts supplémentaires</li>
            </ul>
          </section>

          <section class="condition-section">
            <h2><i class="fas fa-gavel"></i> 9. DROIT APPLICABLE</h2>
            <p>Les présentes conditions sont régies par le droit sénégalais.</p>
            <p>En cas de litige, les tribunaux de Dakar sont seuls compétents.</p>
          </section>

          <section class="condition-section contact-section">
            <h2><i class="fas fa-envelope"></i> 10. CONTACT ET RÉCLAMATIONS</h2>
            <p>Pour toute question ou réclamation concernant ces conditions :</p>
            <div class="contact-info">
              <p><strong>Email :</strong> penc.pencumndongo&#64;gmail.com</p>
              <p><strong>Téléphone :</strong> +221 77 629 06 39</p>
              <p><strong>Adresse :</strong> Yeumbeul, Comico Série B 156, Dakar, Sénégal</p>
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
      --transition: all 0.3s ease;
    }

    .conditions-container {
      padding: 8rem 0 2rem;
      background: linear-gradient(135deg, var(--light-gray) 0%, #ecf0f1 100%);
      min-height: 100vh;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    .conditions-header {
      text-align: center;
      margin-bottom: 4rem;
    }

    .conditions-header h1 {
      font-size: clamp(2rem, 5vw, 3rem);
      color: var(--text-dark);
      margin-bottom: 1rem;
      font-weight: 700;
    }

    .last-update {
      color: var(--text-light);
      font-style: italic;
    }

    .conditions-content {
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
    }

    .condition-section {
      background: var(--white);
      padding: 2.5rem;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-light);
      position: relative;
      overflow: hidden;
    }

    .condition-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 5px;
      height: 100%;
      background: linear-gradient(135deg, var(--primary-blue), var(--primary-orange));
    }

    .condition-section h2 {
      color: var(--text-dark);
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      font-weight: 600;
    }

    .condition-section h2 i {
      color: var(--primary-blue);
      font-size: 1.2rem;
    }

    .condition-section p {
      color: var(--text-light);
      line-height: 1.7;
      margin-bottom: 1rem;
    }

    .condition-section ul {
      margin: 1rem 0;
      padding-left: 0;
      list-style: none;
    }

    .condition-section li {
      margin-bottom: 0.8rem;
      padding-left: 2rem;
      position: relative;
      color: var(--text-light);
      line-height: 1.6;
    }

    .condition-section li::before {
      content: '▶';
      position: absolute;
      left: 0;
      top: 0;
      color: var(--primary-orange);
      font-size: 0.8rem;
    }

    .contact-section {
      background: linear-gradient(135deg, var(--dark-blue), var(--primary-blue));
      color: var(--white);
    }

    .contact-section h2 {
      color: var(--white) !important;
    }

    .contact-section h2 i {
      color: var(--primary-orange) !important;
    }

    .contact-section p {
      color: rgba(255,255,255,0.9) !important;
    }

    .contact-info {
      background: rgba(255,255,255,0.1);
      padding: 1.5rem;
      border-radius: 10px;
      margin-top: 1rem;
    }

    .contact-info p {
      margin-bottom: 0.5rem;
    }

    @media (max-width: 768px) {
      .container {
        padding: 0 1rem;
      }
      
      .condition-section {
        padding: 2rem 1.5rem;
      }
    }

    @media (max-width: 480px) {
      .conditions-container {
        padding: 6rem 0 2rem;
      }
      
      .condition-section {
        padding: 1.5rem 1rem;
      }
    }
  `]
})
export class ConditionsGeneralesComponent {}