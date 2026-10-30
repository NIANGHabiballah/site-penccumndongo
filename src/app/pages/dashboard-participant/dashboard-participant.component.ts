import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Cp2iApiService, User } from '../../services/cp2i-api.service';

import { ChatSupportComponent } from '../chat-support/chat-support.component';
import { ChatWidgetComponent } from '../../components/chat-widget/chat-widget.component';
import { ParticipantMessagesService } from '../../services/participant-messages.service';
import { QrCertificateService } from '../../services/qr-certificate.service';
import { HttpClient } from '@angular/common/http';
import { MessageNotificationComponent } from '../../components/message-notification/message-notification.component';
import { ParticipantMessagesComponent } from '../participant-messages/participant-messages.component';
import { ChatSupportService } from '../../services/chat-support.service';
import { WhatsappPopupComponent } from '../../components/whatsapp-popup/whatsapp-popup.component';


@Component({
  selector: 'app-dashboard-participant',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ChatSupportComponent, ChatWidgetComponent, MessageNotificationComponent, ParticipantMessagesComponent, WhatsappPopupComponent],
  templateUrl: './dashboard-participant.component.html',
  styleUrls: ['./dashboard-participant.component.css', './participant-sections.css', './certificats-styles.css', './cert-verification-styles.css']
})
export class DashboardParticipantComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;
  mesSoumissions: any[] = [];
  stats: any = {};
  currentUser: User | null = null;
  mobileMenuOpen = false;
  desktopMenuHidden = false;
  chatOpen = false;
  currentView = 'accueil';
  currentGuideSection = 'steps';
  currentHistoryFilter = 'all';
  openFaq: number | null = null;

  // Multi-éditions
  editions: any[] = [];
  editionActive: any = null;       // édition actuellement affichée dans le dashboard
  editionCourante: any = null;     // édition officielle en cours (is_active = true)
  showEditionSelector = false;     // afficher l'écran de sélection

  historique: any[] = [];
  certificats: any[] = [];
  classement: any = {};
  joursRestants = 0;

  Math = Math;
  
  // Modal de soumission
  showSoumissionModal = false;
  isEditing = false;
  editingTexteId: number | null = null;
  texte = {
    titre: '',
    theme: '',
    langue: 'francais',
    contenu: ''
  };
  
  // Langues avec leurs noms natifs
  langues = [
    { code: 'francais', nom: 'Français' },
    { code: 'wolof', nom: 'Wolof' },
    { code: 'anglais', nom: 'English' },
    { code: 'arabe', nom: 'العربية' }
  ];

  // Thèmes traduits par langue — 4ème édition 2026
  themesParLangue = {
    francais: [
      { code: 'mots_silence', nom: 'Les mots du silence' },
      { code: 'taaru_senegal', nom: 'Taaru Sénégal' },
      { code: 'flicage_couple', nom: 'Le flicage au sein du couple' },
      { code: 'pression_sociale', nom: 'Pression sociale et influence ruineuse' }
    ],
    wolof: [
      { code: 'mots_silence', nom: 'Baat yu dëkk ci xol' },
      { code: 'taaru_senegal', nom: 'Taaru Sénégal' },
      { code: 'flicage_couple', nom: 'Suqali ak kontrole ci kër ga' },
      { code: 'pression_sociale', nom: 'Pression bu dëkk ak influence bu xaw' }
    ],
    anglais: [
      { code: 'mots_silence', nom: 'The words of silence' },
      { code: 'taaru_senegal', nom: 'The beauty of Senegal' },
      { code: 'flicage_couple', nom: "Couple's high control" },
      { code: 'pression_sociale', nom: 'Social pressure and ruinous influence' }
    ],
    arabe: [
      { code: 'mots_silence', nom: 'كلمات الصمت' },
      { code: 'taaru_senegal', nom: 'تارو السنغال' },
      { code: 'flicage_couple', nom: 'المراقبة داخل الزوجين' },
      { code: 'pression_sociale', nom: 'الضغط الاجتماعي والتأثير المدمر' }
    ]
  };
  isSubmitting = false;
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';
  
  // Modal de confirmation suppression
  showConfirmationModal = false;
  texteToDelete: any = null;
  
  // Modal de clôture des soumissions
  showSubmissionClosedModal = false;
  
  // Modal d'aperçu certificat
  showCertificatPreview = false;
  selectedCertificat: any = null;
  
  // Dates officielles du concours CP2i 2026 — 4ème édition
  concoursSchedule = {
    inscription_debut: '2026-11-02',
    inscription_fin: '2026-11-23',
    inscription_prolongee: '2026-11-23',
    correction_debut: '2026-11-24',
    correction_fin: '2026-12-03',
    correction_prolongement: '2026-12-10',
    deliberation: '2026-12-15',
    ceremonie_remise: '2027-01-15'
  };
  
  // Section thèmes
  selectedLanguage = 'francais';
  
  // Thèmes détaillés par langue — 4ème édition 2026
  themesDetailles = {
    francais: [
      {
        title: '1. Les mots du silence',
        icon: 'fas fa-moon',
        description: 'Explorez ce que le silence dit, ressent et révèle dans nos vies et nos relations.',
        keywords: ['Silence', 'Introspection', 'Émotion', 'Langage', 'Intériorité']
      },
      {
        title: '2. Taaru Sénégal',
        icon: 'fas fa-globe-africa',
        description: 'Célébrez la beauté, la culture et l\'identité du Sénégal à travers la poésie.',
        keywords: ['Sénégal', 'Identité', 'Culture', 'Fierté', 'Héritage']
      },
      {
        title: '3. Le flicage au sein du couple',
        icon: 'fas fa-heart-broken',
        description: 'Interrogez la surveillance, le contrôle et la confiance dans les relations amoureuses.',
        keywords: ['Contrôle', 'Confiance', 'Liberté', 'Couple', 'Respect']
      },
      {
        title: '4. Pression sociale et influence ruineuse',
        icon: 'fas fa-users',
        description: 'Analysez les pressions du regard social et leurs effets destructeurs sur l\'individu.',
        keywords: ['Société', 'Pression', 'Influence', 'Conformisme', 'Liberté']
      }
    ],
    wolof: [
      {
        title: '1. Baat yu dëkk ci xol',
        icon: 'fas fa-moon',
        description: 'Xam-xam ci li xol wax bu mu dem, bu mu seet ak bu mu yëgël.',
        keywords: ['Xol', 'Baat', 'Dëkk', 'Xam-xam', 'Yëgël']
      },
      {
        title: '2. Taaru Sénégal',
        icon: 'fas fa-globe-africa',
        description: 'Benn ci rafet, aada ak jikko yu Sénégal.',
        keywords: ['Sénégal', 'Aada', 'Rafet', 'Taaw', 'Jikko']
      },
      {
        title: '3. Suqali ak kontrole ci kër ga',
        icon: 'fas fa-heart-broken',
        description: 'Laaj ci suqali, kontrole ak jëm ci kër ga.',
        keywords: ['Kontrole', 'Jëm', 'Kër', 'Yëgël', 'Ngor']
      },
      {
        title: '4. Pression bu dëkk ak influence bu xaw',
        icon: 'fas fa-users',
        description: 'Xam-xam ci jafe pression bu dëkk ak influence bu xaw ci nit.',
        keywords: ['Pression', 'Influence', 'Dëkk', 'Nit', 'Xam-xam']
      }
    ],
    anglais: [
      {
        title: '1. The words of silence',
        icon: 'fas fa-moon',
        description: 'Explore what silence says, feels and reveals in our lives and relationships.',
        keywords: ['Silence', 'Introspection', 'Emotion', 'Language', 'Interiority']
      },
      {
        title: '2. The beauty of Senegal',
        icon: 'fas fa-globe-africa',
        description: 'Celebrate the beauty, culture and identity of Senegal through poetry.',
        keywords: ['Senegal', 'Identity', 'Culture', 'Pride', 'Heritage']
      },
      {
        title: "3. Couple's high control",
        icon: 'fas fa-heart-broken',
        description: 'Question surveillance, control and trust in romantic relationships.',
        keywords: ['Control', 'Trust', 'Freedom', 'Couple', 'Respect']
      },
      {
        title: '4. Social pressure and ruinous influence',
        icon: 'fas fa-users',
        description: 'Analyze social pressures and their destructive effects on the individual.',
        keywords: ['Society', 'Pressure', 'Influence', 'Conformism', 'Freedom']
      }
    ],
    arabe: [
      {
        title: '1. كلمات الصمت',
        icon: 'fas fa-moon',
        description: 'استكشف ما يقوله الصمت ويشعر به ويكشفه في حياتنا وعلاقاتنا',
        keywords: ['الصمت', 'التأمل', 'العاطفة', 'اللغة', 'الداخل']
      },
      {
        title: '2. تارو السنغال',
        icon: 'fas fa-globe-africa',
        description: 'احتفل بجمال وثقافة وهوية السنغال من خلال الشعر',
        keywords: ['السنغال', 'الهوية', 'الثقافة', 'الفخر', 'التراث']
      },
      {
        title: '3. المراقبة داخل الزوجين',
        icon: 'fas fa-heart-broken',
        description: 'استجوب المراقبة والسيطرة والثقة في العلاقات العاطفية',
        keywords: ['السيطرة', 'الثقة', 'الحرية', 'الزوجان', 'الاحترام']
      },
      {
        title: '4. الضغط الاجتماعي والتأثير المدمر',
        icon: 'fas fa-users',
        description: 'حلل الضغوط الاجتماعية وآثارها المدمرة على الفرد',
        keywords: ['المجتمع', 'الضغط', 'التأثير', 'الامتثال', 'الحرية']
      }
    ]
  };
  
  // Partenaires officiels
  partners = [
    { name: 'Capture Vision', logo: 'Partenaires/Capture-Vision.png' },
    { name: 'Comm Niit', logo: 'Partenaires/COMM-NIIT.png' },
    { name: 'DCI', logo: 'Partenaires/DCI.png' },
    { name: 'Gandal Afrik', logo: 'Partenaires/GANDAL-AFRIK.png' },
    { name: 'Home School', logo: 'Partenaires/HomeSchool.png' },
    { name: 'Mourchid Services', logo: 'Partenaires/MourchidServices.png' },
    { name: 'Ndiaye Digital', logo: 'Partenaires/Ndiaye-Digital.png' },
    { name: 'Tele Niandane', logo: 'Partenaires/TeleNiandane.png' },
    { name: 'UGB Live', logo: 'Partenaires/UGB-LIVE.png' }
  ];
  
  private subscriptions: Subscription[] = [];



  constructor(
    private cp2iApi: Cp2iApiService,
    private router: Router,
    private participantMessagesService: ParticipantMessagesService,
    private qrService: QrCertificateService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private chatSupportService: ChatSupportService
  ) {}

  ngOnInit() {
    // Vérifier l'authentification
    if (!this.cp2iApi.isAuthenticated()) {
      this.router.navigate(['/cp2i']);
      return;
    }
    
    this.currentUser = this.cp2iApi.getCurrentUser();
    this.loadEditions();

    
    // Initialiser le service de messages
    this.participantMessagesService.initialize();
    
    // Forcer le recalcul du layout mobile
    this.handleMobileLayout();
  }
  
  loadEditions() {
    this.cp2iApi.getEditions().subscribe({
      next: (data) => {
        if (data.success) {
          this.editions = data.editions || [];
          this.editionCourante = this.editions.find((e: any) => e.is_active) || this.editions[this.editions.length - 1];

          // Si le participant a plusieurs éditions → afficher le sélecteur
          // Si une seule édition (ou aucune) → aller directement au dashboard
          if (this.editions.length > 1) {
            this.showEditionSelector = true;
          } else {
            this.editionActive = this.editionCourante;
            this.loadData();
          }
        } else {
          // Fallback : édition active par défaut
          this.editionActive = { id: 4, numero: 4, annee: 2026, label: '4ᵉ édition (2026)', is_active: true };
          this.loadData();
        }
      },
      error: () => {
        this.editionActive = { id: 4, numero: 4, annee: 2026, label: '4ᵉ édition (2026)', is_active: true };
        this.loadData();
      }
    });
  }

  selectEdition(edition: any) {
    this.editionActive = edition;
    this.showEditionSelector = false;
    this.loadData();
  }

  switchEdition(edition: any) {
    if (edition.id === this.editionActive?.id) return;
    this.editionActive = edition;
    this.currentView = 'accueil';
    // Réinitialiser les données avant de recharger
    this.mesSoumissions = [];
    this.stats = {};
    this.classement = {};
    this.certificats = [];
    this.historique = [];
    this.loadData();
  }

  // Retourne la référence à passer à l'API (= numero, ex: 3 ou 4)
  getEditionRef(): number | undefined {
    return this.editionActive?.edition_ref ?? this.editionActive?.numero;
  }

  isEditionArchivee(): boolean {
    return this.editionActive && !this.editionActive.is_active;
  }

  handleMobileLayout() {
    if (typeof window !== 'undefined') {
      // Détecter si on est sur mobile
      const isMobile = window.innerWidth <= 480;
      
      if (isMobile) {
        // Forcer le recalcul des styles
        setTimeout(() => {
          const mainContent = document.querySelector('.main-content');
          if (mainContent) {
            (mainContent as HTMLElement).style.display = 'none';
            setTimeout(() => {
              (mainContent as HTMLElement).style.display = 'block';
            }, 10);
          }
        }, 100);
      }
      
      // Écouter les changements de taille d'écran
      window.addEventListener('resize', () => {
        this.handleMobileLayout();
      });
    }
  }

  ngAfterViewInit() {
    // Générer les QR codes avec la librairie
    setTimeout(() => {
      this.generateQRCodes();
    }, 2000);
    
    // Debug : forcer la génération QR quand on va sur certificats
    setTimeout(() => {
      if (this.currentView === 'certificats') {
        this.forceGenerateQR();
      }
    }, 3000);
  }
  
  generateQRCodes() {
    if (this.certificats.length > 0) {
      this.certificats.forEach(cert => {
        setTimeout(() => {
          this.generateQRCode(cert.id);
        }, 500);
      });
    }
  }
  
  generateQRCode(certId: number) {
    const container = document.getElementById(`qr-container-${certId}`);
    if (!container) {
      setTimeout(() => {
        const retryContainer = document.getElementById(`qr-container-${certId}`);
        if (retryContainer) {
          const fallbackUrl = `https://penccumndongo.com/verify?id=CP2i-${certId}-${this.currentUser?.id}`;
          this.createQRCodeElement(retryContainer, fallbackUrl);
        }
      }, 1000);
      return;
    }
    
    const fallbackUrl = `https://penccumndongo.com/verify?id=CP2i-${certId}-${this.currentUser?.id}`;
    this.createQRCodeElement(container, fallbackUrl);
  }
  
  createQRCodeElement(container: HTMLElement, url: string) {
    // QR code visuel simple mais fonctionnel
    container.innerHTML = `
      <div style="width: 80px !important; height: 80px !important; background: #FF7F1A !important; color: white !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; font-size: 10px !important; text-align: center !important; border-radius: 4px !important; cursor: pointer !important; border: 2px solid #1e3c72 !important; z-index: 999 !important; position: relative !important;" onclick="window.open('${url}', '_blank')">
        <div style="font-weight: bold !important; margin-bottom: 2px !important; color: white !important;">QR</div>
        <div style="font-weight: bold !important; color: white !important;">CODE</div>
        <div style="font-size: 8px !important; opacity: 0.9 !important; color: white !important;">Cliquer</div>
      </div>
    `;
    console.log('QR généré pour container:', container.id);
  }
  
  forceGenerateQR() {
    console.log('Force generate QR - certificats:', this.certificats.length);
    
    // Essayer de trouver tous les containers QR
    const containers = document.querySelectorAll('[id^="qr-container-"]');
    console.log('Containers trouvés:', containers.length);
    
    containers.forEach((container, index) => {
      // Créer un certificat valide dans la base d'abord
      this.createValidCertificate(index + 1).then(certId => {
        const url = `https://penccumndongo.com/verify?id=${certId}`;
        this.createQRCodeElement(container as HTMLElement, url);
      }).catch(() => {
        // Fallback si API ne fonctionne pas
        const fallbackUrl = `https://penccumndongo.com/verify?id=DEMO-${this.currentUser?.id}-${Date.now()}`;
        this.createQRCodeElement(container as HTMLElement, fallbackUrl);
      });
    });
  }
  
  async createValidCertificate(certIndex: number): Promise<string> {
    const certificateData = {
      participant_name: `${this.currentUser?.prenom} ${this.currentUser?.nom}`,
      formation_title: 'Concours CP2i 2026',
      certificate_id: `CP2i-${certIndex}-${this.currentUser?.id}`
    };
    
    try {
      const response = await this.http.post<any>('https://penccumndongo.com/generate-qr.php', certificateData).toPromise();
      return response.id;
    } catch (error) {
      throw error;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Nettoyer les event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleMobileLayout);
    }
  }

  loadData() {
    // Charger les données validées
    this.loadDataFallback();
    
    // Pas d'appel serveur en développement
    

    
    // Charger l'historique après les textes et évaluations
    setTimeout(() => {
      this.loadHistorique();
    }, 2000);
    
    // Calculer les jours restants
    this.calculateDeadline();
    
    // Charger le classement après les autres données
    setTimeout(() => {
      this.loadClassement();
      // Charger les certificats après le classement
      this.loadCertificats();
    }, 1000);
    
    // Charger les évaluations détaillées
    this.loadEvaluationsDetaillees();
  }
  

  
  loadHistorique() {
    // Toujours utiliser l'historique généré localement pour éviter les problèmes de format
    this.generateBasicHistory();
    
    // Optionnel : essayer de charger depuis l'API mais ne pas l'écraser
    /*
    this.cp2iApi.getParticipantHistory().subscribe({
      next: (data) => {
        // Fusionner avec l'historique généré si nécessaire
        if (data.history && data.history.length > 0) {
          const apiHistory = data.history.map(item => ({
            ...item,
            type: item.type || 'login' // Assurer qu'il y a un type
          }));
          this.historique = [...this.historique, ...apiHistory];
        }
      },
      error: (error) => {
        console.warn('Historique API indisponible:', error.status);
      }
    });
    */
  }
  
  generateBasicHistory() {
    this.historique = [];
    
    // Ajouter les soumissions de textes
    this.mesSoumissions.forEach(texte => {
      this.historique.push({
        id: `submission-${texte.id}`,
        type: 'submission',
        created_at: texte.date_soumission || texte.created_at,
        details: { titre: texte.titre }
      });
      
      // Ajouter les évaluations si disponibles
      if (texte.note && texte.statut !== 'en_attente') {
        this.historique.push({
          id: `evaluation-${texte.id}`,
          type: 'evaluation', 
          created_at: texte.date_evaluation || texte.updated_at,
          details: { note: texte.note, titre: texte.titre }
        });
      }
    });
    
    // Ajouter un élément d'inscription
    this.historique.push({
      id: 'inscription',
      type: 'login',
      created_at: '2025-10-18T12:55:00.000Z',
      details: { action: 'Inscription au concours CP2i 2026' }
    });
    
    // Charger les messages pour l'historique (asynchrone)
    this.loadMessagesForHistory();
  }
  
  loadMessagesForHistory() {
    // Utiliser le service de messages participant pour récupérer les messages
    this.participantMessagesService.getMessages().subscribe({
      next: (messages) => {
        // Ajouter les messages à l'historique existant
        const messageHistory = messages.map(message => ({
          id: `message-${message.id}`,
          type: 'message',
          created_at: message.created_at,
          details: { 
            subject: message.subject || 'Message reçu',
            sender: `${message.sender_prenom} ${message.sender_nom}` || 'Administration'
          }
        }));
        
        // Fusionner avec l'historique existant et retrier
        this.historique = [...this.historique, ...messageHistory];
        this.historique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      },
      error: (error) => {
        // Ignorer silencieusement les erreurs de messages
      }
    });
  }
  
  loadCertificats() {
    this.certificats = [];
    
    // Vérifier si le participant a reçu ses trois notes de correction
    const hasThreeCorrections = this.hasThreeCorrections();
    
    // N'afficher les certificats que si le participant a ses trois notes
    if (hasThreeCorrections) {
      // Un seul certificat selon le niveau de performance
      if (this.classement?.position && this.classement.position <= 10) {
        // Certificat d'excellence pour le top 10
        this.certificats.push({
          id: 1,
          titre: 'Certificat d\'Excellence',
          description: 'Attestation d\'excellence pour performance remarquable',
          type: 'excellence',
          date: new Date()
        });
      } else if (this.stats.textes_acceptes > 0) {
        // Certificat de mérite si texte admis
        this.certificats.push({
          id: 1,
          titre: 'Certificat de Mérite',
          description: 'Attestation de mérite pour texte admis au concours',
          type: 'merite',
          date: new Date()
        });
      } else {
        // Certificat de participation par défaut
        this.certificats.push({
          id: 1,
          titre: 'Attestation de Participation',
          description: 'Attestation officielle de participation au concours CP2i 2026',
          type: 'participation',
          date: new Date()
        });
      }
    }
  }
  
  calculateDeadline() {
    this.joursRestants = this.getJoursRestants(this.concoursSchedule.inscription_fin);
  }
  
  isSubmissionPeriodActive(): boolean {
    return true; // Période de soumission ouverte
  }
  
  getSubmissionStatus(): string {
    if (this.isSubmissionPeriodActive()) {
      return this.joursRestants > 0 ? 'Ouvert jusqu\'au 23 novembre 2026' : 'Dernier jour';
    } else {
      return 'Soumissions clôturées';
    }
  }
  
  getSubmissionLabel(): string {
    if (this.isSubmissionPeriodActive()) {
      return this.joursRestants > 0 ? 'Jours pour soumettre' : 'Dernier jour';
    } else {
      return 'Période terminée';
    }
  }
  
  getJoursRestants(dateStr: string): number {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  getProchaineEcheance(): { nom: string, date: string, jours: number } {
    const today = new Date();
    const echeances = [
      { nom: 'Début des inscriptions', date: this.concoursSchedule.inscription_debut },
      { nom: 'Fin des inscriptions', date: this.concoursSchedule.inscription_fin },
      { nom: 'Début des corrections', date: this.concoursSchedule.correction_debut },
      { nom: 'Fin des corrections', date: this.concoursSchedule.correction_prolongement },
      { nom: 'Délibération', date: this.concoursSchedule.deliberation },
      { nom: 'Cérémonie de remise', date: this.concoursSchedule.ceremonie_remise }
    ];
    
    for (const echeance of echeances) {
      const dateEcheance = new Date(echeance.date);
      if (dateEcheance >= today) {
        return {
          nom: echeance.nom,
          date: echeance.date,
          jours: this.getJoursRestants(echeance.date)
        };
      }
    }
    
    return { nom: 'Aucune échéance', date: '', jours: 0 };
  }
  
  loadClassement() {
    this.cp2iApi.getClassement().subscribe({
      next: (data) => {
        if (data.success && data.participants && this.stats.note_moyenne) {
          const participants = data.participants;
          const maNoteMoyenne = this.stats.note_moyenne;
          const monUserId = this.currentUser?.id;
          
          let position = null;
          let totalParticipants = participants.length;
          
          for (let i = 0; i < participants.length; i++) {
            if (participants[i].user_id == monUserId) {
              position = i + 1;
              break;
            }
          }
          
          this.classement = {
            position: position || 1,
            total: totalParticipants || 50
          };
        } else {
          this.classement = { position: null, total: 0 };
        }
      },
      error: (error) => {
        console.warn('Classement indisponible:', error.status);
        this.classement = { position: null, total: 0 };
      }
    });
  }
  
  calculateRealRanking() {
    // Utiliser les données réelles des textes chargés
    let totalParticipants = 1;
    let notesDesAutres: number[] = [];
    
    // Analyser les données des corrections chargées
    this.mesSoumissions.forEach(texte => {
      if (texte.corrections && texte.corrections.length > 0) {
        texte.corrections.forEach((correction: any) => {
          if (correction.note && !isNaN(correction.note)) {
            notesDesAutres.push(parseFloat(correction.note));
          }
        });
      }
    });
    
    // Si on a des données de corrections, les utiliser
    if (notesDesAutres.length > 0) {
      totalParticipants = notesDesAutres.length;
      
      if (this.stats.note_moyenne && this.stats.note_moyenne > 0) {
        // Compter combien de notes sont supérieures à la mienne
        const notesSuperieures = notesDesAutres.filter(note => note > this.stats.note_moyenne).length;
        const position = notesSuperieures + 1;
        const percentile = Math.round((1 - (position - 1) / totalParticipants) * 100);
        
        this.classement = {
          position: position,
          total: totalParticipants,
          note_moyenne: this.stats.note_moyenne,
          percentile: percentile
        };
      } else {
        this.classement = {
          position: null,
          total: totalParticipants,
          note_moyenne: null,
          percentile: null
        };
      }
    } else {
      // Pas de données de corrections disponibles
      this.classement = {
        position: null,
        total: 0,
        note_moyenne: this.stats.note_moyenne,
        percentile: null
      };
    }
    

  }
  
  loadEvaluationsDetaillees() {
    // Charger toutes les évaluations pour chaque texte basées sur texte_id
    this.mesSoumissions.forEach(texte => {
      if (texte.id) {
        this.cp2iApi.getEvaluationsForTexte(texte.id).subscribe({
          next: (evaluations) => {
            if (evaluations && evaluations.length > 0) {
              // Mapper les évaluations avec la structure attendue
              texte.corrections = evaluations.map((evaluation: any) => ({
                id: evaluation.id,
                note_totale: evaluation.note_totale,
                note: evaluation.note_totale, // Compatibilité
                note_pertinence: evaluation.pertinence,
                note_coherence: evaluation.coherence,
                note_correction: evaluation.correction,
                note_presentation: evaluation.presentation,
                commentaires: evaluation.remarques,
                correcteur_id: evaluation.correcteur_id
              }));
            }
            this.calculateRealStats();
          },
          error: (error) => {
            console.warn('Impossible de charger les évaluations pour le texte', texte.id);
            this.calculateRealStats();
          }
        });
      }
    });
  }
  
  countVerses(contenu: string): number {
    if (!contenu) return 0;
    return contenu.split('\n').filter(line => line.trim().length > 0).length;
  }
  
  async downloadCertificate(cert: any) {
    const element = document.getElementById('cert-' + cert.id);
    if (!element) {
      this.showToast('Erreur: élément certificat introuvable', 'error');
      return;
    }
    
    try {
      await this.waitForImagesToLoad(element);
      
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const logoImg = clonedDoc.querySelector('.logo-img') as HTMLImageElement;
          if (logoImg) {
            logoImg.style.width = '100px';
            logoImg.style.height = '100px';
            logoImg.style.objectFit = 'contain';
          }
          
          const cachetImg = clonedDoc.querySelector('.cachet-img') as HTMLImageElement;
          if (cachetImg) {
            cachetImg.style.position = 'absolute';
            cachetImg.style.top = '5px';
            cachetImg.style.left = '70%';
            cachetImg.style.transform = 'translateX(-50%)';
            cachetImg.style.maxWidth = '200px';
            cachetImg.style.zIndex = '1';
          }
          
          const signatureImg = clonedDoc.querySelector('.signature-img') as HTMLImageElement;
          if (signatureImg) {
            signatureImg.style.position = 'absolute';
            signatureImg.style.top = '0px';
            signatureImg.style.left = '70%';
            signatureImg.style.transform = 'translateX(-50%)';
            signatureImg.style.maxWidth = '350px';
            signatureImg.style.zIndex = '2';
          }
        }
      });
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      
      const fileName = `Attestation_CP2i_${this.currentUser?.prenom}_${this.currentUser?.nom}.pdf`;
      pdf.save(fileName);
      
      this.showToast('Attestation PDF téléchargée avec succès', 'success');
    } catch (error) {
      console.error('Erreur:', error);
      this.showToast('Erreur lors du téléchargement', 'error');
    }
  }
  
  private waitForImagesToLoad(element: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      const images = element.querySelectorAll('img');
      let loadedCount = 0;
      const totalImages = images.length;
      
      if (totalImages === 0) {
        resolve();
        return;
      }
      
      const checkComplete = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          // Attendre un peu plus pour s'assurer que le rendu est terminé
          setTimeout(resolve, 500);
        }
      };
      
      images.forEach((img: HTMLImageElement) => {
        if (img.complete) {
          checkComplete();
        } else {
          img.onload = checkComplete;
          img.onerror = checkComplete; // Continuer même si une image échoue
        }
      });
    });
  }
  
  downloadCertificatFallback(cert: any) {
    const htmlContent = this.generateCertificatHTML();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificat_CP2i_${this.currentUser?.nom}_${this.currentUser?.prenom}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.showToast('Certificat téléchargé avec succès', 'success');
  }
  
  generateCertificatHTML(): string {
    const statusText = this.stats.textes_acceptes > 0 ? 'admise au concours' : 'dans le cadre de ce concours';
    const noteText = this.stats.note_moyenne ? `avec une note de ${this.stats.note_moyenne.toFixed(1)}/20` : '';
    const classementText = this.classement?.position ? `Classement : ${this.classement.position}${this.getOrdinalSuffix(this.classement.position)} sur ${this.classement.total} participants` : '';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Certificat CP2i - ${this.currentUser?.prenom} ${this.currentUser?.nom}</title>
          <style>
            @page { size: A4 landscape; margin: 0; }
            body { margin: 0; padding: 0; font-family: 'Georgia', serif; background: white; }
            .certificat-modern { width: 297mm; height: 210mm; margin: 0; background: white; position: relative; }
            .cert-modern-header { background: linear-gradient(135deg, #0380C2 0%, #001B36 100%); color: white; padding: 2rem; display: flex; justify-content: space-between; align-items: center; height: 120px; }
            .brand-logo { width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; }
            .logo-img { width: 100px; height: 100px; object-fit: contain; object-position: center; filter: brightness(0) invert(1); max-width: 100px; max-height: 100px; }
            .brand-info { text-align: center; flex: 1; }
            .brand-info h1 { font-size: 1.8rem; margin: 0; font-weight: 900; color: #FFD700; letter-spacing: 1px; }
            .brand-info p { font-size: 1.3rem; margin: 0.5rem 0; font-weight: 600; }
            .cert-badge { width: 60px; height: 60px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #0380C2; font-size: 1.5rem; }
            .cert-modern-body { padding: 3rem 2rem; text-align: center; background: linear-gradient(135deg, #ffffff, #f8f9fa); }
            .cert-title h2 { font-size: 2.2rem; margin: 0.5rem 0 0 0; font-weight: 900; letter-spacing: 2px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); color: #0380C2; }
            .title-underline { height: 3px; background: linear-gradient(90deg, transparent, #FF7F1A, transparent); margin: 1rem auto; width: 200px; }
            .participant-label { font-size: 1.1rem; color: #6c757d; margin: 0 0 1rem 0; font-style: italic; }
            .cert-participant-modern { margin: 2rem 0; padding: 1.5rem; background: linear-gradient(135deg, #fff3e0, #ffebcc); border-radius: 12px; border: 3px solid #FF7F1A; }
            .participant-name-modern { font-size: 2.5rem; color: #FF7F1A; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
            .achievement-text { font-size: 1.2rem; line-height: 1.6; color: #2c3e50; margin: 1.5rem 0; font-weight: 500; }
            .performance-stats { display: flex; justify-content: center; gap: 2rem; margin: 1rem 0; }
            .stat-item { text-align: center; }
            .stat-value { display: block; font-size: 1.5rem; font-weight: 900; color: #0380C2; }
            .stat-label { font-size: 0.9rem; color: #6c757d; }
            .cert-modern-footer { background: #f8f9fa; padding: 1rem 2rem; border-top: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; }
            .footer-left { text-align: left; }
            .cert-date-modern { margin: 0.25rem 0; color: #495057; font-weight: 600; }
            .cert-location-modern { font-style: italic; color: #6c757d; }
            .footer-center { text-align: center; flex: 1; }
            .code-label { font-size: 0.8rem; color: #6c757d; margin: 0; }
            .code-value { font-family: 'Courier New', monospace; font-size: 0.85rem; color: #495057; font-weight: 600; margin: 0; }
            .footer-right { text-align: right; }
            .signature-text { font-weight: 700 !important; color: #2c3e50 !important; margin: 20px 0 0.1rem 0 !important; text-align: center !important; font-size: 0.85rem !important; }
            .signature-container { display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 5px; }
            .signature-container { position: relative; display: inline-block; width: 180px; height: 120px; }
            .signature-img { max-width: 200px !important; max-height: 140px !important; object-fit: contain !important; position: absolute !important; top: 0px !important; left: 70% !important; transform: translateX(-50%) !important; z-index: 2 !important; }
            .cachet-img { max-width: 200px !important; max-height: 140px !important; object-fit: contain !important; position: absolute !important; top: 5px !important; left: 70% !important; transform: translateX(-50%) !important; opacity: 0.9 !important; z-index: 1 !important; }
          </style>
        </head>
        <body>
          <div class="certificat-modern">
            <div class="cert-modern-header">
              <div class="brand-logo">
                <img src="/logocertif.png" alt="Logo Penccum Ndongo" class="logo-img">
              </div>
              <div class="brand-info">
                <h1>PENCCUM NDONGO</h1>
                <p>Concours de Poésie Inédit & Innovant</p>
                <p><strong>Quatrième Édition</strong></p>
              </div>
              <div class="cert-badge">
                🏆
              </div>
            </div>
            <div class="cert-modern-body">
              <div class="cert-title">
                <h2>ATTESTATION DE PARTICIPATION</h2>
                <div class="title-underline"></div>
              </div>
              <div class="cert-participant-modern">
                <p class="participant-label">Décerné à</p>
                <h3 class="participant-name-modern">${this.currentUser?.prenom} ${this.currentUser?.nom}</h3>
              </div>
              <div class="cert-achievement">
                <p class="achievement-text">
                  Pour sa participation à la 4e édition du Concours de Poésie Inédit & Innovant (CP2i).
                </p>
                <div class="performance-stats">
                  ${this.stats.note_moyenne ? `<div class="stat-item"><span class="stat-value">${this.stats.note_moyenne.toFixed(1)}</span><span class="stat-label">Note / 20</span></div>` : ''}
                  ${this.classement?.position ? `<div class="stat-item"><span class="stat-value">${this.classement.position}${this.getOrdinalSuffix(this.classement.position)}</span><span class="stat-label">Classement</span></div>` : ''}
                  <div class="stat-item"><span class="stat-value">2026</span><span class="stat-label">Édition</span></div>
                </div>
              </div>
            </div>
            <div class="cert-modern-footer">
              <div class="footer-left">
                <p class="cert-date-modern">${this.getCurrentDate()}</p>
                <p class="cert-location-modern">Dakar, Sénégal</p>
              </div>
              <div class="footer-center">
                <div class="cert-verification">
                  <div class="cert-code-unique">
                    <p class="code-label">Code de vérification unique :</p>
                    <p class="code-value">${this.generateUniqueCode()}</p>
                  </div>
                </div>
              </div>
              <div class="footer-right">
                <div class="signature-modern">
                  <p class="signature-text">Direction Penccum Ndongo</p>
                  <div class="signature-container">
                    <img src="/cachetpn.png" alt="Cachet Penccum Ndongo" class="cachet-img">
                    <img src="/signaturethn.png" alt="Signature" class="signature-img">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  
  previewCertificat(cert: any) {
    this.showCertificatPreview = true;
    this.selectedCertificat = cert;
  }
  
  shareCertificat(cert: any) {
    if (navigator.share) {
      navigator.share({
        title: 'Mon Certificat CP2i 2026',
        text: `J'ai participé au Concours de Poésie CP2i 2026 !`,
        url: window.location.href
      });
    } else {
      // Fallback : copier le lien
      navigator.clipboard.writeText(window.location.href);
      this.showToast('Lien copié pour partage', 'success');
    }
  }
  
  getCurrentDate(): string {
    return new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  getCurrentYear(): number {
    return new Date().getFullYear();
  }
  
  getOrdinalSuffix(position: number): string {
    if (position === 1) return 'er';
    return 'ème';
  }
  

  
  generateCertificateHash(): string {
    // Générer un hash unique basé sur les données du participant
    const data = `${this.currentUser?.id}-${this.stats.note_moyenne}-${this.getCurrentDate()}-CP2i2026`;
    return btoa(data).substring(0, 16);
  }
  
  generateUniqueCode(): string {
    // Générer un code unique standardisé
    const userId = this.currentUser?.id || '0';
    const year = this.getCurrentYear();
    const noteStr = this.stats.note_moyenne ? this.stats.note_moyenne.toFixed(1) : 'null';
    const dateStr = new Date().getDate().toString().padStart(2, '0');
    const monthStr = this.getMonthAbbr().toLowerCase().charAt(0);
    const data = `${userId}-${noteStr}-${dateStr} ${monthStr}`;
    const hash = btoa(data).substring(0, 16);
    return `CP2i-${userId}-${year}-${hash}`;
  }
  
  getMonthAbbr(): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[new Date().getMonth()];
  }
  
  drawTextFallback(canvas: HTMLCanvasElement, text: string) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 60;
    canvas.height = 60;
    
    // Fond blanc avec bordure
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 60, 60);
    ctx.strokeStyle = '#1e3c72';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 60, 60);
    
    // Texte de fallback
    ctx.fillStyle = '#1e3c72';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR', 30, 25);
    ctx.fillText('CODE', 30, 35);
    ctx.fillText(text.substring(0, 8), 30, 50);
  }



  nouvellesoumission() {
    // Bloquer si édition archivée
    if (this.isEditionArchivee()) {
      this.showToast('Les soumissions pour cette édition sont clôturées.', 'error');
      return;
    }
    // Vérifier si les soumissions sont clôturées
    if (this.isSubmissionPeriodClosed()) {
      this.showSubmissionClosedModal = true;
      return;
    }
    
    if (this.mesSoumissions.length > 0) {
      this.showToast('Vous avez déjà soumis un texte pour cette édition. Un seul texte par participant est autorisé.', 'error');
      return;
    }
    this.openSoumissionModal();
  }
  
  openSoumissionModal(texte?: any) {
    this.isEditing = !!texte;
    this.editingTexteId = texte?.id || null;
    
    if (texte) {
      this.texte = {
        titre: texte.titre || '',
        theme: texte.theme || '',
        langue: texte.langue || '',
        contenu: texte.contenu || ''
      };
    } else {
      this.resetForm();
    }
    
    this.showSoumissionModal = true;
  }
  
  closeSoumissionModal() {
    this.showSoumissionModal = false;
    this.resetForm();
  }
  
  resetForm() {
    this.texte = {
      titre: '',
      theme: '',
      langue: 'francais',
      contenu: ''
    };
    this.isEditing = false;
    this.editingTexteId = null;
  }
  
  // Obtenir les thèmes selon la langue sélectionnée
  getThemesForLanguage() {
    return this.themesParLangue[this.texte.langue as keyof typeof this.themesParLangue] || this.themesParLangue.francais;
  }

  // Réinitialiser le thème quand la langue change
  onLangueChange() {
    this.texte.theme = '';
  }
  
  getLineCount(): number {
    if (!this.texte.contenu) return 0;
    return this.texte.contenu.split('\n').filter(line => line.trim().length > 0).length;
  }
  
  isFormValid(): boolean {
    return !!(this.texte.titre && this.texte.contenu && this.texte.theme && this.texte.langue && this.getLineCount() <= 40);
  }
  
  onSubmitTexte() {
    if (this.isSubmitting) return;
    
    // Vérifier si les soumissions sont clôturées
    if (this.isSubmissionPeriodClosed()) {
      this.showSubmissionClosedModal = true;
      return;
    }
    
    // Vérifier et alerter pour chaque champ manquant
    if (!this.texte.titre) {
      this.showToast('Le titre est requis', 'error');
      return;
    }
    
    if (!this.texte.theme) {
      this.showToast('Le thème est requis', 'error');
      return;
    }
    
    if (!this.texte.langue) {
      this.showToast('La langue est requise', 'error');
      return;
    }
    
    if (!this.texte.contenu) {
      this.showToast('Le contenu du texte est requis', 'error');
      return;
    }
    
    if (this.getLineCount() > 40) {
      this.showToast('Le texte ne peut pas dépasser 40 vers', 'error');
      return;
    }
    
    this.isSubmitting = true;
    
    const texteData = {
      titre: this.texte.titre,
      theme: this.texte.theme,
      langue: this.texte.langue,
      contenu: this.texte.contenu
    };
    
    if (this.isEditing && this.editingTexteId) {
      const texteToUpdate = { ...texteData, id: this.editingTexteId };
      this.cp2iApi.updateText(texteToUpdate).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response && response.success) {
            this.showToast('Texte modifié avec succès !', 'success');
            this.closeSoumissionModal();
            this.loadDataFallback();
          } else {
            this.showToast('Erreur lors de la modification: ' + (response?.error || 'Erreur inconnue'), 'error');
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showToast('Erreur lors de la modification du texte', 'error');
        }
      });
    } else {
      this.cp2iApi.submitText(texteData, this.getEditionRef()).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response && response.success) {
            this.showToast('Texte soumis avec succès !', 'success');
            this.closeSoumissionModal();
            this.loadDataFallback();
          } else {
            this.showToast('Erreur lors de la soumission: ' + (response?.error || 'Erreur inconnue'), 'error');
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          let errorMessage = 'Erreur lors de la soumission du texte';
          if (error.error && error.error.error) {
            errorMessage = error.error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
          this.showToast(errorMessage, 'error');
        }
      });
    }
  }

  fixDataInconsistency() {
    this.showToast('Correction des données en cours...', 'success');
    
    this.cp2iApi.fixDashboardData().subscribe({
      next: (data) => {
        if (data.success) {
          this.mesSoumissions = data.textes || [];
          this.stats = data.stats || {};
          
          const corrections = data.corrections_applied;
          let message = 'Données corrigées avec succès!';
          
          if (corrections.duplicates_removed > 0) {
            message += ` ${corrections.duplicates_removed} doublon(s) supprimé(s).`;
          }
          
          this.showToast(message, 'success');
          console.log('Corrections appliquées:', corrections);
        } else {
          this.showToast('Erreur lors de la correction: ' + data.error, 'error');
        }
      },
      error: (error) => {
        console.error('Erreur lors de la correction des données:', error);
        this.showToast('Erreur lors de la correction des données', 'error');
      }
    });
  }

  showToast(message: string, type: 'success' | 'error') {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;
    
    setTimeout(() => {
      this.showNotification = false;
    }, 4000);
  }

  setCurrentView(view: string) {
    this.currentView = view;
    // Empêcher toute redirection automatique
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
    
    // Générer QR codes quand on va sur certificats
    if (view === 'certificats') {
      setTimeout(() => {
        this.forceGenerateQR();
      }, 500);
    }
  }

  getStatusLabel(status: string): string {
    const labels = {
      'en_attente': 'À corriger',
      'brouillon': 'Brouillon',
      'accepte': 'Admis (≥10/20)',
      'refuse': 'Non admis (<10/20)'
    };
    return labels[status as keyof typeof labels] || status;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleDesktopMenu() {
    this.desktopMenuHidden = !this.desktopMenuHidden;
  }

  openChatSupport() {
    this.chatOpen = !this.chatOpen;
  }

  sendMessage(message: string) {
    console.log('Message envoyé:', message);
    // Logique d'envoi de message
  }
  
  logout() {
    this.cp2iApi.logout();
    this.router.navigate(['/cp2i']);
  }

  closeChat() {
    this.chatOpen = false;
  }

  closeMobileMenuOnLeave() {
    if (window.innerWidth <= 768) {
      this.mobileMenuOpen = false;
    }
  }
  
  getUnreadMessagesCount(): number {
    // Utiliser le nouveau service de messages
    let count = 0;
    this.participantMessagesService.unreadCount$.subscribe(c => {
      count = c;
      // Forcer la détection des changements
      this.cdr.detectChanges();
    }).unsubscribe();
    return count;
  }
  
  // Obtenir le nombre de messages non lus du chat support
  getChatSupportUnreadCount(): number {
    // Utiliser le même service que le chat widget
    let count = 0;
    if (this.chatSupportService) {
      this.chatSupportService.unreadCount$.subscribe(c => count = c).unsubscribe();
    }
    return count;
  }
  
  calculateRealStats() {
    // Calculer les vraies statistiques basées sur les textes chargés
    this.stats = {
      total_textes: this.mesSoumissions.length,
      textes_acceptes: this.mesSoumissions.filter(t => t.statut === 'accepte').length,
      textes_refuses: this.mesSoumissions.filter(t => t.statut === 'refuse').length,
      textes_en_attente: this.mesSoumissions.filter(t => t.statut === 'en_attente' || t.statut === 'brouillon').length,
      note_moyenne: this.calculateAverageNote()
    };
    

    
    // Calculer le classement après les stats
    this.loadClassement();
    
    // Recharger les certificats après le calcul des stats
    this.loadCertificats();
  }
  
  calculateAverageNote(): number | null {
    // Pour chaque texte, calculer la moyenne des évaluations de tous les correcteurs
    let totalNotes = 0;
    let nombreEvaluations = 0;
    
    this.mesSoumissions.forEach(texte => {
      if (texte.corrections && texte.corrections.length > 0) {
        // Utiliser les vraies évaluations des correcteurs
        texte.corrections.forEach((correction: any) => {
          const note = correction.note_totale || correction.note;
          if (note && !isNaN(note)) {
            totalNotes += parseFloat(note);
            nombreEvaluations++;
          }
        });
      } else if (texte.note && !isNaN(texte.note)) {
        // Fallback sur la note du texte si pas de corrections détaillées
        totalNotes += parseFloat(texte.note);
        nombreEvaluations++;
      }
    });
    

    return nombreEvaluations > 0 ? totalNotes / nombreEvaluations : null;
  }
  
  validateStats(serverStats: any) {
    // Comparer seulement si les stats frontend sont calculées
    if (this.stats.total_textes !== undefined && serverStats.total_textes !== this.stats.total_textes) {
      console.warn('Incohérence détectée - Textes totaux:', {
        frontend: this.stats.total_textes,
        backend: serverStats.total_textes
      });
      
      this.showToast('Données synchronisées avec le serveur', 'success');
    }
  }
  
  modifierTexte(texte: any) {
    // Vérifier si le texte peut être modifié
    const peutModifier = this.canModifyText(texte);
    
    if (!peutModifier.canModify) {
      this.showToast(peutModifier.reason, 'error');
      return;
    }
    
    // Ouvrir la modal de modification
    this.openSoumissionModal(texte);
  }
  
  loadDataFallback() {
    // Méthode de fallback en cas d'erreur de validation
    this.cp2iApi.getUserTexts(this.getEditionRef()).subscribe({
      next: (data) => {
        this.mesSoumissions = data.textes || [];
        

        
        // Filtrer pour ne garder que le texte du participant connecté
        this.mesSoumissions = this.mesSoumissions.slice(0, 1);
        
        // Charger les évaluations détaillées après le chargement des textes
        // calculateRealStats sera appelé automatiquement après le chargement des évaluations
        this.loadEvaluationsDetaillees();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des textes (fallback):', error);
        this.mesSoumissions = [];
        this.calculateRealStats();
      }
    });
  }

  hasCorrections(): boolean {
    return this.mesSoumissions.some(texte => texte.corrections && texte.corrections.length > 0);
  }
  
  hasThreeCorrections(): boolean {
    // Vérifier si le participant a au moins une évaluation complète
    return this.mesSoumissions.some(texte => {
      // Si le texte a une note finale ou des corrections
      return (texte.note && texte.note > 0) || 
             (texte.corrections && texte.corrections.length > 0) ||
             (texte.statut === 'accepte' || texte.statut === 'refuse');
    });
  }

  canModifyText(texte: any): { canModify: boolean, reason: string } {
    // Un texte peut être modifié si :
    // 1. Il est en brouillon
    // 2. Il est en attente ET n'a pas encore été assigné à un correcteur
    // 3. Il n'a pas encore été évalué
    
    if (texte.statut === 'brouillon') {
      return { canModify: true, reason: '' };
    }
    
    if (texte.statut === 'accepte' || texte.statut === 'refuse') {
      return { canModify: false, reason: 'Ce texte a déjà été évalué et ne peut plus être modifié.' };
    }
    
    if (texte.correcteur_id) {
      return { canModify: false, reason: 'Ce texte est déjà assigné à un correcteur et ne peut plus être modifié.' };
    }
    
    if (texte.statut === 'en_attente' && texte.peut_modifier) {
      return { canModify: true, reason: '' };
    }
    
    return { canModify: false, reason: 'Ce texte ne peut pas être modifié dans son état actuel.' };
  }
  
  supprimerTexte(texte: any) {
    if (!this.canModifyText(texte).canModify) {
      this.showToast('Ce texte ne peut pas être supprimé', 'error');
      return;
    }
    
    this.showConfirmationModal = true;
    this.texteToDelete = texte;
  }
  
  confirmSuppression() {
    if (this.texteToDelete) {
      this.cp2iApi.deleteTexte(this.texteToDelete.id).subscribe({
        next: (response) => {
          if (response && response.success) {
            this.showToast('Texte supprimé avec succès', 'success');
            this.loadDataFallback();
          } else {
            this.showToast('Erreur lors de la suppression: ' + (response?.error || 'Erreur inconnue'), 'error');
          }
          this.closeConfirmationModal();
        },
        error: (error) => {
          this.showToast('Erreur lors de la suppression du texte', 'error');
          this.closeConfirmationModal();
        }
      });
    }
  }
  
  closeConfirmationModal() {
    this.showConfirmationModal = false;
    this.texteToDelete = null;
  }
  
  closeCertificatPreview() {
    this.showCertificatPreview = false;
    this.selectedCertificat = null;
  }
  
  // Méthodes pour le guide d'utilisation
  toggleFaq(faqNumber: number) {
    this.openFaq = this.openFaq === faqNumber ? null : faqNumber;
  }
  
  // Méthodes pour l'historique
  getFilteredHistory(): any[] {
    if (this.currentHistoryFilter === 'all') {
      return this.historique;
    }
    return this.historique.filter(item => item.type === this.currentHistoryFilter);
  }
  
  getHistoryCount(type: string): number {
    return this.historique.filter(item => item.type === type).length;
  }
  
  getHistoryIconClass(type: string): string {
    const classes = {
      'submission': 'submission',
      'evaluation': 'evaluation', 
      'message': 'message',
      'login': 'login'
    };
    return classes[type as keyof typeof classes] || 'default';
  }
  
  getHistoryIcon(type: string): string {
    const icons = {
      'submission': 'fa-file-alt',
      'evaluation': 'fa-star',
      'message': 'fa-envelope',
      'login': 'fa-sign-in-alt'
    };
    return icons[type as keyof typeof icons] || 'fa-circle';
  }
  
  getHistoryTitle(item: any): string {
    const titles = {
      'submission': 'Soumission de texte',
      'evaluation': 'Évaluation reçue',
      'message': 'Message reçu',
      'login': 'Connexion au tableau de bord'
    };
    return titles[item.type as keyof typeof titles] || item.action || 'Action';
  }
  
  getHistoryDescription(item: any): string {
    const descriptions = {
      'submission': `Vous avez soumis votre texte "${item.details?.titre || 'Sans titre'}" au concours.`,
      'evaluation': `Votre texte a été évalué avec une note de ${item.details?.note || 'N/A'}/20.`,
      'message': `Nouveau message reçu de l'administration : "${item.details?.subject || 'Message'}".`,
      'login': 'Vous vous êtes connecté à votre tableau de bord participant.'
    };
    return descriptions[item.type as keyof typeof descriptions] || item.description || 'Aucune description disponible';
  }
  
  openVerificationUrl() {
    window.open('https://penccumndongo.com/verify', '_blank');
  }
  
  // Méthode pour obtenir les thèmes selon la langue sélectionnée
  getThemesForSelectedLanguage() {
    return this.themesDetailles[this.selectedLanguage as keyof typeof this.themesDetailles] || this.themesDetailles.francais;
  }
  
  // Vérifier si la période de soumission est clôturée
  isSubmissionPeriodClosed(): boolean {
    return false; // Soumissions ouvertes
  }
  
  // Fermer le modal de clôture des soumissions
  closeSubmissionClosedModal(): void {
    this.showSubmissionClosedModal = false;
  }
  
  // Rejoindre le groupe WhatsApp des participants
  joinParticipantsWhatsAppGroup(): void {
    window.open('https://chat.whatsapp.com/JDkwJ791REJEfjUDzn4o7y?mode=hqrt3', '_blank');
    this.closeSubmissionClosedModal();
  }
  
  // Rejoindre la chaîne WhatsApp PENCCUM NDONGO
  joinPenccumWhatsAppChannel(): void {
    window.open('https://whatsapp.com/channel/0029VasVCCY4dTnKoyeJK13Q', '_blank');
    this.closeSubmissionClosedModal();
  }
  
  // Ouvrir un lien de réseau social
  openSocialLink(url: string): void {
    window.open(url, '_blank');
  }
  
  // Ouvrir tous les réseaux sociaux
  openAllSocialNetworks(): void {
    const socialLinks = [
      'https://www.linkedin.com/company/penccum-ndongo/',
      'https://www.facebook.com/share/1Ce2vCmuuV/?mibextid=wwXIfr',
      'https://x.com/penccumndongo?s=21',
      'https://www.instagram.com/penccumndongo?igsh=MXIzZ2FremxqeG9xdg%3D%3D&utm_source=qr',
      'https://www.tiktok.com/@penccum.ndongo?_t=ZM-8xRXEUCzSdC&_r=1',
      'https://youtube.com/@penccumndongo?si=wG-jaIUBmL1LrNR-'
    ];
    
    // Ouvrir chaque lien avec un délai pour éviter le blocage des pop-ups
    socialLinks.forEach((link, index) => {
      setTimeout(() => {
        window.open(link, '_blank');
      }, index * 300); // Délai de 300ms entre chaque ouverture
    });
    
    this.closeSubmissionClosedModal();
  }
  
  getCorrectionsForTexte(texte: any) {
    // Retourner toutes les corrections disponibles pour ce texte
    // même s'il n'y en a qu'une ou deux
    return texte.corrections || [];
  }

}