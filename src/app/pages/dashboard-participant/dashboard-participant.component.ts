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

  historique: any[] = [];
  certificats: any[] = [];
  classement: any = {};
  joursRestants = 0;
  evaluationsDetaillees: any[] = [];
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

  // Thèmes traduits par langue
  themesParLangue = {
    francais: [
      { code: 'patriotisme', nom: 'Patriotisme' },
      { code: 'justice_dignite', nom: 'Justice et dignité' },
      { code: 'beaute_africaine', nom: 'Beauté Africaine' },
      { code: 'jeunesse_responsable', nom: 'Jeunesse responsable' },
      { code: 'emprise_ecrans', nom: 'Sous l\'emprise des écrans' }
    ],
    wolof: [
      { code: 'patriotisme', nom: 'Bëgg sa réew' },
      { code: 'justice_dignite', nom: 'Yoon ak ngor' },
      { code: 'beaute_africaine', nom: 'Taaru jigeenu afrik' },
      { code: 'jeunesse_responsable', nom: 'Xale yu am responsabilite' },
      { code: 'emprise_ecrans', nom: 'Ci ndigalu ekraŋ yi' }
    ],
    anglais: [
      { code: 'patriotisme', nom: 'Patriotism' },
      { code: 'justice_dignite', nom: 'Justice and dignity' },
      { code: 'beaute_africaine', nom: 'African Beauty' },
      { code: 'jeunesse_responsable', nom: 'Responsible Youth' },
      { code: 'emprise_ecrans', nom: 'Under the grip of screens' }
    ],
    arabe: [
      { code: 'patriotisme', nom: 'الوطنية' },
      { code: 'justice_dignite', nom: 'العدالة والكرامة' },
      { code: 'beaute_africaine', nom: 'الجمال الأفريقي' },
      { code: 'jeunesse_responsable', nom: 'الشباب المسؤول' },
      { code: 'emprise_ecrans', nom: 'تحت سيطرة الشاشات' }
    ]
  };
  isSubmitting = false;
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';
  
  // Modal de confirmation suppression
  showConfirmationModal = false;
  texteToDelete: any = null;
  
  // Modal d'aperçu certificat
  showCertificatPreview = false;
  selectedCertificat: any = null;
  
  // Dates officielles du concours CP2i 2025
  concoursSchedule = {
    inscription_debut: '2025-11-03',
    inscription_fin: '2025-11-23',
    correction_debut: '2025-11-24',
    correction_fin: '2025-11-30',
    correction_prolongement: '2025-12-03',
    deliberation: '2025-12-10',
    ceremonie_remise: '2026-01-10'
  };
  
  // Section thèmes
  selectedLanguage = 'francais';
  
  // Thèmes détaillés par langue
  themesDetailles = {
    francais: [
      {
        title: '1. Patriotisme',
        icon: 'fas fa-flag',
        description: 'Explorez l\'amour de la patrie, l\'attachement à son pays et la fierté nationale.',
        keywords: ['Patrie', 'Nation', 'Fierté', 'Identité', 'Héritage']
      },
      {
        title: '2. Justice et dignité',
        icon: 'fas fa-balance-scale',
        description: 'Questionnez l\'équité, les droits humains et la quête de justice sociale.',
        keywords: ['Équité', 'Droits', 'Justice', 'Respect', 'Humanité']
      },
      {
        title: '3. Beauté Africaine',
        icon: 'fas fa-crown',
        description: 'Célébrez la richesse culturelle, la diversité et l\'esthétique africaine.',
        keywords: ['Culture', 'Tradition', 'Diversité', 'Art', 'Héritage']
      },
      {
        title: '4. Jeunesse responsable',
        icon: 'fas fa-users',
        description: 'Réfléchissez sur le rôle et les responsabilités de la nouvelle génération.',
        keywords: ['Avenir', 'Engagement', 'Leadership', 'Changement', 'Espoir']
      },
      {
        title: '5. Sous l\'emprise des écrans',
        icon: 'fas fa-mobile-alt',
        description: 'Analysez l\'impact du numérique sur nos vies et nos relations humaines.',
        keywords: ['Technologie', 'Dépendance', 'Connexion', 'Virtuel', 'Réalité']
      }
    ],
    wolof: [
      {
        title: '1. Bëgg sa réew',
        icon: 'fas fa-flag',
        description: 'Xam-xam ci bëgg réew, jokko ak sa taaw ak ngor ci sa réew.',
        keywords: ['Réew', 'Taaw', 'Ngor', 'Jikko', 'Aada']
      },
      {
        title: '2. Yoon ak ngor',
        icon: 'fas fa-balance-scale',
        description: 'Laaj ci yoon, sag ak ngor nët kë nët.',
        keywords: ['Yoon', 'Sag', 'Ngor', 'Jub', 'Nët kë nët']
      },
      {
        title: '3. Taaru jigeenu afrik',
        icon: 'fas fa-crown',
        description: 'Benn ci rafet ak aada yu Afrik.',
        keywords: ['Aada', 'Taaw', 'Rafet', 'Jigeenu', 'Afrik']
      },
      {
        title: '4. Xale yu am responsabilite',
        icon: 'fas fa-users',
        description: 'Xam-xam ci jokko xale yi ak seen responsabilite.',
        keywords: ['Xale', 'Jokko', 'Responsabilite', 'Avenir', 'Liggey']
      },
      {
        title: '5. Ci ndigalu ekraŋ yi',
        icon: 'fas fa-mobile-alt',
        description: 'Xam-xam ci jafe ekraŋ yi ci seen dundu.',
        keywords: ['Ekraŋ', 'Teknoloji', 'Jokko', 'Dundu', 'Yaram']
      }
    ],
    anglais: [
      {
        title: '1. Patriotism',
        icon: 'fas fa-flag',
        description: 'Explore love for one\'s country, national pride and cultural identity.',
        keywords: ['Country', 'Nation', 'Pride', 'Identity', 'Heritage']
      },
      {
        title: '2. Justice and dignity',
        icon: 'fas fa-balance-scale',
        description: 'Question equity, human rights and the quest for social justice.',
        keywords: ['Equity', 'Rights', 'Justice', 'Respect', 'Humanity']
      },
      {
        title: '3. African Beauty',
        icon: 'fas fa-crown',
        description: 'Celebrate cultural richness, diversity and African aesthetics.',
        keywords: ['Culture', 'Tradition', 'Diversity', 'Art', 'Heritage']
      },
      {
        title: '4. Responsible Youth',
        icon: 'fas fa-users',
        description: 'Reflect on the role and responsibilities of the new generation.',
        keywords: ['Future', 'Engagement', 'Leadership', 'Change', 'Hope']
      },
      {
        title: '5. Under the grip of screens',
        icon: 'fas fa-mobile-alt',
        description: 'Analyze the impact of digital technology on our lives and relationships.',
        keywords: ['Technology', 'Addiction', 'Connection', 'Virtual', 'Reality']
      }
    ],
    arabe: [
      {
        title: '1. الوطنية',
        icon: 'fas fa-flag',
        description: 'استكشف حب الوطن والفخر الوطني والهوية الثقافية',
        keywords: ['الوطن', 'الأمة', 'الفخر', 'الهوية', 'التراث']
      },
      {
        title: '2. العدالة والكرامة',
        icon: 'fas fa-balance-scale',
        description: 'استجوب العدالة وحقوق الإنسان والبحث عن العدالة الاجتماعية',
        keywords: ['العدالة', 'الحقوق', 'العدل', 'الاحترام', 'الإنسانية']
      },
      {
        title: '3. الجمال الأفريقي',
        icon: 'fas fa-crown',
        description: 'احتفل بالثراء الثقافي والتنوع والجماليات الأفريقية',
        keywords: ['الثقافة', 'التقليد', 'التنوع', 'الفن', 'التراث']
      },
      {
        title: '4. الشباب المسؤول',
        icon: 'fas fa-users',
        description: 'تأمل في دور ومسؤوليات الجيل الجديد',
        keywords: ['المستقبل', 'الالتزام', 'القيادة', 'التغيير', 'الأمل']
      },
      {
        title: '5. تحت سيطرة الشاشات',
        icon: 'fas fa-mobile-alt',
        description: 'حلل تأثير التكنولوجيا الرقمية على حياتنا وعلاقاتنا',
        keywords: ['التكنولوجيا', 'الإدمان', 'الاتصال', 'الافتراضي', 'الواقع']
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
    this.loadData();

    
    // Initialiser le service de messages
    this.participantMessagesService.initialize();
    
    // Forcer le recalcul du layout mobile
    this.handleMobileLayout();
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
      formation_title: 'Concours CP2i 2025',
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
      details: { action: 'Inscription au concours CP2i 2025' }
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
          titre: 'Certificat de Participation',
          description: 'Attestation officielle de participation au concours CP2i 2025',
          type: 'participation',
          date: new Date()
        });
      }
    }
  }
  
  calculateDeadline() {
    // Pour les participants, toujours afficher les jours restants pour soumettre (jusqu'au 23 novembre)
    this.joursRestants = this.getJoursRestants(this.concoursSchedule.inscription_fin);
  }
  
  isSubmissionPeriodActive(): boolean {
    const today = new Date();
    const submissionDeadline = new Date(this.concoursSchedule.inscription_fin);
    return today <= submissionDeadline;
  }
  
  getSubmissionStatus(): string {
    if (this.isSubmissionPeriodActive()) {
      return this.joursRestants > 0 ? 'Jusqu\'au 23 novembre' : 'Dernier jour';
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
    
    let evaluationsChargees = 0;
    const totalTextes = this.mesSoumissions.filter(t => t.id && t.note).length;
    
    if (totalTextes === 0) {
      this.calculateRealStats();
      return;
    }
    
    // Charger les vraies évaluations depuis l'API
    this.mesSoumissions.forEach(texte => {
      if (texte.id && texte.note) {
        this.cp2iApi.getTextCorrections(texte.id).subscribe({
          next: (data) => {
            if (data && data.success && data.corrections && data.corrections.length > 0) {
              texte.corrections = data.corrections;
            }
            
            evaluationsChargees++;
            if (evaluationsChargees === totalTextes) {
              // Recalculer les stats après avoir chargé toutes les évaluations
              this.calculateRealStats();
            }
          },
          error: (error) => {
            evaluationsChargees++;
            if (evaluationsChargees === totalTextes) {
              this.calculateRealStats();
            }
          }
        });
      }
    });
  }
  
  countVerses(contenu: string): number {
    if (!contenu) return 0;
    return contenu.split('\n').filter(line => line.trim().length > 0).length;
  }
  

  
  async downloadCertificatPDF(cert: any) {
    const element = document.getElementById('cert-' + cert.id);
    if (!element) {
      this.downloadCertificatFallback(cert);
      return;
    }
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(element, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Certificat_CP2i_${this.currentUser?.nom}_${this.currentUser?.prenom}.pdf`);
      
      this.showToast('Certificat PDF téléchargé avec succès', 'success');
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      this.downloadCertificatFallback(cert);
    }
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
            .certificat-digital { width: 297mm; height: 210mm; margin: 0; background: white; position: relative; }
            .cert-header { background: linear-gradient(135deg, #0380C2 0%, #001B36 100%); color: white; padding: 2rem; display: flex; justify-content: space-between; align-items: center; height: 120px; }
            .cert-organization { font-size: 1.8rem; margin: 0; font-weight: 900; color: #FFD700; letter-spacing: 1px; }
            .cert-main-title { font-size: 2.2rem; margin: 0.5rem 0 0 0; font-weight: 900; letter-spacing: 2px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); color: #0380C2; }
            .cert-subtitle { font-size: 1.3rem; margin: 0.5rem 0; font-weight: 600; }
            .cert-edition { font-size: 1rem; margin: 0; opacity: 0.9; }
            .cert-body { padding: 3rem 2rem; text-align: center; background: linear-gradient(135deg, #ffffff, #f8f9fa); }
            .cert-decoration-line { height: 3px; background: linear-gradient(90deg, transparent, #FF7F1A, transparent); margin: 1rem auto; width: 200px; }
            .cert-intro { font-size: 1.1rem; color: #6c757d; margin: 0 0 1rem 0; font-style: italic; }
            .cert-participant { margin: 2rem 0; padding: 1.5rem; background: linear-gradient(135deg, #fff3e0, #ffebcc); border-radius: 12px; border: 3px solid #FF7F1A; }
            .participant-name { font-size: 2.5rem; color: #FF7F1A; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
            .cert-text { font-size: 1.2rem; line-height: 1.6; color: #2c3e50; margin: 1.5rem 0; font-weight: 500; }
            .cert-performance { margin: 1rem 0; padding: 1rem; background: #e8f5e8; border-radius: 8px; border-left: 4px solid #28a745; }
            .cert-ranking { margin: 0; font-size: 1.1rem; color: #2c3e50; font-weight: 700; }
            .cert-footer { background: #f8f9fa; padding: 1rem 2rem; border-top: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; }
            .cert-date { text-align: left; }
            .cert-date p { margin: 0.25rem 0; color: #495057; font-weight: 600; }
            .cert-location { font-style: italic; color: #6c757d; }
            .cert-signature { text-align: right; }
            .signature-name { font-weight: 700; color: #2c3e50; margin: 0; }
            .signature-title { color: #6c757d; margin: 0; font-size: 0.9rem; font-style: italic; }
            .cert-verification { text-align: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #dee2e6; }
            .verification-code { font-family: 'Courier New', monospace; font-size: 0.9rem; color: #495057; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="certificat-digital">
            <div class="cert-header">
              <div style="width: 100px; height: 100px; display: flex; align-items: center; justify-content: center;"><div style="width: 100px; height: 100px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; color: #0380C2; filter: brightness(0) invert(1);">PN</div></div>
              <div style="text-align: center; flex: 1;">
                <div class="cert-organization">PENCCUM NDONGO</div>
                <h2 class="cert-subtitle">Concours de Poésie Inédit & Innovant</h2>
                <h3 class="cert-edition">Troisième Édition</h3>
              </div>
              <div style="width: 60px; height: 60px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #0380C2; font-size: 1.5rem;">🏆</div>
            </div>
            <div class="cert-body">
              <div class="cert-decoration-line"></div>
              <p class="cert-intro">Décerné à</p>
              <div class="cert-participant">
                <div class="participant-name">${this.currentUser?.prenom} ${this.currentUser?.nom}</div>
              </div>
              <p class="cert-text">
                Pour sa participation à la 3e édition du Concours de Poésie Inédit & Innovant (CP2i).
              </p>
              ${classementText ? `<div class="cert-performance"><p class="cert-ranking">${classementText}</p></div>` : ''}
              <div class="cert-decoration-line"></div>
            </div>
            <div class="cert-footer">
              <div class="cert-date">
                <p>Délivré le ${this.getCurrentDate()}</p>
                <p class="cert-location">Dakar, Sénégal</p>
              </div>
              <div style="text-align: center; flex: 1;">
                <p style="font-family: 'Courier New', monospace; font-size: 0.85rem; color: #495057; font-weight: 600; margin: 0;">Code : CP2i-${this.currentUser?.id}-${this.getCurrentYear()}</p>
              </div>
              <div class="cert-signature">
                <p class="signature-name">Direction Penccum Ndongo</p>
                <p class="signature-title">Organisateur CP2i</p>
              </div>
            </div>
            <div class="cert-verification">
              <p class="verification-code">Code de vérification : CP2i-${this.currentUser?.id}-${this.getCurrentYear()}</p>
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
        title: 'Mon Certificat CP2i 2025',
        text: `J'ai participé au Concours de Poésie CP2i 2025 !`,
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
    const data = `${this.currentUser?.id}-${this.stats.note_moyenne}-${this.getCurrentDate()}-CP2i2025`;
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
      this.cp2iApi.submitText(texteData).subscribe({
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
          if (correction.note && !isNaN(correction.note)) {
            totalNotes += parseFloat(correction.note);
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
    this.cp2iApi.getUserTexts().subscribe({
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
    // Pour le moment, retourner false pour tous les participants
    // jusqu'à ce qu'ils aient effectivement 3 corrections complètes
    return false;
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




}