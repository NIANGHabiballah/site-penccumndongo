import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Cp2iApiService, User } from '../../services/cp2i-api.service';
import { ChatSupportService } from '../../services/chat-support.service';
import { AdminChatComponent } from '../admin-chat/admin-chat.component';
import { AuthenticityAdminComponent } from '../../components/authenticity-admin/authenticity-admin.component';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AdminChatComponent, AuthenticityAdminComponent],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit, OnDestroy {
  mobileMenuOpen = false;
  desktopMenuHidden = false;
  currentView = 'dashboard';
  currentUser: User | null = null;
  
  // Multi-éditions
  editions: any[] = [];
  editionActive: any = null;
  editionCourante: any = null;
  showEditionSelector = false;

  stats: any = {};
  users: any[] = [];
  filteredUsers: any[] = [];
  participants: any[] = [];
  correcteurs: any[] = [];
  affectations: any[] = [];
  textes: any[] = [];
  allTextesAllEditions: any[] = [];
  allAccounts: any[] = [];
  history: any[] = [];
  
  selectedTexte: number = 0;
  selectedCorrector: number = 0;
  selectedTexteForEvaluation: any = null;
  assignmentView: any = 'by-text';
  assignmentSearchTerm = '';
  assignmentLangueFilter = '';
  assignmentStatutFilter = '';
  showAssignmentsList = false;
  assignmentStatusFilter: 'all' | 'unassigned' | 'partial' | 'full' = 'all';
  quickAssignCorrector: {[key: number]: number} = {};
  bulkAssignSelected: {[texteId: number]: number[]} = {};


  assignmentStats = {
    totalTexts: 0,
    fullyAssigned: 0,
    unassigned: 0,
    averagePerCorrector: 0
  };
  
  // Gestion de l'affichage des détails
  showFormSection = true;
  textDetailsVisible: boolean[] = [];
  correctorDetailsVisible: boolean[] = [];
  languageDetailsVisible: {[key: string]: boolean} = {};
  languageAssignmentFilter = 'all'; // 'all', 'assigned', 'unassigned'
  
  // Recherche de textes
  textSearchTerm = '';
  languageFilter = '';
  filteredTexts: any[] = [];
  
  // Filtres et recherche
  currentFilter = 'all';
  searchTerm = '';
  editionFilter: number | 'all' = 'all'; // filtre par édition dans la section utilisateurs

  // ─── SOURCE DE VÉRITÉ UNIQUE ───────────────────────────────────────────────
  // Pour ajouter une édition : ajouter une entrée ici, tout le reste s'adapte.
  private schedulesParEdition: Record<number, any> = {
    3: {
      inscription_debut: '2025-11-03',
      inscription_fin: '2025-11-23',
      correction_debut: '2025-11-24',
      correction_fin: '2025-11-30',
      correction_prolongement: '2025-11-30',
      deliberation: '2025-12-01',
      ceremonie_remise: '2026-01-10'
    },
    4: {
      inscription_debut: '2026-11-02',
      inscription_fin: '2026-11-25',
      correction_debut: '2026-11-26',
      correction_fin: '2026-12-05',
      correction_prolongement: '2026-12-10',
      deliberation: '2026-12-15',
      ceremonie_remise: '2026-12-26'
    }
  };

  concoursSchedule = { ...this.schedulesParEdition[4] };
  settings: any = null;
  // ────────────────────────────────────────────────────────────────────────────

  getParticipantsByEdition(num: number) {
    const s = this.schedulesParEdition[num];
    if (!s) return [];
    return this.users.filter(u => {
      if (u.role !== 'participant' || !u.created_at) return false;
      const d = new Date(u.created_at);
      return d >= new Date(s.inscription_debut) && d <= new Date(s.inscription_fin + 'T23:59:59');
    });
  }

  get participantsEdition4() { return this.getParticipantsByEdition(4); }
  get participantsEdition3() { return this.getParticipantsByEdition(3); }

  getEditionsStats() {
    const ordinals: Record<number, string> = { 1: '1ᵉʳᵉ', 2: '2ᵉ', 3: '3ᵉ', 4: '4ᵉ', 5: '5ᵉ', 6: '6ᵉ' };
    return Object.entries(this.schedulesParEdition)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([num, s]) => ({
        label: `${ordinals[Number(num)] ?? num + 'ᵉ'} édition ${new Date(s.inscription_debut).getFullYear()}`,
        debut: new Date(s.inscription_debut).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        fin:   new Date(s.inscription_fin).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        count: this.getParticipantsByEdition(Number(num)).length
      }));
  }

  get participantsHorsEdition() {
    return this.users.filter(u => {
      if (u.role !== 'participant' || !u.created_at) return false;
      return !Object.values(this.schedulesParEdition).some((s: any) => {
        const d = new Date(u.created_at);
        return d >= new Date(s.inscription_debut) && d <= new Date(s.inscription_fin + 'T23:59:59');
      });
    });
  }

  // Participants de l'édition active (pour les KPIs du tableau de bord)
  get participantsEditionActive() {
    const num = this.editionActive?.numero ?? 4;
    if (num === 4) return this.participantsEdition4;
    if (num === 3) return this.participantsEdition3;
    return this.participants;
  }
  
  // Filtres pour la section Notes des Participants
  currentNotesFilter = 'all';
  notesSearchTerm = '';
  
  // Cache pour les valeurs calculées (éviter les recalculs pendant change detection)
  private _cachedGlobalAverageNote: number | null = null;
  private _cachedBestNote: number | null = null;
  private _cachedTotalEvaluations: number | null = null;
  private _lastCalculationTime = 0;
  
  // Filtres pour la section comptes
  currentAccountFilter = 'all';
  accountSearchTerm = '';
  filteredAccounts: any[] = [];
  
  // Compteurs pour les filtres (section comptes)
  get participantsCount() { return this.allAccounts.filter(a => a.role === 'participant').length; }
  get correcteursCount() { return this.allAccounts.filter(a => a.role === 'correcteur').length; }
  get adminsCount() { return this.allAccounts.filter(a => a.role === 'admin').length; }
  
  // Compteurs pour les filtres (section utilisateurs)
  get usersAdminsCount() { return this.users.filter(u => u.role === 'admin').length; }
  
  // Getters pour les statistiques d'évaluation
  get textesEnAttente() { return this.textes.filter(t => t.statut === 'en_attente').length; }
  get textesTermines() { return this.textes.filter(t => t.statut === 'accepte' || t.statut === 'refuse').length; }
  get textesEnAttenteList() { return this.textes.filter(t => t.statut === 'en_attente'); }
  
  // Filtrage des évaluations
  currentEvaluationFilter = 'all';
  evaluationSearchTerm = '';
  filteredTextes: any[] = [];
  
  // Filtrage des statistiques
  currentStatsFilter = 'all';
  statsSearchTerm = '';
  showAffectationsDetails = true;
  
  // Filtrage de l'historique
  currentHistoryFilter = 'all';
  
  // Modal d'évaluation
  showEvaluationModal = false;
  evaluationForm = {
    note: 0,
    commentaire: '',
    statut: 'en_attente'
  };
  
  // Modal de visualisation de texte
  showTextViewModal = false;
  selectedTextForView: any = null;
  showHistoryModal = false;
  selectedTextForHistory: any = null;
  textHistory: any[] = [];
  showReassignModal = false;
  selectedTextForReassign: any = null;
  reassignForm = {
    correcteur_id: 0
  };
  
  // Modal de modification de texte
  showEditTextModal = false;
  selectedTextForEdit: any = null;
  editTextForm = {
    titre: '',
    contenu: ''
  };
  
  // Gestion des messages
  messages: any[] = [];
  recipients: any[] = [];
  filteredRecipients: any[] = [];
  recipientFilter = 'all';
  currentMessageFilter = 'all';
  showMessageModal = false;
  messageForm = {
    subject: '',
    content: '',
    sendToAll: true
  };
  selectedImages: {file: File, preview: string, name: string}[] = [];
  
  // Gestion des paramètres
  currentSettingsTab = 'concours';

  private getDefaultSettings(editionNumero: number): any {
    const schedule = this.schedulesParEdition[editionNumero] ?? this.schedulesParEdition[4];
    return {
      start_date: schedule.inscription_debut,
      end_date: schedule.inscription_fin,
      evaluation_deadline: schedule.correction_prolongement,
      results_date: schedule.deliberation,
      max_verses: 50,
      max_texts_per_user: 3,
      min_text_length: 100,
      max_text_length: 5000,
      min_score: 0,
      max_score: 20,
      passing_score: 10,
      correctors_per_text: 1,
      maintenance_mode: false,
      allow_registration: true,
      allow_submissions: true,
      admin_email: 'admin@cp2i.com',
      languages: { francais: true, wolof: true, arabe: false, anglais: false },
      notifications: { new_registration: true, new_submission: true, evaluation_completed: true },
      password: { min_length: 8, validity_days: 90, require_uppercase: false, require_numbers: false, require_special: false }
    };
  }

  private loadSettingsForEdition(editionNumero: number): void {
    const key = `cp2i_settings_edition_${editionNumero}`;
    const stored = localStorage.getItem(key);
    this.settings = stored ? JSON.parse(stored) : this.getDefaultSettings(editionNumero);
  }

  private saveSettingsForEdition(editionNumero: number): void {
    const key = `cp2i_settings_edition_${editionNumero}`;
    localStorage.setItem(key, JSON.stringify(this.settings));
  }
  
  // Modals
  showUserModal = false;
  showDeleteModal = false;
  showUserDetailsModal = false;
  showDeleteMessageModal = false;
  selectedUser: any = null;
  selectedMessage: any = null;
  unreadChatMessages = 0;
  chatCheckInterval: any;
  userForm: any = {
    prenom: '',
    nom: '',
    email: '',
    role: 'participant',
    telephone: '',
    whatsapp: '',
    ville: '',
    password: ''
  };
  
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';
  
  private subscriptions: Subscription[] = [];

  // Système de sélection des finalistes
  finalistesSelection = {
    totalFinalistes: 5,
    selectionActive: false,
    finalistes: [] as any[],
    repartitionLangues: {} as any
  };
  showFinalistesModal = false;

  constructor(
    private cp2iApi: Cp2iApiService,
    private router: Router,
    private http: HttpClient,
    private chatService: ChatSupportService,
    private cdr: ChangeDetectorRef
  ) {}
  
  private getHeaders() {
    const token = localStorage.getItem('cp2i_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  ngOnInit() {
    if (!this.cp2iApi.isAuthenticated()) {
      this.router.navigate(['/cp2i']);
      return;
    }
    this.settings = this.getDefaultSettings(4);
    this.currentUser = this.cp2iApi.getCurrentUser();
    if (this.currentUser?.role !== 'admin') {
      this.router.navigate(['/cp2i']);
      return;
    }
    
    // Initialiser les tableaux filtrés
    this.filteredUsers = [];
    this.filteredAccounts = [];
    
    this.loadEditions();
    this.initializeVisibilityArrays();
  }
  
  initializeVisibilityArrays() {
    this.textDetailsVisible = new Array(this.textes.length).fill(false);
    this.correctorDetailsVisible = new Array(this.correcteurs.length).fill(true);
  }
  
  updateCorrectorsVisibilityArray() {
    this.correctorDetailsVisible = new Array(this.correcteurs.length).fill(false);
    console.log('Correcteurs visibility array initialized:', this.correctorDetailsVisible.length, 'correcteurs');
  }
  
  toggleFormSection() {
    this.showFormSection = !this.showFormSection;
  }
  
  toggleTextDetails(index: number) {
    const arr = this.textDetailsVisible.length === this.textes.length
      ? [...this.textDetailsVisible]
      : new Array(this.textes.length).fill(false);
    arr[index] = !arr[index];
    this.textDetailsVisible = arr;
    this.cdr.detectChanges();
  }
  
  toggleCorrectorDetails(index: number) {
    const arr = this.correctorDetailsVisible.length === this.correcteurs.length
      ? [...this.correctorDetailsVisible]
      : new Array(this.correcteurs.length).fill(false);
    arr[index] = !arr[index];
    this.correctorDetailsVisible = arr;
    this.cdr.detectChanges();
  }
  
  toggleLanguageDetails(langue: string) {
    this.languageDetailsVisible[langue] = !this.languageDetailsVisible[langue];
  }
  
  getFilteredTextsByLanguage(langue: string): any[] {
    const textes = this.getTextsByLanguage(langue);
    if (this.languageAssignmentFilter === 'assigned') {
      return textes.filter(texte => this.getCorrectorsCount(texte.id) === 3);
    } else if (this.languageAssignmentFilter === 'unassigned') {
      return textes.filter(texte => this.getCorrectorsCount(texte.id) < 3);
    }
    return textes;
  }
  
  getTextsPartiallyAssigned(): number {
    return this.textes.filter(t => {
      const c = this.getCorrectorsCount(t.id);
      return c > 0 && c < 3;
    }).length;
  }

  filterTexts() {
    let filtered = [...this.textes];
    if (this.languageFilter) {
      filtered = filtered.filter(t =>
        t.langue?.toLowerCase() === this.languageFilter.toLowerCase() ||
        (this.languageFilter === 'francais' && t.langue?.toLowerCase() === 'français')
      );
    }
    if (this.textSearchTerm.trim()) {
      const s = this.textSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(t =>
        t.titre?.toLowerCase().includes(s) ||
        t.prenom?.toLowerCase().includes(s) ||
        t.nom?.toLowerCase().includes(s) ||
        `${t.prenom} ${t.nom}`.toLowerCase().includes(s) ||
        t.langue?.toLowerCase().includes(s)
      );
    }
    if (this.assignmentStatusFilter === 'unassigned') {
      filtered = filtered.filter(t => this.getCorrectorsCount(t.id) === 0);
    } else if (this.assignmentStatusFilter === 'partial') {
      filtered = filtered.filter(t => { const c = this.getCorrectorsCount(t.id); return c > 0 && c < 3; });
    } else if (this.assignmentStatusFilter === 'full') {
      filtered = filtered.filter(t => this.getCorrectorsCount(t.id) === 3);
    }
    this.filteredTexts = filtered;
  }
  
  getFilteredTexts() {
    if (!this.textSearchTerm.trim() && !this.languageFilter) {
      return this.textes;
    }
    return this.filteredTexts;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.chatCheckInterval) {
      clearInterval(this.chatCheckInterval);
    }
  }

  loadEditions() {
    this.cp2iApi.getEditions().subscribe({
      next: (data) => {
        if (data.success) {
          this.editions = data.editions || [];
          this.editionCourante = this.editions.find((e: any) => e.is_active) || this.editions[this.editions.length - 1];
          if (this.editions.length > 1) {
            this.showEditionSelector = true;
          } else {
            this.editionActive = this.editionCourante;
            this.applyEditionSchedule(this.editionActive);
            this.loadSettingsForEdition(this.editionActive.numero);
            this.loadData();
          }
        } else {
          this.editionActive = { id: 4, numero: 4, annee: 2026, label: '4ᵉ édition (2026)', is_active: true };
          this.applyEditionSchedule(this.editionActive);
          this.loadSettingsForEdition(4);
          this.loadData();
        }
      },
      error: () => {
        this.editionActive = { id: 4, numero: 4, annee: 2026, label: '4ᵉ édition (2026)', is_active: true };
        this.applyEditionSchedule(this.editionActive);
        this.loadSettingsForEdition(4);
        this.loadData();
      }
    });
  }

  private applyEditionSchedule(edition: any): void {
    const hardcoded = this.schedulesParEdition[edition.numero] ?? this.schedulesParEdition[4];
    const fromApi = {
      inscription_debut:       edition.inscription_debut,
      inscription_fin:         edition.inscription_fin,
      correction_debut:        edition.correction_debut,
      correction_fin:          edition.correction_fin,
      correction_prolongement: edition.correction_prolongement,
      deliberation:            edition.deliberation,
      ceremonie_remise:        edition.ceremonie_remise
    };
    // Prioriser le hardcode (source de vérité), fallback sur l'API si colonne absente
    this.concoursSchedule = {
      inscription_debut:       hardcoded.inscription_debut       || fromApi.inscription_debut,
      inscription_fin:         hardcoded.inscription_fin         || fromApi.inscription_fin,
      correction_debut:        hardcoded.correction_debut        || fromApi.correction_debut,
      correction_fin:          hardcoded.correction_fin          || fromApi.correction_fin,
      correction_prolongement: hardcoded.correction_prolongement || fromApi.correction_prolongement,
      deliberation:            hardcoded.deliberation            || fromApi.deliberation,
      ceremonie_remise:        hardcoded.ceremonie_remise        || fromApi.ceremonie_remise
    };
    this.schedulesParEdition[edition.numero] = { ...this.concoursSchedule };
  }

  selectEdition(edition: any) {
    this.editionActive = edition;
    this.applyEditionSchedule(edition);
    this.loadSettingsForEdition(edition.numero);
    this.showEditionSelector = false;
    this.loadData();
  }

  switchEdition(edition: any) {
    if (edition.id === this.editionActive?.id) return;
    this.editionActive = edition;
    this.applyEditionSchedule(edition);
    this.loadSettingsForEdition(edition.numero);
    this.textes = [];
    this.users = [];
    this.affectations = [];
    this.stats = {};
    this.loadData();
  }

  isEditionArchivee(): boolean {
    return this.editionActive && !this.editionActive.is_active;
  }

  getEditionRef(): number | undefined {
    return this.editionActive?.edition_ref ?? this.editionActive?.numero;
  }

  loadData() {
    const edNum = this.editionActive?.numero ?? null;
    // Charger le profil admin
    this.cp2iApi.getProfile().subscribe({
      next: (data) => {
        if (data.profile) {
          this.currentUser = {
            id: data.profile.id,
            email: data.profile.email,
            nom: data.profile.nom,
            prenom: data.profile.prenom,
            role: data.profile.role
          };
        }
      },
      error: (error) => console.error('Erreur profil:', error)
    });
    
    // Charger les statistiques du dashboard (incluant les stats par langue)
    const statsUrl = `${this.cp2iApi['baseUrl']}/cp2i-dashboard.php?action=stats${edNum ? '&edition_id=' + edNum : ''}`;
    this.http.get(statsUrl, { headers: this.getHeaders() }).subscribe({
      next: (data: any) => {
        console.log('Stats reçues du dashboard:', data);
        if (data.stats) {
          this.stats = { ...this.stats, ...data.stats };
        }
        if (data.stats_langues) {
          this.stats.stats_langues = data.stats_langues;
        }
        // Ne pas écraser les stats d'affectation du backend — calculées localement par édition dans generateAffectationStats()
      },
      error: (error) => console.error('Erreur stats dashboard:', error)
    });
    
    this.calculateStatsFromTexts();
    
    // Charger tous les utilisateurs (toutes éditions) pour les KPIs globaux
    this.cp2iApi.getUsers().subscribe({
      next: (data) => {
        this.users = data?.users || [];
        this.filteredUsers = [...this.users];
        this.participants = this.users.filter(u => u.role === 'participant');
        this.correcteurs = this.users.filter(u => u.role === 'correcteur');
        this.initializeVisibilityArrays();
        this.updateCorrectorsVisibilityArray();
      },
      error: (error) => {
        console.error('Erreur utilisateurs:', error);
        this.users = [];
        this.filteredUsers = [];
        this.participants = [];
        this.correcteurs = [];
      }
    });

    // Charger les affectations filtrées par édition active
    this.cp2iApi.getUsers(edNum).subscribe({
      next: (data) => {
        this.affectations = data?.affectations || [];
        // Attendre que textes soit aussi chargé avant de générer les stats
        if (this.textes.length > 0) this.generateAffectationStats();
      },
      error: () => { this.affectations = []; }
    });
    
    // Charger tous les textes toutes éditions (pour stats multi-éditions)
    this.cp2iApi.getAllTexts().subscribe({
      next: (data) => { this.allTextesAllEditions = data.textes || []; },
      error: () => { this.allTextesAllEditions = []; }
    });

    // Charger tous les textes avec évaluations
    this.cp2iApi.getAllTexts(edNum).subscribe({
      next: (data) => {
        this.textes = data.textes || [];
        // Le champ theme est maintenant supporté par l'API
        this.filteredTextes = [...this.textes];
        this.filteredTexts = [...this.textes];
        this.applyEvaluationFilters();
        
        // Charger les évaluations détaillées pour chaque texte après un délai
        setTimeout(() => {
          this.loadDetailedEvaluations();
        }, 1000);
        
        this.calculateStatsFromTexts();
        // Générer les stats d'affectation immédiatement
        this.generateAffectationStats();
        setTimeout(() => {
          this.calculateStatsFromTexts();
          this.generateAffectationStats();
          this.cdr.detectChanges();
        }, 500);
        
        this.calculateStatsFromTexts();
        // Générer les stats d'affectation immédiatement
        this.generateAffectationStats();
        setTimeout(() => {
          this.calculateStatsFromTexts();
          this.generateAffectationStats();
          this.cdr.detectChanges();
        }, 500);
      },
      error: (error) => console.error('Erreur textes:', error)
    });
    
    // Charger tous les comptes avec mots de passe
    this.cp2iApi.getAllAccounts().subscribe({
      next: (data) => {
        this.allAccounts = data.accounts || [];
        this.filteredAccounts = [...this.allAccounts];

      },
      error: (error) => console.error('Erreur comptes:', error)
    });
    
    // Charger l'historique
    this.cp2iApi.getHistory(edNum).subscribe({
      next: (data) => {
        this.history = data.history || [];
      },
      error: (error) => {
        console.error('Erreur historique:', error);
        this.history = [];
      }
    });
    
    // Charger les messages
    this.loadMessages();
    this.loadRecipients();
    
    // Charger les statistiques d'affectation depuis l'API dédiée
    this.cp2iApi.getDashboardStats(edNum).subscribe({
      next: (data: any) => {
        console.log('Stats admin reçues:', data);
        if (data.stats) {
          this.stats = { ...this.stats, ...data.stats };
        }
      },
      error: (error) => {
        console.error('Erreur stats admin:', error);
        // Fallback: générer les stats depuis les données locales
        this.generateAffectationStats();
      }
    });
    
    this.loadAffectationStats();
    
    // Démarrer la vérification des messages de chat
    this.startChatNotificationCheck();
    
    // Charger le classement
    this.loadClassement();
    
    // Charger les notes détaillées pour tous les participants
    setTimeout(() => {
      this.loadDetailedNotesForAllParticipants();
    }, 1500);
  }
  
  startChatNotificationCheck() {
    this.checkUnreadChatMessages();
    this.chatCheckInterval = setInterval(() => {
      this.checkUnreadChatMessages();
    }, 30000); // Vérifier toutes les 30 secondes
  }
  
  checkUnreadChatMessages() {
    if (!this.currentUser?.id) return;
    const edNum = this.editionActive?.numero ?? undefined;
    this.chatService.getConversations(edNum).subscribe({
      next: (conversations) => {
        const unreadConversations = conversations.filter(conv => 
          conv.unread_count > 0
        );
        const newCount = unreadConversations.length;
        if (newCount > this.unreadChatMessages && this.unreadChatMessages > 0 && this.currentView !== 'chat-support') {
          this.showToast(`${newCount - this.unreadChatMessages} nouveau(x) message(s) de support`, 'success');
        }
        this.unreadChatMessages = newCount;
      },
      error: () => {
        this.unreadChatMessages = 0;
      }
    });
  }

  assignCorrector() {
    if (!this.selectedTexte || !this.selectedCorrector) {
      this.showToast('Veuillez sélectionner un texte et un correcteur', 'error');
      return;
    }
    
    this.cp2iApi.assignCorrector(this.selectedTexte, this.selectedCorrector).subscribe({
      next: (response) => {
        this.showToast('Correcteur affecté avec succès!', 'success');
        this.logAdminAction('affectation', `Affectation correcteur ID ${this.selectedCorrector} au texte ID ${this.selectedTexte}`);
        this.selectedTexte = 0;
        this.selectedCorrector = 0;
        this.loadData();
      },
      error: (error) => {
        this.showToast('Erreur lors de l\'affectation: ' + (error.error?.error || 'Erreur inconnue'), 'error');
      }
    });
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

  getCorrectorsCount(texteId: number): number {
    return this.affectations.filter(a => Number(a.texte_id) === Number(texteId)).length;
  }

  getAssignedCorrectorsNames(texteId: number): string {
    // Chercher directement dans les affectations par texte_id
    const affectationsTexte = this.affectations.filter(a => a.texte_id === texteId);
    
    if (affectationsTexte.length === 0) return 'Aucun';
    
    // Récupérer les noms des correcteurs uniques
    const correcteursNoms = [...new Set(affectationsTexte.map(a => {
      const correcteur = this.correcteurs.find(c => c.id === a.corrector_id);
      return correcteur ? `${correcteur.prenom} ${correcteur.nom}` : null;
    }).filter(nom => nom !== null))];
    
    return correcteursNoms.length > 0 ? correcteursNoms.join(', ') : 'Aucun';
  }

  logout() {
    this.cp2iApi.logout();
    this.router.navigate(['/cp2i']);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Mot de passe copié !', 'success');
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
    if (view === 'chat-support') {
      this.unreadChatMessages = 0;
    }
  }

  filterUsers(filter: string) {
    this.currentFilter = filter;
    this.applyFilters();
  }

  filterUsersByEdition(edition: number | 'all') {
    this.editionFilter = edition;
    this.applyFilters();
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.users];

    // Filtrer par édition (participants uniquement)
    if (this.editionFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (user.role !== 'participant') return false;
        if (!user.created_at) return false;
        const d = new Date(user.created_at);
        const s = this.schedulesParEdition[this.editionFilter as number];
        if (!s) return false;
        return d >= new Date(s.inscription_debut) && d <= new Date(s.inscription_fin + 'T23:59:59');
      });
    }

    // Filtrer par rôle
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(user => user.role === this.currentFilter);
    }

    // Filtrer par recherche
    if (this.searchTerm) {
      filtered = filtered.filter(user =>
        user.prenom.toLowerCase().includes(this.searchTerm) ||
        user.nom.toLowerCase().includes(this.searchTerm) ||
        user.email.toLowerCase().includes(this.searchTerm)
      );
    }

    this.filteredUsers = filtered;
  }

  // Actions CRUD
  openUserModal(user?: any) {
    this.selectedUser = user;
    if (user) {
      // Chercher les données complètes dans allAccounts si disponible
      const fullUserData = this.allAccounts.find(u => u.id === user.id) || user;
      
      this.userForm = {
        prenom: user.prenom,
        nom: user.nom,
        email: user.email,
        role: user.role,
        telephone: fullUserData.telephone || user.telephone || '',
        whatsapp: fullUserData.whatsapp || user.whatsapp || '',
        ville: fullUserData.ville || user.ville || '',
        password: '' // Vide pour modification
      };
    } else {
      const generatedPassword = this.generatePassword();
      this.userForm = {
        prenom: '',
        nom: '',
        email: '',
        role: 'participant',
        telephone: '',
        whatsapp: '',
        ville: '',
        password: generatedPassword
      };
    }
    this.showUserModal = true;
  }

  closeUserModal() {
    this.showUserModal = false;
    this.selectedUser = null;
  }

  saveUser() {
    if (!this.validateForm()) {
      return;
    }
    
    if (this.selectedUser) {
      // Modifier utilisateur
      this.updateUser();
    } else {
      // Créer utilisateur
      this.createUser();
    }
  }

  validateForm(): boolean {
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    
    if (!this.userForm.prenom.trim()) {
      this.showToast('Le prénom est requis', 'error');
      return false;
    }
    
    if (!this.userForm.nom.trim()) {
      this.showToast('Le nom est requis', 'error');
      return false;
    }
    
    if (!this.userForm.email.trim()) {
      this.showToast('L\'email est requis', 'error');
      return false;
    }
    
    if (!emailRegex.test(this.userForm.email)) {
      this.showToast('Veuillez entrer un email valide', 'error');
      return false;
    }
    
    if (!this.userForm.telephone.trim()) {
      this.showToast('Le téléphone est requis', 'error');
      return false;
    }
    
    const phoneClean = this.userForm.telephone.replace(/[\s\-()]/g, '');
    if (phoneClean.length < 8 || phoneClean.length > 15 || !/^\+?[0-9]+$/.test(phoneClean)) {
      this.showToast('Veuillez entrer un numéro de téléphone valide', 'error');
      return false;
    }
    
    if (this.userForm.whatsapp && this.userForm.whatsapp.trim()) {
      const whatsappClean = this.userForm.whatsapp.replace(/[\s\-()]/g, '');
      if (whatsappClean.length < 8 || whatsappClean.length > 15 || !/^\+?[0-9]+$/.test(whatsappClean)) {
        this.showToast('Veuillez entrer un numéro WhatsApp valide', 'error');
        return false;
      }
    }
    
    if (!this.selectedUser && !this.userForm.password.trim()) {
      this.showToast('Le mot de passe est requis pour un nouvel utilisateur', 'error');
      return false;
    }
    
    return true;
  }

  createUser() {
    this.cp2iApi.register({
      ...this.userForm,
      password: this.userForm.password
    }).subscribe({
      next: (response) => {
        this.logAdminAction('creation_utilisateur', `Création utilisateur: ${this.userForm.prenom} ${this.userForm.nom} (${this.userForm.role})`);
        this.loadData(); // Recharger toutes les données
        this.closeUserModal();
        this.showToast(`Utilisateur créé avec succès. Mot de passe: ${this.userForm.password}`, 'success');
      },
      error: (error) => {
        this.showToast('Erreur lors de la création: ' + (error.error?.error || 'Erreur inconnue'), 'error');
      }
    });
  }

  updateUser() {
    console.log('Updating user:', this.selectedUser.id, this.userForm);
    this.cp2iApi.updateUser(this.selectedUser.id, this.userForm).subscribe({
      next: (response) => {
        console.log('Update response:', response);
        this.logAdminAction('modification_utilisateur', `Modification utilisateur: ${this.userForm.prenom} ${this.userForm.nom}`);
        this.loadData();
        this.closeUserModal();
        this.showToast('Utilisateur modifié avec succès', 'success');
      },
      error: (error) => {
        console.error('Update error:', error);
        this.showToast('Erreur lors de la modification: ' + (error.error?.error || 'Erreur inconnue'), 'error');
      }
    });
  }

  confirmDelete(user: any) {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  deleteUser() {
    this.cp2iApi.deleteUser(this.selectedUser.id).subscribe({
      next: (response) => {
        this.logAdminAction('suppression_utilisateur', `Suppression utilisateur: ${this.selectedUser.prenom} ${this.selectedUser.nom}`);
        this.loadData();
        this.showDeleteModal = false;
        this.showToast('Utilisateur supprimé avec succès', 'success');
      },
      error: (error) => {
        this.showToast('Erreur lors de la suppression: ' + (error.error?.error || 'Erreur inconnue'), 'error');
        this.showDeleteModal = false;
      }
    });
  }

  viewUser(user: any) {
    this.selectedUser = user;
    this.showUserDetailsModal = true;
  }

  closeUserDetailsModal() {
    this.showUserDetailsModal = false;
    this.selectedUser = null;
  }

  exportUsers() {
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'utilisateurs_cp2i.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    this.showToast('Export réalisé avec succès', 'success');
  }

  generateCSV(): string {
    const headers = ['Prénom', 'Nom', 'Téléphone', 'Email', 'WhatsApp', 'Ville'];
    const rows = this.filteredUsers.map(user => [
      user.prenom,
      user.nom,
      user.telephone || '',
      user.email,
      user.whatsapp || '',
      user.ville || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  toggleUserStatus(user: any) {
    user.active = !user.active;
    this.showToast(`Utilisateur ${user.active ? 'activé' : 'désactivé'}`, 'success');
  }

  resetUserPassword(user: any) {
    // Simulation de reset mot de passe
    const newPassword = this.generatePassword();
    console.log('Nouveau mot de passe pour', user.email, ':', newPassword);
    this.showToast('Nouveau mot de passe envoyé par email', 'success');
  }

  generatePassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Filtrage pour la section comptes
  filterAccounts(filter: string) {
    this.currentAccountFilter = filter;
    this.applyAccountFilters();
  }

  onAccountSearch(event: any) {
    this.accountSearchTerm = event.target.value.toLowerCase();
    this.applyAccountFilters();
  }

  applyAccountFilters() {
    let filtered = [...this.allAccounts];
    
    // Filtrer par rôle
    if (this.currentAccountFilter !== 'all') {
      filtered = filtered.filter(account => account.role === this.currentAccountFilter);
    }
    
    // Filtrer par recherche
    if (this.accountSearchTerm) {
      filtered = filtered.filter(account => 
        account.prenom.toLowerCase().includes(this.accountSearchTerm) ||
        account.nom.toLowerCase().includes(this.accountSearchTerm) ||
        account.email.toLowerCase().includes(this.accountSearchTerm)
      );
    }
    
    this.filteredAccounts = filtered;
  }

  exportAccounts() {
    const csvContent = this.generateAccountsCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tous_les_comptes_cp2i.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    this.showToast('Export des comptes réalisé avec succès', 'success');
  }

  generateAccountsCSV(): string {
    const headers = ['Prénom', 'Nom', 'Téléphone', 'Email', 'WhatsApp', 'Ville'];
    const rows = this.filteredAccounts.map(account => [
      account.prenom,
      account.nom,
      account.telephone || '',
      account.email,
      account.whatsapp || '',
      account.ville || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  sendCredentials(account: any) {
    if (account.mot_de_passe_clair) {
      // Simulation d'envoi d'email
      this.showToast(`Identifiants envoyés à ${account.email}`, 'success');
    } else {
      this.showToast('Mot de passe non disponible pour cet utilisateur', 'error');
    }
  }

  regeneratePassword(account: any) {
    const newPassword = this.generatePassword();
    account.mot_de_passe_clair = newPassword;
    // Ici on devrait appeler l'API pour mettre à jour le mot de passe
    this.showToast(`Nouveau mot de passe généré: ${newPassword}`, 'success');
  }

  showPasswordPopup(password: string) {
    this.showToast(`Mot de passe: ${password}`, 'success');
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleDesktopMenu() {
    this.desktopMenuHidden = !this.desktopMenuHidden;
  }

  closeMobileMenuOnLeave() {
    if (window.innerWidth <= 768) {
      this.mobileMenuOpen = false;
    }
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedUser = null;
  }
  
  // Méthodes pour les évaluations
  filterEvaluations(filter: string) {
    this.currentEvaluationFilter = filter;
    this.applyEvaluationFilters();
  }
  
  onEvaluationSearch(event: any) {
    this.evaluationSearchTerm = event.target.value;
    this.applyEvaluationFilters();
  }
  
  // Méthodes pour le filtrage des statistiques
  filterStats(filter: string) {
    this.currentStatsFilter = filter;
  }
  
  onStatsSearch(event: any) {
    this.statsSearchTerm = event.target.value.toLowerCase();
  }
  
  isStatsVisible(category: string): boolean {
    // Si recherche active, vérifier si la catégorie correspond
    if (this.statsSearchTerm) {
      const searchTerms = {
        'affectations': ['affectation', 'correcteur', 'assigné', 'texte'],
        'graphiques': ['graphique', 'chart', 'langue', 'soumission', 'nationalité', 'ville', 'région'],
        'qualite': ['qualité', 'note', 'distribution', 'thème', 'cohérence'],
        'geographie': ['géographie', 'ville', 'région', 'pays', 'nationalité'],
        'performance': ['performance', 'délai', 'engagement', 'prédiction', 'top'],
        'general': ['général', 'kpi', 'compact']
      };
      
      const categoryTerms = searchTerms[category as keyof typeof searchTerms] || [];
      const matchesSearch = categoryTerms.some(term => term.includes(this.statsSearchTerm));
      
      if (!matchesSearch) return false;
    }
    
    // Filtrage par catégorie
    if (this.currentStatsFilter === 'all') return true;
    return this.currentStatsFilter === category;
  }
  
  toggleAffectationsDetails() {
    this.showAffectationsDetails = !this.showAffectationsDetails;
  }
  
  applyEvaluationFilters() {
    let filtered = [...this.textes];
    
    // Filtrer par statut
    switch (this.currentEvaluationFilter) {
      case 'en_attente':
        filtered = filtered.filter(t => t.statut === 'en_attente');
        break;
      case 'termines':
        filtered = filtered.filter(t => t.statut === 'accepte' || t.statut === 'refuse');
        break;
      default:
        // 'all' - pas de filtre
        break;
    }
    
    // Filtrer par recherche
    if (this.evaluationSearchTerm && this.evaluationSearchTerm.trim()) {
      const searchTerm = this.evaluationSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(texte => 
        texte.titre?.toLowerCase().includes(searchTerm) ||
        texte.prenom?.toLowerCase().includes(searchTerm) ||
        texte.nom?.toLowerCase().includes(searchTerm) ||
        texte.langue?.toLowerCase().includes(searchTerm) ||
        `${texte.prenom} ${texte.nom}`.toLowerCase().includes(searchTerm)
      );
    }
    
    this.filteredTextes = filtered;
  }
  
  viewTexte(texte: any) {
    this.selectedTextForView = texte;
    this.showTextViewModal = true;
  }
  
  closeTextViewModal() {
    this.showTextViewModal = false;
    this.selectedTextForView = null;
  }
  
  openEvaluationModal(texte: any) {
    this.selectedTexteForEvaluation = texte;
    this.evaluationForm = {
      note: texte.note || 0,
      commentaire: texte.commentaire || '',
      statut: texte.statut
    };
    this.showEvaluationModal = true;
  }
  
  closeEvaluationModal() {
    this.showEvaluationModal = false;
    this.selectedTexteForEvaluation = null;
  }
  
  saveEvaluation() {
    if (!this.selectedTexteForEvaluation) return;
    
    const evaluationData = {
      texte_id: this.selectedTexteForEvaluation.id,
      note: this.evaluationForm.note,
      commentaire: this.evaluationForm.commentaire,
      statut: this.evaluationForm.statut
    };
    
    this.cp2iApi.saveEvaluation(evaluationData).subscribe({
      next: (response) => {
        this.showToast('Évaluation sauvegardée avec succès', 'success');
        this.closeEvaluationModal();
        this.loadData();
      },
      error: (error) => {
        this.showToast('Erreur lors de la sauvegarde: ' + (error.error?.error || 'Erreur inconnue'), 'error');
      }
    });
  }
  
  viewHistory(texte: any) {
    this.selectedTextForHistory = texte;
    this.textHistory = [
      {
        action: 'Soumission',
        date: texte.created_at,
        utilisateur: `${texte.prenom} ${texte.nom}`,
        details: 'Texte soumis pour évaluation'
      },
      {
        action: 'Affectation',
        date: texte.created_at,
        utilisateur: 'Système',
        details: 'Texte assigné aux correcteurs'
      }
    ];
    this.showHistoryModal = true;
  }

  closeHistoryModal() {
    this.showHistoryModal = false;
    this.selectedTextForHistory = null;
    this.textHistory = [];
  }
  
  reassignTexte(texte: any) {
    this.selectedTextForReassign = texte;
    this.reassignForm.correcteur_id = 0;
    this.showReassignModal = true;
  }

  closeReassignModal() {
    this.showReassignModal = false;
    this.selectedTextForReassign = null;
    this.reassignForm.correcteur_id = 0;
  }

  saveReassignment() {
    if (!this.reassignForm.correcteur_id) {
      this.showToast('Veuillez sélectionner un correcteur', 'error');
      return;
    }

    this.cp2iApi.assignCorrector(this.selectedTextForReassign.id, this.reassignForm.correcteur_id).subscribe({
      next: (response) => {
        this.showToast('Texte réassigné avec succès', 'success');
        this.closeReassignModal();
        this.loadData();
      },
      error: (error) => {
        this.showToast('Erreur lors de la réassignation', 'error');
      }
    });
  }
  
  // Méthodes pour la modification des textes
  openEditTextModal(texte: any) {
    this.selectedTextForEdit = texte;
    this.editTextForm = {
      titre: texte.titre || '',
      contenu: texte.contenu || ''
    };
    this.showEditTextModal = true;
  }

  closeEditTextModal() {
    this.showEditTextModal = false;
    this.selectedTextForEdit = null;
    this.editTextForm = {
      titre: '',
      contenu: ''
    };
  }

  saveTextEdit() {
    if (!this.selectedTextForEdit || !this.editTextForm.titre || !this.editTextForm.contenu) {
      this.showToast('Veuillez remplir tous les champs', 'error');
      return;
    }

    const textData = {
      id: this.selectedTextForEdit.id,
      titre: this.editTextForm.titre,
      contenu: this.editTextForm.contenu,
      langue: this.selectedTextForEdit.langue,
      theme: this.selectedTextForEdit.theme
    };

    this.cp2iApi.updateText(textData).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.showToast('Texte modifié avec succès (anonymisé)', 'success');
          this.logAdminAction('modification_texte', `Modification du texte "${this.editTextForm.titre}" pour anonymisation`);
          this.closeEditTextModal();
          this.loadData();
        } else {
          this.showToast('Erreur lors de la modification: ' + (response?.error || 'Erreur inconnue'), 'error');
        }
      },
      error: (error) => {
        this.showToast('Erreur lors de la modification du texte', 'error');
      }
    });
  }
  
  generateEvaluationReport() {
    const reportData = {
      total: this.textes.length,
      en_attente: this.textesEnAttente,
      termines: this.textesTermines,
      note_moyenne: this.stats.note_moyenne
    };
    
    const csvContent = this.generateEvaluationCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rapport_evaluations_cp2i.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    this.showToast('Rapport d\'évaluation généré', 'success');
  }
  
  generateEvaluationCSV(): string {
    const headers = ['Titre', 'Auteur', 'Langue', 'Statut', 'Note', 'Commentaire', 'Correcteurs', 'Date soumission'];
    const rows = this.textes.map(texte => [
      texte.titre,
      `${texte.prenom} ${texte.nom}`,
      texte.langue,
      this.getStatusLabel(texte.statut),
      texte.note || '',
      texte.commentaire || '',
      this.getAssignedCorrectorsNames(texte.id),
      new Date(texte.created_at).toLocaleDateString()
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  sendReminders() {
    this.cp2iApi.sendEvaluationReminders().subscribe({
      next: (response) => {
        this.showToast(response.message, response.success ? 'success' : 'error');
      },
      error: (error) => {
        this.showToast('Erreur lors de l\'envoi des rappels', 'error');
      }
    });
  }
  
  quickEvaluate(texte: any) {
    this.openEvaluationModal(texte);
  }
  
  // Méthodes de gestion des messages
  loadMessages() {
    const edNum = this.editionActive?.numero ?? null;
    this.cp2iApi.getMessages(edNum).subscribe({
      next: (data) => {
        this.messages = data.messages || [];
      },
      error: (error) => {
        console.error('Erreur messages:', error);
        this.messages = [];
      }
    });
  }
  
  loadRecipients() {
    this.cp2iApi.getRecipients().subscribe({
      next: (data) => {
        this.recipients = data.recipients.map((r: any) => ({ ...r, selected: false })) || [];
        this.filteredRecipients = [...this.recipients];
      },
      error: (error) => {
        console.error('Erreur destinataires:', error);
        this.recipients = [];
      }
    });
  }
  
  openMessageModal() {
    this.messageForm = {
      subject: '',
      content: '',
      sendToAll: true
    };
    this.recipients.forEach(r => r.selected = false);
    this.showMessageModal = true;
  }
  
  closeMessageModal() {
    this.showMessageModal = false;
    this.selectedImages = [];
  }
  
  filterRecipients(filter: string) {
    this.recipientFilter = filter;
    if (filter === 'all') {
      this.filteredRecipients = [...this.recipients];
    } else {
      this.filteredRecipients = this.recipients.filter(r => r.role === filter);
    }
  }
  
  getSelectedRecipientsCount(): number {
    return this.recipients.filter(r => r.selected).length;
  }
  
  canSendMessage(): boolean {
    const hasSubject = this.messageForm.subject.trim().length > 0;
    const hasContent = this.messageForm.content.trim().length > 0;
    const hasRecipients = this.messageForm.sendToAll || this.getSelectedRecipientsCount() > 0;
    
    return hasSubject && hasContent && hasRecipients;
  }
  
  sendMessage() {
    if (!this.canSendMessage()) return;
    
    if (this.selectedImages.length > 0) {
      // Envoyer avec images
      const formData = new FormData();
      formData.append('subject', this.messageForm.subject);
      formData.append('content', this.messageForm.content);
      formData.append('send_to_all', this.messageForm.sendToAll.toString());
      
      if (!this.messageForm.sendToAll) {
        const selectedRecipients = this.recipients.filter(r => r.selected).map(r => r.id);
        formData.append('recipients', JSON.stringify(selectedRecipients));
      }
      
      this.selectedImages.forEach((image, index) => {
        formData.append(`image_${index}`, image.file);
      });
      
      const token = localStorage.getItem('cp2i_token');
      const headers = { 'Authorization': token ? `Bearer ${token}` : '' };
      
      this.http.post(`${this.cp2iApi['baseUrl']}/cp2i-messages.php?action=send_with_images`, formData, {
        headers
      }).subscribe({
        next: (response: any) => {
          console.log('Réponse envoi message avec images:', response);
          const recipients = this.messageForm.sendToAll ? 'tous les utilisateurs' : `${this.getSelectedRecipientsCount()} utilisateurs`;
          this.logAdminAction('envoi_message', `Message avec images envoyé à ${recipients}: "${this.messageForm.subject}"`);
          
          let successMessage = 'Message avec images envoyé avec succès';
          if (response.recipients_added) {
            successMessage += ` à ${response.recipients_added} destinataire(s)`;
          }
          
          this.showToast(successMessage, 'success');
          this.closeMessageModal();
          this.loadMessages();
        },
        error: (error: any) => {
          console.error('Erreur envoi message avec images:', error);
          let errorMessage = 'Erreur lors de l\'envoi du message avec images';
          
          if (error.error && error.error.error) {
            errorMessage = error.error.error;
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          }
          
          this.showToast(errorMessage, 'error');
        }
      });
    } else {
      // Envoyer sans images via le service API
      const messageData = {
        subject: this.messageForm.subject,
        content: this.messageForm.content,
        send_to_all: this.messageForm.sendToAll,
        recipients: this.messageForm.sendToAll ? [] : this.recipients.filter(r => r.selected).map(r => r.id),
        edition_id: this.editionActive?.numero ?? 4
      };
      
      this.cp2iApi.sendMessage(messageData).subscribe({
        next: (response: any) => {
          console.log('Réponse envoi message:', response);
          const recipients = this.messageForm.sendToAll ? 'tous les utilisateurs' : `${this.getSelectedRecipientsCount()} utilisateurs`;
          this.logAdminAction('envoi_message', `Message envoyé à ${recipients}: "${this.messageForm.subject}"`);
          
          // Message de succès détaillé
          let successMessage = 'Message envoyé avec succès';
          if (response.recipients_added) {
            successMessage += ` à ${response.recipients_added} destinataire(s)`;
          }
          if (response.message_id) {
            successMessage += ` (ID: ${response.message_id})`;
          }
          
          this.showToast(successMessage, 'success');
          this.closeMessageModal();
          this.loadMessages();
        },
        error: (error: any) => {
          console.error('Erreur envoi message:', error);
          let errorMessage = 'Erreur lors de l\'envoi du message';
          
          if (error.error && error.error.error) {
            errorMessage = error.error.error;
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          }
          
          this.showToast(errorMessage, 'error');
        }
      });
    }
  }
  
  viewMessage(message: any) {
    this.showToast(`Message: ${message.subject}`, 'success');
  }
  
  deleteMessage(message: any) {
    this.selectedMessage = message;
    this.showDeleteMessageModal = true;
  }
  
  confirmDeleteMessage() {
    this.cp2iApi.deleteMessage(this.selectedMessage.id).subscribe({
      next: (response) => {
        this.showToast('Message supprimé', 'success');
        this.loadMessages();
        this.closeDeleteMessageModal();
      },
      error: (error) => {
        this.showToast('Erreur lors de la suppression', 'error');
        this.closeDeleteMessageModal();
      }
    });
  }
  
  closeDeleteMessageModal() {
    this.showDeleteMessageModal = false;
    this.selectedMessage = null;
  }
  
  getTotalRecipients(): number {
    return this.messages.reduce((total, msg) => total + (msg.total_recipients || 0), 0);
  }
  
  getTotalReads(): number {
    return this.messages.reduce((total, msg) => total + parseInt(msg.read_count || 0), 0);
  }
  
  getUnreadMessagesCount(): number {
    const totalRecipients = this.getTotalRecipients();
    const totalReads = this.getTotalReads();
    return Math.max(0, totalRecipients - totalReads);
  }
  
  getFilteredMessages(): any[] {
    if (this.currentMessageFilter === 'collective') {
      return this.messages.filter(msg => msg.send_to_all === 1 || msg.send_to_all === '1');
    } else if (this.currentMessageFilter === 'individual') {
      return this.messages.filter(msg => msg.send_to_all === 0 || msg.send_to_all === '0');
    }
    return this.messages;
  }
  
  getCollectiveMessagesCount(): number {
    return this.messages.filter(msg => msg.send_to_all === 1 || msg.send_to_all === '1').length;
  }
  
  getIndividualMessagesCount(): number {
    return this.messages.filter(msg => msg.send_to_all === 0 || msg.send_to_all === '0').length;
  }
  
  // Méthodes de gestion des paramètres
  setSettingsTab(tab: string) {
    this.currentSettingsTab = tab;
  }
  
  saveSettings() {
    const edNum = this.editionActive?.numero ?? 4;
    this.saveSettingsForEdition(edNum);
    // Sauvegarder aussi les dates du calendrier en BDD
    this.cp2iApi.updateEditionDates(edNum, this.concoursSchedule).subscribe();
    this.showToast('Paramètres sauvegardés avec succès', 'success');
  }
  
  resetSettings() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      const edNum = this.editionActive?.numero ?? 4;
      this.settings = this.getDefaultSettings(edNum);
      this.saveSettingsForEdition(edNum);
      this.showToast('Paramètres réinitialisés', 'success');
    }
  }
  
  exportAllData() {
    const data = {
      users: this.users,
      textes: this.textes,
      messages: this.messages,
      settings: this.settings,
      export_date: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cp2i_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    this.showToast('Export des données réalisé', 'success');
  }
  

  clearCache() {
    if (confirm('Êtes-vous sûr de vouloir vider le cache ?')) {
      // Simuler le vidage du cache
      this.showToast('Cache vidé avec succès', 'success');
    }
  }
  
  // Méthodes pour le calendrier du concours
  getJoursRestants(dateStr: string): number {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDurationDays(dateDebut: string, dateFin: string): number {
    const d1 = new Date(dateDebut);
    const d2 = new Date(dateFin);
    return Math.round(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }

  getDaysRemaining(dateString: string): number {
    return this.getJoursRestants(dateString);
  }
  
  getPhaseActuelle(): string {
    const today = new Date();
    const inscriptionDebut = new Date(this.concoursSchedule.inscription_debut);
    const inscriptionFin = new Date(this.concoursSchedule.inscription_fin);
    const correctionDebut = new Date(this.concoursSchedule.correction_debut);
    const correctionFin = new Date(this.concoursSchedule.correction_prolongement);
    const deliberation = new Date(this.concoursSchedule.deliberation);
    const ceremonie = new Date(this.concoursSchedule.ceremonie_remise);
    
    if (today < inscriptionDebut) {
      return 'Préparation';
    } else if (today >= inscriptionDebut && today <= inscriptionFin) {
      return 'Inscriptions ouvertes';
    } else if (today > inscriptionFin && today < correctionDebut) {
      return 'Préparation corrections';
    } else if (today >= correctionDebut && today <= correctionFin) {
      return 'Période de correction';
    } else if (today > correctionFin && today < deliberation) {
      return 'Préparation délibération';
    } else if (today.toDateString() === deliberation.toDateString()) {
      return 'Délibération';
    } else if (today > deliberation && today < ceremonie) {
      return 'Attente cérémonie';
    } else if (today >= ceremonie) {
      return 'Concours terminé';
    }
    
    return 'Phase inconnue';
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
  
  getPhaseClass(): string {
    return 'phase-' + this.getPhaseActuelle().toLowerCase().replace(/\s+/g, '-');
  }
  
  calculateStatsFromTexts() {
    if (this.textes && this.textes.length > 0) {
      const total = this.textes.length;
      const acceptes = this.textes.filter(t => t.statut === 'accepte').length;
      const refuses = this.textes.filter(t => t.statut === 'refuse').length;
      const enAttente = this.textes.filter(t => t.statut === 'en_attente').length;
      
      const notesValides = this.textes.filter(t => t.note && t.note > 0).map(t => parseFloat(t.note));
      const noteMoyenne = notesValides.length > 0 ? 
        Math.round((notesValides.reduce((sum, note) => sum + note, 0) / notesValides.length) * 10) / 10 : null;
      
      this.stats = {
        ...this.stats,
        total_textes: total,
        textes_acceptes: acceptes,
        textes_refuses: refuses,
        textes_en_attente: enAttente,
        note_moyenne: noteMoyenne
      };
      

    }
  }
  
  getNoteMoyenne(): string {
    if (this.stats.note_moyenne !== null && this.stats.note_moyenne !== undefined && this.stats.note_moyenne > 0) {
      const moyenne = typeof this.stats.note_moyenne === 'string' ? parseFloat(this.stats.note_moyenne) : this.stats.note_moyenne;
      return moyenne.toFixed(1) + '/20';
    }
    return 'N/A';
  }
  
  loadDetailedEvaluations() {
    const edNum = this.editionActive?.numero ?? null;
    this.textes.forEach((texte, index) => {
      setTimeout(() => {
        const url = `${this.cp2iApi['baseUrl']}/cp2i-evaluations.php?texte_id=${texte.id}${edNum ? '&edition_id=' + edNum : ''}`;
        this.http.get(url, { headers: this.getHeaders() }).subscribe({
          next: (data: any) => {
            if (data.evaluations && data.evaluations.length > 0) {
              texte.real_evaluations = data.evaluations;
              // Recalculer les statistiques après chaque chargement d'évaluation
              this.calculateStatsFromTexts();
            }
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Erreur chargement évaluations pour texte', texte.id, ':', error);
          }
        });
      }, index * 100); // Délai de 100ms entre chaque requête
    });
  }

  getParticipantAverageNote(prenom: string, nom: string): number | null {
    const participantTextes = this.textes.filter(t => 
      t.prenom?.trim() === prenom?.trim() && t.nom?.trim() === nom?.trim()
    );
    
    if (participantTextes.length === 0) return null;
    
    let totalNotes = 0;
    let nombreTextes = 0;
    
    participantTextes.forEach(texte => {
      // Vérifier plusieurs sources de notes
      let noteTexte = null;
      
      // 1. Note directe du texte
      if (texte.note && texte.note > 0) {
        noteTexte = typeof texte.note === 'string' ? parseFloat(texte.note) : texte.note;
      }
      // 2. Note depuis les évaluations détaillées
      else if (texte.real_evaluations && texte.real_evaluations.length > 0) {
        const notesEvaluations = texte.real_evaluations
          .filter((e: any) => e.note_totale && e.note_totale > 0)
          .map((e: any) => parseFloat(e.note_totale));
        
        if (notesEvaluations.length > 0) {
          noteTexte = notesEvaluations.reduce((sum: number, note: number) => sum + note, 0) / notesEvaluations.length;
        }
      }
      // 3. Note depuis detailed_evaluations
      else if (texte.detailed_evaluations && texte.detailed_evaluations.length > 0) {
        const notesEvaluations = texte.detailed_evaluations
          .filter((e: any) => e.note_totale && e.note_totale > 0)
          .map((e: any) => parseFloat(e.note_totale));
        
        if (notesEvaluations.length > 0) {
          noteTexte = notesEvaluations.reduce((sum: number, note: number) => sum + note, 0) / notesEvaluations.length;
        }
      }
      
      if (noteTexte && noteTexte > 0) {
        totalNotes += noteTexte;
        nombreTextes++;
      }
    });
    
    if (nombreTextes === 0) return null;
    
    const moyenne = totalNotes / nombreTextes;
    return Math.round(moyenne * 100) / 100;
  }
  
  getThemeLabel(theme: string): string {
    const themes = {
      'mots_silence': 'Les mots du silence',
      'taaru_senegal': 'La beauté du Sénégal',
      'flicage_couple': 'Le flicage au sein du couple',
      'pression_sociale': 'Pression sociale et influence ruineuse',
      // Anciens thèmes (3ème édition) conservés pour l'historique
      'patriotisme': 'Patriotisme',
      'justice_dignite': 'Justice et dignité',
      'beaute_africaine': 'Beauté Africaine',
      'jeunesse_responsable': 'Jeunesse responsable',
      'emprise_ecrans': 'Sous l\'emprise des écrans'
    };
    return themes[theme as keyof typeof themes] || theme || 'Non spécifié';
  }
  
  loadAffectationStats() {
    const edNum = this.editionActive?.numero ?? null;
    this.cp2iApi.getDashboardStats(edNum).subscribe({
      next: (data) => {
        if (data.textes_affectations) {
          this.stats.textes_affectations = data.textes_affectations;
        } else {
          // Générer les stats depuis les données locales
          this.generateAffectationStats();
        }
      },
      error: (error) => {
        console.error('Erreur stats affectations:', error);
        this.generateAffectationStats();
      }
    });
  }
  
  generateAffectationStats() {
    if (this.textes.length === 0) return;

    // Filtrer par numéro d'édition (edition_id dans cp2i_textes = numéro, pas l'ID BDD)
    const editionNumero = this.editionActive?.numero;
    const textesEdition = editionNumero ? this.textes.filter(t => Number(t.edition_id) === Number(editionNumero)) : this.textes;
    const textesIds = new Set(textesEdition.map(t => t.id));
    const affectationsEdition = this.affectations.filter(a => textesIds.has(a.texte_id));

    this.stats.total_affectations = affectationsEdition.length;
    this.stats.affectations_terminees = affectationsEdition.filter(a => {
      const t = textesEdition.find(t => t.id === a.texte_id);
      return t && (t.statut === 'accepte' || t.statut === 'refuse');
    }).length;
    this.stats.affectations_restantes = affectationsEdition.filter(a => {
      const t = textesEdition.find(t => t.id === a.texte_id);
      return t && t.statut === 'en_attente';
    }).length;

    // Recalculer correcteurs_stats localement par édition
    this.stats.correcteurs_stats = this.correcteurs.map(c => {
      const assignes = affectationsEdition.filter(a => a.corrector_id === c.id).length;
      const corriges = affectationsEdition.filter(a => {
        if (a.corrector_id !== c.id) return false;
        const t = textesEdition.find(t => t.id === a.texte_id);
        return t && (t.statut === 'accepte' || t.statut === 'refuse');
      }).length;
      return {
        id: c.id,
        correcteur_nom_complet: `${c.prenom} ${c.nom}`,
        correcteur_email: c.email,
        textes_assignes: assignes,
        textes_corriges: corriges,
        textes_restants: assignes - corriges
      };
    });

    this.stats.textes_affectations = textesEdition.map(texte => {
      const aff = affectationsEdition.filter(a => a.texte_id === texte.id);
      const correcteursNoms = [...new Set(aff.map(a => {
        const c = this.correcteurs.find(c => c.id === a.corrector_id);
        return c ? `${c.prenom} ${c.nom}` : null;
      }).filter(n => n))].join(', ');
      return {
        texte_id: texte.id,
        titre: texte.titre,
        auteur_prenom: texte.prenom,
        auteur_nom: texte.nom,
        correcteurs_noms: correcteursNoms || '',
        nb_correcteurs: aff.length
      };
    });

    this.cdr.detectChanges();
  }
  
  // Statistiques réelles pour les graphiques
  getLanguageStats() {
    // Utiliser les stats du backend si disponibles
    if (this.stats.stats_langues && this.stats.stats_langues.length > 0) {
      const total = this.stats.stats_langues.reduce((sum: number, stat: any) => sum + parseInt(stat.count), 0);
      const result = { francais: 0, wolof: 0, anglais: 0, arabe: 0 };
      
      this.stats.stats_langues.forEach((stat: any) => {
        const langue = stat.langue?.toLowerCase();
        const percentage = total > 0 ? Math.round((parseInt(stat.count) / total) * 100) : 0;
        
        if (langue === 'francais' || langue === 'français' || langue === 'french') {
          result.francais = percentage;
        } else if (langue === 'wolof') {
          result.wolof = percentage;
        } else if (langue === 'anglais' || langue === 'english') {
          result.anglais = percentage;
        } else if (langue === 'arabe' || langue === 'arabic') {
          result.arabe = percentage;
        }
      });
      
      return result;
    }
    
    // Fallback: calculer depuis les textes locaux
    if (this.textes.length === 0) return { francais: 0, wolof: 0, anglais: 0, arabe: 0 };
    
    const francais = this.textes.filter(t => t.langue?.toLowerCase() === 'francais' || t.langue?.toLowerCase() === 'français').length;
    const wolof = this.textes.filter(t => t.langue?.toLowerCase() === 'wolof').length;
    const anglais = this.textes.filter(t => t.langue?.toLowerCase() === 'anglais' || t.langue?.toLowerCase() === 'english').length;
    const arabe = this.textes.filter(t => t.langue?.toLowerCase() === 'arabe' || t.langue?.toLowerCase() === 'arabic').length;
    
    const total = this.textes.length;
    return {
      francais: Math.round((francais / total) * 100),
      wolof: Math.round((wolof / total) * 100),
      anglais: Math.round((anglais / total) * 100),
      arabe: Math.round((arabe / total) * 100)
    };
  }
  
  // Nombre de textes par langue
  getLanguageCount(langue: string): number {
    if (this.textes.length === 0) return 0;
    
    switch(langue.toLowerCase()) {
      case 'francais':
        return this.textes.filter(t => t.langue?.toLowerCase() === 'francais' || t.langue?.toLowerCase() === 'français').length;
      case 'wolof':
        return this.textes.filter(t => t.langue?.toLowerCase() === 'wolof').length;
      case 'anglais':
        return this.textes.filter(t => t.langue?.toLowerCase() === 'anglais' || t.langue?.toLowerCase() === 'english').length;
      case 'arabe':
        return this.textes.filter(t => t.langue?.toLowerCase() === 'arabe' || t.langue?.toLowerCase() === 'arabic').length;
      default:
        return 0;
    }
  }
  
  private readonly COUNTRY_TABLE = [
    { key: 'senegal',     name: 'Sénégal',        flag: '🇸🇳', dialCodes: ['+221', '221'], cityKeywords: ['sénégal','senegal','dakar','saint-louis','thiès','thies','rufisque','guédiawaye','guediawaye','kolda','mbour','louga','dahra','ugb','malika','pikine','tivaouane','kaolack','ziguinchor','touba','diourbel','fatick','tambacounda','matam','kédougou','kedougou','vélingara','velingara','kaffrine','sédhiou','sedhiou','bignona','oussouye','foundiougne','gossas','sokone','bambey','mbacké','mbacke','kanel','ranérou','ranerou','ourossogui','bakel','goudiry','nioro','guinguinéo','guinguineo','linguère','linguere','kebemer','ross-béthio','dagana'], telRegex: /^7\d{8}$/ },
    { key: 'cote_ivoire', name: "Côte d'Ivoire",  flag: '🇨🇮', dialCodes: ['+225', '225'], cityKeywords: ['côte','cote','abidjan','daloa','bouaké','bouake','yamoussoukro'] },
    { key: 'mali',        name: 'Mali',            flag: '🇲🇱', dialCodes: ['+223', '223'], cityKeywords: ['mali','bamako','sikasso','mopti','gao'] },
    { key: 'niger',       name: 'Niger',           flag: '🇳🇪', dialCodes: ['+227', '227'], cityKeywords: ['niger','niamey','zinder','maradi','agadez'] },
    { key: 'mauritanie',  name: 'Mauritanie',      flag: '🇲🇷', dialCodes: ['+222', '222'], cityKeywords: ['mauritanie','nouakchott','nouadhibou'] },
    { key: 'togo',        name: 'Togo',            flag: '🇹🇬', dialCodes: ['+228', '228'], cityKeywords: ['togo','lomé','lome','kpalimé','kpalime','sokodé','sokode'] },
    { key: 'congo',       name: 'Congo',           flag: '🇨🇬', dialCodes: ['+242', '242'], cityKeywords: ['congo','brazzaville','pointe-noire'] },
    { key: 'rdc',         name: 'RDC',             flag: '🇨🇩', dialCodes: ['+243', '243'], cityKeywords: ['rdc','kinshasa','lubumbashi','goma','bukavu'] },
    { key: 'burkina',     name: 'Burkina Faso',    flag: '🇧🇫', dialCodes: ['+226', '226'], cityKeywords: ['burkina','ouagadougou','bobo-dioulasso','koudougou'] },
    { key: 'guinee',      name: 'Guinée',          flag: '🇬🇳', dialCodes: ['+224', '224'], cityKeywords: ['guinée','guinee','conakry','kankan','nzérékoré','nzerekore'] },
    { key: 'gabon',       name: 'Gabon',           flag: '🇬🇦', dialCodes: ['+241', '241'], cityKeywords: ['gabon','libreville','port-gentil','franceville'] },
    { key: 'cameroun',    name: 'Cameroun',        flag: '🇨🇲', dialCodes: ['+237', '237'], cityKeywords: ['cameroun','yaoundé','yaounde','douala','bafoussam'] },
    { key: 'madagascar',  name: 'Madagascar',      flag: '🇲🇬', dialCodes: ['+261', '261'], cityKeywords: ['madagascar','antananarivo','analamanga','toamasina','fianarantsoa'] },
    { key: 'france',      name: 'France',          flag: '🇫🇷', dialCodes: ['+33', '33'],   cityKeywords: ['france','paris','lyon','marseille','bordeaux','toulouse','strasbourg'] },
  ];

  classifyNationality(ville: string, telephone: string): string {
    const villeLC = ville?.toLowerCase() || '';
    const tel = telephone?.replace(/\s/g, '') || '';
    for (const country of this.COUNTRY_TABLE) {
      const cityMatch = country.cityKeywords.some(kw => villeLC.includes(kw));
      const dialMatch = country.dialCodes.some(d => tel.startsWith(d));
      const regexMatch = (country as any).telRegex?.test(tel) ?? false;
      if (cityMatch || dialMatch || regexMatch) return country.key;
    }
    return 'autres';
  }
  
  getNationalityStats() {
    const users = this.participantsEditionCourante;
    if (users.length === 0) return {};
    const counts: any = {};
    users.forEach((u: any) => {
      const key = this.classifyNationality(u.ville, u.telephone);
      counts[key] = (counts[key] || 0) + 1;
    });
    const stats: any = {};
    Object.keys(counts).forEach(k => stats[k] = { count: counts[k], percentage: Math.round((counts[k] / users.length) * 100) });
    return stats;
  }

  getTopCountries() {
    const stats = this.getNationalityStats();
    return this.COUNTRY_TABLE
      .map(c => ({ name: c.name, flag: c.flag, key: c.key, count: stats[c.key]?.count || 0, percentage: stats[c.key]?.percentage || 0 }))
      .filter(c => c.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage);
  }
  
  // Extraction et normalisation des villes
  private readonly CITY_KEYWORDS: { name: string; keywords: string[] }[] = [
    { name: 'Dakar',        keywords: ['dakar'] },
    { name: 'Thiès',        keywords: ['thiès', 'thies'] },
    { name: 'Saint-Louis',  keywords: ['saint-louis', 'ugb'] },
    { name: 'Kaolack',      keywords: ['kaolack'] },
    { name: 'Ziguinchor',   keywords: ['ziguinchor'] },
    { name: 'Rufisque',     keywords: ['rufisque'] },
    { name: 'Guédiawaye',   keywords: ['guédiawaye', 'guediawaye'] },
    { name: 'Kolda',        keywords: ['kolda'] },
    { name: 'Mbour',        keywords: ['mbour'] },
    { name: 'Louga',        keywords: ['louga'] },
    { name: 'Pikine',       keywords: ['pikine'] },
    { name: 'Malika',       keywords: ['malika'] },
    { name: 'Tivaouane',    keywords: ['tivaouane'] },
    { name: 'Touba',        keywords: ['touba'] },
    { name: 'Diourbel',     keywords: ['diourbel'] },
    { name: 'Fatick',       keywords: ['fatick'] },
    { name: 'Tambacounda',  keywords: ['tambacounda'] },
    { name: 'Matam',        keywords: ['matam'] },
    { name: 'Kédougou',     keywords: ['kédougou', 'kedougou'] },
    { name: 'Sédhiou',      keywords: ['sédhiou', 'sedhiou'] },
    { name: 'Kaffrine',     keywords: ['kaffrine'] },
    { name: 'Abidjan',      keywords: ['abidjan'] },
    { name: 'Daloa',        keywords: ['daloa'] },
    { name: 'Bamako',       keywords: ['bamako'] },
    { name: 'Conakry',      keywords: ['conakry'] },
    { name: 'Lomé',         keywords: ['lomé', 'lome'] },
    { name: 'Ouagadougou',  keywords: ['ouagadougou'] },
    { name: 'Niamey',       keywords: ['niamey'] },
    { name: 'Kinshasa',     keywords: ['kinshasa'] },
    { name: 'Brazzaville',  keywords: ['brazzaville'] },
    { name: 'Libreville',   keywords: ['libreville'] },
    { name: 'Yaoundé',      keywords: ['yaoundé', 'yaounde'] },
    { name: 'Douala',       keywords: ['douala'] },
    { name: 'Antananarivo', keywords: ['antananarivo'] },
    { name: 'Paris',        keywords: ['paris'] },
    { name: 'Nouakchott',   keywords: ['nouakchott'] },
  ];

  extractCity(ville: string): string {
    if (!ville) return 'Non spécifiée';
    const villeLC = ville.toLowerCase().trim();
    const match = this.CITY_KEYWORDS.find(c => c.keywords.some(kw => villeLC.includes(kw)));
    return match ? match.name : ville.trim(); // retourne la valeur brute si non reconnue
  }

  getCityStats() {
    const users = this.participantsEditionCourante;
    if (users.length === 0) return [];
    const cityCount: { [key: string]: number } = {};
    users.forEach((user: any) => {
      const city = this.extractCity(user.ville);
      cityCount[city] = (cityCount[city] || 0) + 1;
    });
    const total = users.length;
    return Object.entries(cityCount)
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
  }
  
  private readonly REGION_TABLE: { name: string; keywords: string[] }[] = [
    { name: 'Dakar',        keywords: ['dakar','rufisque','guédiawaye','guediawaye','malika','pikine','bargny','diamniadio','presqu\'île','presquile','cap-vert','cap vert'] },
    { name: 'Thiès',        keywords: ['thiès','thies','mbour','tivaouane','joal','saly','pout','khombole','petite côte','petite cote'] },
    { name: 'Saint-Louis',  keywords: ['saint-louis','ugb','ross-béthio','ross-bethio','dagana','podor','ndioum'] },
    { name: 'Ziguinchor',   keywords: ['ziguinchor','bignona','oussouye','cap skirring','casamance','basse casamance'] },
    { name: 'Kaolack',      keywords: ['kaolack','nioro','guinguinéo','guinguineo','ndoffane'] },
    { name: 'Louga',        keywords: ['louga','dahra','linguère','linguere','kebemer','kébémer','ndiambour'] },
    { name: 'Kolda',        keywords: ['kolda','vélingara','velingara','médina yoro foulah','medina yoro foulah','haute casamance'] },
    { name: 'Tambacounda',  keywords: ['tambacounda','tamba','bakel','goudiry','koumpentoum','sénégal oriental','senegal oriental'] },
    { name: 'Fatick',       keywords: ['fatick','foundiougne','gossas','sokone','karang'] },
    { name: 'Diourbel',     keywords: ['diourbel','touba','mbacké','mbacke','bambey','baol'] },
    { name: 'Matam',        keywords: ['matam','kanel','ranérou','ranerou','ourossogui','thilogne'] },
    { name: 'Kédougou',     keywords: ['kédougou','kedougou','saraya','salémata','salemata'] },
    { name: 'Sédhiou',      keywords: ['sédhiou','sedhiou','goudomp','bounkiling','moyenne casamance'] },
    { name: 'Kaffrine',     keywords: ['kaffrine','birkelane','koungheul','malem hodar'] },
  ];

  extractRegion(ville: string): string {
    if (!ville) return 'Non spécifiée';
    const villeLC = ville.toLowerCase().trim();
    const match = this.REGION_TABLE.find(r => r.keywords.some(kw => villeLC.includes(kw)));
    return match ? match.name : 'Hors Sénégal';
  }

  getRegionStats() {
    const users = this.participantsEditionCourante;
    if (users.length === 0) return [];
    const regionCount: { [key: string]: number } = {};
    users.forEach((user: any) => {
      const region = this.extractRegion(user.ville);
      regionCount[region] = (regionCount[region] || 0) + 1;
    });
    const total = users.length;
    // Afficher toutes les 14 régions (même à 0) + Hors Sénégal si présent
    const allRegions = this.REGION_TABLE.map(r => r.name);
    const result = allRegions
      .map(name => ({ name, count: regionCount[name] || 0, percentage: Math.round(((regionCount[name] || 0) / total) * 100) }))
      .filter(r => r.count > 0);
    if (regionCount['Hors Sénégal']) {
      result.push({ name: 'Hors Sénégal', count: regionCount['Hors Sénégal'], percentage: Math.round((regionCount['Hors Sénégal'] / total) * 100) });
    }
    return result.sort((a, b) => b.count - a.count);
  }
  
  getAcceptanceRate() {
    if (this.textes.length === 0) return 0;
    const acceptes = this.textes.filter(t => t.statut === 'accepte').length;
    return Math.round((acceptes / this.textes.length) * 100);
  }
  
  getMonthlySubmissions() {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlyData = new Array(12).fill(0);
    
    this.textes.forEach(texte => {
      if (texte.created_at) {
        const month = new Date(texte.created_at).getMonth();
        monthlyData[month]++;
      }
    });
    
    return months.map((month, index) => ({
      name: month,
      count: monthlyData[index],
      height: monthlyData[index] > 0 ? Math.max(20, (monthlyData[index] / Math.max(...monthlyData)) * 100) : 20
    }));
  }
  
  getDailySubmissions() {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const dailyData = new Array(7).fill(0);
    
    this.textes.forEach(texte => {
      if (texte.created_at) {
        const day = new Date(texte.created_at).getDay();
        const adjustedDay = day === 0 ? 6 : day - 1; // Ajuster pour commencer par lundi
        dailyData[adjustedDay]++;
      }
    });
    
    const maxCount = Math.max(...dailyData, 1);
    return days.map((day, index) => ({
      name: day,
      count: dailyData[index],
      height: (dailyData[index] / maxCount) * 100
    }));
  }
  
  getTopParticipants() {
    // Utiliser directement les données filtrées pour la cohérence
    return this.getFilteredParticipantsNotes().slice(0, 5);
  }
  
  classementData: any[] = [];
  
  loadClassement() {
    this.cp2iApi.getClassement().subscribe({
      next: (data) => {
        this.classementData = data.participants || [];
      },
      error: (error) => {
        console.error('Erreur classement:', error);
        this.classementData = [];
      }
    });
  }
  
  // Données détaillées pour Notes & Classement
  participantsWithDetailedNotes: any[] = [];
  participantDetailsVisible: boolean[] = [];
  
  loadDetailedNotesForAllParticipants() {
    // Obtenir tous les participants uniques depuis les textes
    const participantsMap = new Map();
    
    this.textes.forEach(texte => {
      const key = `${texte.prenom}_${texte.nom}`;
      if (!participantsMap.has(key)) {
        participantsMap.set(key, {
          prenom: texte.prenom,
          nom: texte.nom,
          textes: []
        });
      }
      participantsMap.get(key).textes.push(texte);
    });
    
    this.participantsWithDetailedNotes = Array.from(participantsMap.values());
    
    // Charger les évaluations détaillées pour chaque texte
    this.participantsWithDetailedNotes.forEach(participant => {
      participant.textes.forEach((texte: any) => {
        this.cp2iApi.getEvaluationsForTexte(texte.id).subscribe({
          next: (data) => {
            if (data && data.length > 0) {
              texte.detailed_evaluations = data;
            } else {
              texte.detailed_evaluations = [];
            }
            this.calculateParticipantAverages(participant);
          },
          error: (error) => {
            console.error('Erreur évaluations texte', texte.id, ':', error);
            texte.detailed_evaluations = [];
          }
        });
      });
    });
    
    // Trier par note moyenne décroissante
    setTimeout(() => {
      this.participantsWithDetailedNotes.sort((a, b) => {
        const noteA = a.note_moyenne || 0;
        const noteB = b.note_moyenne || 0;
        return noteB - noteA;
      });
    }, 2000);
  }
  
  calculateParticipantAverages(participant: any) {
    let totalNotes = 0;
    let countNotes = 0;
    
    participant.textes.forEach((texte: any) => {
      if (texte.detailed_evaluations && texte.detailed_evaluations.length > 0) {
        let texteTotal = 0;
        let texteCount = 0;
        
        texte.detailed_evaluations.forEach((evaluation: any) => {
          if (evaluation.note_totale && evaluation.note_totale > 0) {
            texteTotal += parseFloat(evaluation.note_totale);
            texteCount++;
          }
        });
        
        if (texteCount > 0) {
          texte.note_moyenne = texteTotal / texteCount;
          totalNotes += texte.note_moyenne;
          countNotes++;
        }
      }
    });
    
    participant.note_moyenne = countNotes > 0 ? totalNotes / countNotes : null;
  }
  
  getFilteredParticipantsNotes() {
    let filtered = [...this.participantsWithDetailedNotes];
    
    // Filtrer par catégorie
    switch (this.currentNotesFilter) {
      case 'with_notes':
        filtered = filtered.filter(p => p.note_moyenne && p.note_moyenne > 0);
        break;
      case 'without_notes':
        filtered = filtered.filter(p => !p.note_moyenne || p.note_moyenne === 0);
        break;
      case 'top_5':
        filtered = filtered.filter(p => p.note_moyenne && p.note_moyenne > 0)
                          .sort((a, b) => (b.note_moyenne || 0) - (a.note_moyenne || 0))
                          .slice(0, 5);
        break;
      case 'top_10':
        filtered = filtered.filter(p => p.note_moyenne && p.note_moyenne > 0)
                          .sort((a, b) => (b.note_moyenne || 0) - (a.note_moyenne || 0))
                          .slice(0, 10);
        break;
      default:
        // 'all' - pas de filtre
        break;
    }
    
    // Filtrer par recherche
    if (this.notesSearchTerm.trim()) {
      const searchTerm = this.notesSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.prenom?.toLowerCase().includes(searchTerm) ||
        p.nom?.toLowerCase().includes(searchTerm) ||
        `${p.prenom} ${p.nom}`.toLowerCase().includes(searchTerm)
      );
    }
    
    return filtered;
  }
  
  filterNotes(filter: string) {
    this.currentNotesFilter = filter;
  }
  
  getParticipantsWithNotes(): number {
    return this.participantsWithDetailedNotes.filter(p => p.note_moyenne && p.note_moyenne > 0).length;
  }
  
  getParticipantsWithoutNotes(): number {
    // Compter tous les participants qui ont soumis des textes mais n'ont pas de notes
    const allParticipants = this.getAllUniqueParticipants();
    return allParticipants.filter(p => {
      const noteMoyenne = this.getParticipantAverageNote(p.prenom, p.nom);
      return !noteMoyenne || noteMoyenne === 0;
    }).length;
  }
  
  // Méthode pour obtenir le nombre de participants avec des textes soumis
  getParticipantsWithSubmissions(): number {
    return this.getAllUniqueParticipants().length;
  }
  
  logAdminAction(action: string, description: string) {
    // Enregistrer l'action dans l'historique local
    const newAction = {
      user_id: this.currentUser?.id,
      prenom: this.currentUser?.prenom,
      nom: this.currentUser?.nom,
      action: action,
      description: description,
      created_at: new Date().toISOString()
    };
    
    this.history.unshift(newAction);
    
    // Optionnel: envoyer à l'API pour persistance
    // this.cp2iApi.logAction(action, description).subscribe();
  }
  
  // Méthodes pour l'historique
  filterHistory(filter: string) {
    this.currentHistoryFilter = filter;
  }
  
  getFilteredHistory(): any[] {
    if (this.currentHistoryFilter === 'all') {
      return this.history;
    }
    return this.history.filter(item => {
      const subject = this.getHistorySubject(item);
      return subject === this.currentHistoryFilter;
    });
  }
  
  getHistoryCountBySubject(subject: string): number {
    return this.history.filter(item => {
      const itemSubject = this.getHistorySubject(item);
      return itemSubject === subject;
    }).length;
  }
  
  getHistorySubject(item: any): string {
    if (!item) return 'autre';
    
    const text = (item.action || item.description || '').toLowerCase();
    
    // Debug
    if (text.includes('registration') || text.includes('inscription') || text.includes('user')) {
      return 'utilisateurs';
    }
    if (text.includes('submission') || text.includes('soumission') || text.includes('text') || text.includes('texte') || text.includes('edit')) {
      return 'textes';
    }
    if (text.includes('evaluation') || text.includes('correction')) {
      return 'evaluations';
    }
    if (text.includes('affectation') || text.includes('assign')) {
      return 'affectations';
    }
    if (text.includes('message')) {
      return 'messages';
    }
    return 'autre';
  }
  
  getHistorySubjectClass(item: any): string {
    const subject = this.getHistorySubject(item);
    return `timeline-${subject}`;
  }
  
  getHistorySubjectIcon(item: any): string {
    const subject = this.getHistorySubject(item);
    const icons = {
      'utilisateurs': 'fas fa-users',
      'textes': 'fas fa-file-alt',
      'evaluations': 'fas fa-star',
      'affectations': 'fas fa-user-tie',
      'messages': 'fas fa-envelope',
      'autre': 'fas fa-cog'
    };
    return icons[subject as keyof typeof icons] || 'fas fa-circle';
  }
  
  getHistoryTitle(action: string): string {
    const titles = {
      'creation_utilisateur': 'Création d\'utilisateur',
      'modification_utilisateur': 'Modification d\'utilisateur',
      'suppression_utilisateur': 'Suppression d\'utilisateur',
      'modification_texte': 'Modification de texte',
      'affectation': 'Affectation de correcteur',
      'envoi_message': 'Envoi de message',
      'selection_finalistes': 'Sélection des finalistes'
    };
    return titles[action as keyof typeof titles] || action.replace('_', ' ');
  }

  getTimeAgo(dateString: string): string {
    if (!dateString) return 'Jamais';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) {
      return diffDays === 1 ? 'Il y a 1 jour' : `Il y a ${diffDays} jours`;
    } else if (diffHours > 0) {
      return diffHours === 1 ? 'Il y a 1 heure' : `Il y a ${diffHours} heures`;
    } else if (diffMinutes > 0) {
      return diffMinutes === 1 ? 'Il y a 1 minute' : `Il y a ${diffMinutes} minutes`;
    } else {
      return 'Il y a quelques instants';
    }
  }
  
  getLastLoginText(lastLogin: string): string {
    if (!lastLogin) return 'Jamais connecté';
    return this.getTimeAgo(lastLogin);
  }
  
  // Nouvelles statistiques
  getQualityDistribution() {
    if (this.textes.length === 0) return [];
    
    const ranges = [
      { min: 0, max: 5, label: '0-5/20', class: 'very-low' },
      { min: 6, max: 10, label: '6-10/20', class: 'low' },
      { min: 11, max: 15, label: '11-15/20', class: 'medium' },
      { min: 16, max: 20, label: '16-20/20', class: 'high' }
    ];
    
    const textesAvecNotes = this.textes.filter(t => t.note && t.note > 0);
    if (textesAvecNotes.length === 0) return [];
    
    return ranges.map(range => {
      const count = textesAvecNotes.filter(t => t.note >= range.min && t.note <= range.max).length;
      const percentage = Math.round((count / textesAvecNotes.length) * 100);
      return { ...range, count, percentage };
    }).filter(r => r.count > 0);
  }
  
  getThemeDistribution() {
    if (this.textes.length === 0) return [];
    
    const themeCount: { [key: string]: number } = {};
    this.textes.forEach(texte => {
      const theme = texte.theme || 'non_specifie';
      themeCount[theme] = (themeCount[theme] || 0) + 1;
    });
    
    const total = this.textes.length;
    return Object.entries(themeCount)
      .map(([theme, count]) => ({
        theme,
        label: this.getThemeLabel(theme),
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }
  
  getCorrectorPerformance() {
    // Utiliser les données backend si disponibles (même source que la section affectations)
    if (this.stats.correcteurs_stats && this.stats.correcteurs_stats.length > 0) {
      return this.stats.correcteurs_stats.map((correcteurStats: any) => {
        const assignes = correcteurStats.textes_assignes || 0;
        const corriges = correcteurStats.textes_corriges || 0;
        const completion = assignes > 0 ? Math.round((corriges / assignes) * 100) : 0;
        
        // Récupérer le nom depuis la liste des correcteurs locaux
        const correcteurLocal = this.correcteurs.find(c => c.id === correcteurStats.id);
        let nomComplet = correcteurStats.nom;
        if (!nomComplet && correcteurLocal) {
          nomComplet = `${correcteurLocal.prenom} ${correcteurLocal.nom}`;
        }
        if (!nomComplet) {
          nomComplet = `Correcteur ${correcteurStats.id}`;
        }
        
        return {
          id: correcteurStats.id,
          nom: nomComplet,
          assignes,
          corriges,
          completion
        };
      }).filter((c: any) => c.assignes > 0).sort((a: any, b: any) => b.completion - a.completion);
    }
    
    // Fallback: utiliser les données locales si pas de stats backend
    if (this.correcteurs.length === 0 || this.affectations.length === 0) return [];
    
    return this.correcteurs.map(correcteur => {
      const assignes = this.affectations.filter(a => a.corrector_id === correcteur.id).length;
      const corriges = this.textes.filter(t => {
        const isAssigned = this.affectations.some(a => a.corrector_id === correcteur.id && a.texte_id === t.id);
        return isAssigned && (t.statut === 'accepte' || t.statut === 'refuse');
      }).length;
      
      const completion = assignes > 0 ? Math.round((corriges / assignes) * 100) : 0;
      
      return {
        id: correcteur.id,
        nom: `${correcteur.prenom} ${correcteur.nom}`,
        assignes,
        corriges,
        completion
      };
    }).filter((c: any) => c.assignes > 0).sort((a: any, b: any) => b.completion - a.completion);
  }
  
  getAverageCorrectionTime(): string {
    const textesCorrigés = this.textes.filter(t =>
      (t.statut === 'accepte' || t.statut === 'refuse') &&
      t.updated_at && t.created_at &&
      new Date(t.updated_at).getTime() > new Date(t.created_at).getTime()
    );
    if (textesCorrigés.length === 0) return 'N/A';
    const totalDays = textesCorrigés.reduce((sum, texte) => {
      const diffDays = Math.ceil(
        (new Date(texte.updated_at).getTime() - new Date(texte.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + diffDays;
    }, 0);
    const avg = Math.round(totalDays / textesCorrigés.length);
    return avg === 0 ? '< 1' : avg.toString();
  }

  getOverdueTexts(): number {
    const correctionDebut = new Date(this.concoursSchedule?.correction_debut);
    const correctionFin = new Date(this.concoursSchedule?.correction_prolongement);
    const today = new Date();
    // Hors période de correction : pas de retard
    if (today < correctionDebut || today > correctionFin) return 0;
    const delaiMax = 7;
    return this.textes.filter(t => {
      if (t.statut !== 'en_attente') return false;
      const soumission = new Date(t.created_at);
      const diffDays = Math.ceil((today.getTime() - soumission.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > delaiMax;
    }).length;
  }

  getFastestCorrector(): string {
    const textesCorrigés = this.textes.filter(t =>
      (t.statut === 'accepte' || t.statut === 'refuse') &&
      t.updated_at && t.created_at &&
      new Date(t.updated_at).getTime() > new Date(t.created_at).getTime()
    );
    if (textesCorrigés.length === 0) return 'Aucun';

    // Calculer le temps moyen par correcteur via les affectations
    const tempsParCorrecteur: { [id: number]: number[] } = {};
    textesCorrigés.forEach(texte => {
      const affectation = this.affectations.find(a => a.texte_id === texte.id);
      if (!affectation) return;
      const jours = Math.ceil(
        (new Date(texte.updated_at).getTime() - new Date(texte.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (!tempsParCorrecteur[affectation.corrector_id]) tempsParCorrecteur[affectation.corrector_id] = [];
      tempsParCorrecteur[affectation.corrector_id].push(jours);
    });

    let bestId = -1, bestAvg = Infinity;
    Object.entries(tempsParCorrecteur).forEach(([id, jours]) => {
      if (jours.length < 2) return; // ignorer si moins de 2 textes corrigés
      const avg = jours.reduce((s, j) => s + j, 0) / jours.length;
      if (avg < bestAvg) { bestAvg = avg; bestId = +id; }
    });

    if (bestId === -1) return 'Aucun';
    const correcteur = this.correcteurs.find(c => c.id === bestId);
    return correcteur ? `${correcteur.prenom} ${correcteur.nom} (${Math.round(bestAvg)}j moy.)` : 'Aucun';
  }
  
  // Statistiques d'engagement
  showMultiEditionsList = false;

  private getMultiEditionsKey(t: any): string {
    return (t.email || `${t.prenom}_${t.nom}`).toLowerCase();
  }

  getMultiTextParticipants(): number {
    const editionActive = this.editionActive?.numero ?? 4;
    const emailsCourants = new Set(this.textes.map(t => this.getMultiEditionsKey(t)));
    if (emailsCourants.size === 0) return 0;
    const autresEditions = this.allTextesAllEditions.filter(t => t.edition_id !== editionActive);
    return Array.from(emailsCourants).filter(key =>
      autresEditions.some(t => this.getMultiEditionsKey(t) === key)
    ).length;
  }

  getMultiEditionsList(): { nom: string; prenom: string; editions: number[] }[] {
    const editionActive = this.editionActive?.numero ?? 4;
    const autresEditions = this.allTextesAllEditions.filter(t => t.edition_id !== editionActive);
    const seen = new Set<string>();
    return this.textes
      .filter(t => {
        const key = this.getMultiEditionsKey(t);
        return autresEditions.some(a => this.getMultiEditionsKey(a) === key);
      })
      .reduce((acc: { nom: string; prenom: string; editions: number[] }[], t) => {
        const key = this.getMultiEditionsKey(t);
        if (seen.has(key)) return acc;
        seen.add(key);
        const editionsAutres = autresEditions
          .filter(a => this.getMultiEditionsKey(a) === key)
          .map(a => a.edition_id)
          .filter((v: number, i: number, arr: number[]) => arr.indexOf(v) === i);
        acc.push({ nom: t.nom, prenom: t.prenom, editions: [...editionsAutres, editionActive].sort((a, b) => a - b) });
        return acc;
      }, [])
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }

  getMultiTextPercentage(): number {
    const total = this.textes.length;
    if (total === 0) return 0;
    return Math.round((this.getMultiTextParticipants() / total) * 100);
  }
  
  getAbandonRate(): number {
    const inscrits = this.users.filter(u => u.role === 'participant').length;
    const actifs = new Set(this.textes.map(t => `${t.prenom}_${t.nom}`)).size;
    if (inscrits === 0) return 0;
    return Math.round(((inscrits - actifs) / inscrits) * 100);
  }
  
  getAverageTextsPerParticipant(): string {
    const actifs = new Set(this.textes.map(t => `${t.prenom}_${t.nom}`)).size;
    if (actifs === 0) return '0';
    return (this.textes.length / actifs).toFixed(1);
  }
  
  getMostActiveCityName(): string {
    const cityStats = this.getCityStats();
    if (cityStats.length === 0) return 'Aucune';
    return cityStats[0].name;
  }
  
  // Statistiques de qualité avancées
  getNotesStandardDeviation(): string {
    const notes = this.textes.filter(t => t.note && t.note > 0).map(t => parseFloat(t.note));
    if (notes.length < 2) return '0';
    const moyenne = notes.reduce((sum, note) => sum + note, 0) / notes.length;
    const variance = notes.reduce((sum, note) => sum + Math.pow(note - moyenne, 2), 0) / notes.length;
    return Math.sqrt(variance).toFixed(2);
  }
  
  getNotesConsistency(): string {
    const ecartType = parseFloat(this.getNotesStandardDeviation());
    if (ecartType <= 2) return 'Excellente';
    if (ecartType <= 3) return 'Bonne';
    if (ecartType <= 4) return 'Moyenne';
    return 'Faible';
  }
  
  getConsistencyClass(): string {
    const consistency = this.getNotesConsistency();
    switch(consistency) {
      case 'Excellente': return 'excellent';
      case 'Bonne': return 'good';
      case 'Moyenne': return 'average';
      default: return 'poor';
    }
  }
  
  getLanguagePerformance() {
    const langStats = new Map<string, {total: number, count: number}>();
    this.textes.filter(t => t.note && t.note > 0).forEach(texte => {
      const langue = texte.langue || 'Non spécifié';
      const current = langStats.get(langue) || {total: 0, count: 0};
      langStats.set(langue, {total: current.total + parseFloat(texte.note), count: current.count + 1});
    });
    return Array.from(langStats.entries()).map(([langue, stats]) => ({
      langue, moyenne: (stats.total / stats.count).toFixed(1), count: stats.count
    })).sort((a, b) => parseFloat(b.moyenne) - parseFloat(a.moyenne));
  }
  
  getQualityTrend(): string {
    const textesAvecNotes = this.textes.filter(t => t.note && t.note > 0)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (textesAvecNotes.length < 4) return 'Données insuffisantes';
    const moitie = Math.floor(textesAvecNotes.length / 2);
    const premierePartie = textesAvecNotes.slice(0, moitie);
    const deuxiemePartie = textesAvecNotes.slice(moitie);
    const moyenneDebut = premierePartie.reduce((sum, t) => sum + parseFloat(t.note), 0) / premierePartie.length;
    const moyenneFin = deuxiemePartie.reduce((sum, t) => sum + parseFloat(t.note), 0) / deuxiemePartie.length;
    const diff = moyenneFin - moyenneDebut;
    if (diff > 0.5) return 'En amélioration';
    if (diff < -0.5) return 'En baisse';
    return 'Stable';
  }
  
  getQualityTrendClass(): string {
    const trend = this.getQualityTrend();
    if (trend === 'En amélioration') return 'trend-up';
    if (trend === 'En baisse') return 'trend-down';
    return 'trend-stable';
  }
  
  // Statistiques géographiques avancées
  getCityPerformance() {
    const cityStats = new Map<string, {total: number, count: number, participants: number}>();
    this.users.filter(u => u.role === 'participant').forEach(user => {
      const ville = this.extractCity(user.ville);
      const current = cityStats.get(ville) || {total: 0, count: 0, participants: 0};
      cityStats.set(ville, {...current, participants: current.participants + 1});
    });
    this.textes.filter(t => t.note && t.note > 0).forEach(texte => {
      const participant = this.users.find(u => u.prenom === texte.prenom && u.nom === texte.nom);
      if (participant) {
        const ville = this.extractCity(participant.ville);
        const current = cityStats.get(ville) || {total: 0, count: 0, participants: 0};
        cityStats.set(ville, {...current, total: current.total + parseFloat(texte.note), count: current.count + 1});
      }
    });
    return Array.from(cityStats.entries())
      .filter(([_, stats]) => stats.count > 0)
      .map(([ville, stats]) => ({ville, moyenne: (stats.total / stats.count).toFixed(1), participants: stats.participants}))
      .sort((a, b) => parseFloat(b.moyenne) - parseFloat(a.moyenne)).slice(0, 5);
  }
  
  getUniqueCitiesCount(): number {
    const cities = new Set(this.users.map(u => this.extractCity(u.ville)));
    cities.delete('Non spécifiée'); cities.delete('Autres');
    return cities.size;
  }
  
  getUniqueRegionsCount(): number {
    const regions = new Set(this.participantsEditionCourante.map((u: any) => this.extractRegion(u.ville)));
    regions.delete('Non spécifiée'); regions.delete('Autres');
    return regions.size;
  }
  
  get participantsEditionCourante(): any[] {
    return this.getParticipantsByEdition(this.editionActive?.numero ?? 4);
  }

  getUniqueCountriesCount(): number {
    const countries = new Set(this.participantsEditionCourante.map((u: any) => this.classifyNationality(u.ville, u.telephone)));
    countries.delete('autres');
    return countries.size;
  }
  




  // Statistiques prédictives
  getPredictedFinalParticipants(): number {
    const currentParticipants = this.participants.length;
    const joursEcoules = this.getDaysFromStart();
    const joursTotal = this.getTotalDays();
    if (joursEcoules === 0 || joursTotal === 0) return currentParticipants;
    const tauxCroissance = currentParticipants / joursEcoules;
    return Math.round(tauxCroissance * joursTotal);
  }
  
  getCorrectorsAtRisk(): number {
    return this.getCorrectorPerformance().filter((c: any) => c.completion < 50 && c.assignes > 2).length;
  }
  
  getPeakSubmissionDay(): string {
    const dayStats = this.getDailySubmissions();
    const maxDay = dayStats.reduce((prev, current) => current.count > prev.count ? current : prev);
    return maxDay.name;
  }
  
  private getDaysFromStart(): number {
    const s = this.schedulesParEdition[this.editionActive?.numero ?? 4];
    const startDate = new Date(s?.inscription_debut ?? this.concoursSchedule.inscription_debut);
    return Math.max(1, Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  private getTotalDays(): number {
    const s = this.schedulesParEdition[this.editionActive?.numero ?? 4];
    const startDate = new Date(s?.inscription_debut ?? this.concoursSchedule.inscription_debut);
    const endDate = new Date(s?.inscription_fin ?? this.concoursSchedule.inscription_fin);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Méthodes pour la gestion des correcteurs
  getCorrecteurDetails() {
    return this.correcteurs.map(correcteur => {
      const textesAssignes = this.affectations.filter(a => a.corrector_id === correcteur.id);
      const textesDetails = textesAssignes.map(affectation => {
        return this.textes.find(t => t.id === affectation.texte_id);
      }).filter(t => t);
      
      const textesCorreges = this.getCorrecteurCompletedCount(correcteur.id);
      const textesRestants = this.getCorrecteurPendingCount(correcteur.id);
      const progressPercentage = textesAssignes.length > 0 ? Math.round((textesCorreges / textesAssignes.length) * 100) : 0;
      
      return {
        ...correcteur,
        textesAssignes: textesAssignes.length,
        textesCorreges,
        textesRestants,
        progressPercentage,
        textesDetails
      };
    }).sort((a, b) => b.textesAssignes - a.textesAssignes);
  }

  getTotalAssignments(): number {
    return this.affectations.length;
  }

  getTotalCorrected(): number {
    return this.textes.filter(t => t.statut === 'accepte' || t.statut === 'refuse').length;
  }

  getTotalPending(): number {
    return this.textes.filter(t => t.statut === 'en_attente').length;
  }

  viewCorrecteurDetails(correcteur: any) {
    // TODO: Implémenter les détails du correcteur
  }

  sendReminderToCorrecteur(correcteur: any) {
    const textesEnAttente = correcteur.textesDetails.filter((t: any) => t.statut === 'en_attente');
    
    if (textesEnAttente.length === 0) {
      this.showToast(`${correcteur.prenom} ${correcteur.nom} n'a aucun texte en attente`, 'error');
      return;
    }
    
    const message = `Rappel envoyé à ${correcteur.prenom} ${correcteur.nom} pour ${textesEnAttente.length} texte(s) en attente`;
    this.showToast(message, 'success');
    
    // Ici on pourrait appeler l'API pour envoyer un vrai email/notification
    // this.cp2iApi.sendReminderToCorrector(correcteur.id, textesEnAttente).subscribe();
  }

  // Méthodes de gestion des images
  onImagesSelect(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.processImages(files);
  }

  processImages(files: File[]) {
    files.forEach(file => {
      if (this.selectedImages.length >= 5) return;
      
      if (!file.type.startsWith('image/')) {
        this.showToast('Seules les images sont autorisées', 'error');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        this.showToast(`L'image ${file.name} est trop volumineuse (max 5MB)`, 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImages.push({
          file,
          preview: e.target?.result as string,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    this.selectedImages.splice(index, 1);
  }

  // Méthodes pour afficher les images dans les messages reçus
  getMessageText(message: string): string {
    if (!message) return '';
    let text = message;
    if (message.includes('[IMAGES]')) {
      text = message.split('[IMAGES]')[0].trim();
    }
    // Convertir les sauts de ligne pour l'affichage HTML
    return text.replace(/\\n/g, '<br>').replace(/\n/g, '<br>').replace(/\\r\\n/g, '<br>').replace(/\r\n/g, '<br>');
  }

  getMessageImages(message: string): string[] {
    if (!message || !message.includes('[IMAGES]')) return [];
    try {
      const imagesPart = message.split('[IMAGES]')[1];
      return JSON.parse(imagesPart) || [];
    } catch (e) {
      return [];
    }
  }

  // Nouvelles méthodes pour la gestion des affectations
  getAssignedCorrectorsForText(texteId: number): any[] {
    return this.affectations
      .filter(a => Number(a.texte_id) === Number(texteId))
      .map(affectation => {
        const correcteur = this.correcteurs.find(c => Number(c.id) === Number(affectation.corrector_id));
        return {
          ...affectation,
          texte_id: Number(affectation.texte_id),
          corrector_id: Number(affectation.corrector_id),
          correcteur_prenom: correcteur?.prenom,
          correcteur_nom: correcteur?.nom
        };
      });
  }

  getAvailableCorrectorsForText(texteId: number): any[] {
    const assignedIds = this.affectations
      .filter(a => Number(a.texte_id) === Number(texteId))
      .map(a => Number(a.corrector_id));
    return this.correcteurs.filter(c => !assignedIds.includes(Number(c.id)));
  }

  getTextsAssignedToCorrector(correcteurId: number): any[] {
    return this.affectations
      .filter(a => a.corrector_id === correcteurId)
      .map(affectation => {
        const texte = this.textes.find(t => t.id === affectation.texte_id);
        return {
          ...affectation,
          texte_titre: texte?.titre,
          texte_langue: texte?.langue,
          texte_statut: texte?.statut,
          auteur_prenom: texte?.prenom,
          auteur_nom: texte?.nom
        };
      })
      .filter(item => item.texte_titre);
  }

  getCorrecteurAssignmentsCount(correcteurId: number): number {
    return this.affectations.filter(a => a.corrector_id === correcteurId).length;
  }

  getCorrecteurCompletedCount(correcteurId: number): number {
    // Utiliser les données du backend directement
    const correcteurStats = this.stats.correcteurs_stats?.find((c: any) => c.id === correcteurId);
    return correcteurStats?.textes_corriges || 0;
  }

  getCorrecteurPendingCount(correcteurId: number): number {
    // Utiliser les données du backend directement
    const correcteurStats = this.stats.correcteurs_stats?.find((c: any) => c.id === correcteurId);
    return correcteurStats?.textes_restants || 0;
  }

  getTextsWithFullAssignments(): number {
    return this.textes.filter(texte => this.getCorrectorsCount(texte.id) === 3).length;
  }

  getTextsWithoutAssignments(): number {
    return this.textes.filter(texte => this.getCorrectorsCount(texte.id) === 0).length;
  }

  getTextsWithoutFullAssignments(): number {
    return this.textes.filter(texte => this.getCorrectorsCount(texte.id) < 3).length;
  }

  quickAssignToText(texteId: number): void {
    const correcteurId = this.quickAssignCorrector[texteId];
    if (!correcteurId) return;

    this.cp2iApi.assignCorrector(texteId, correcteurId).subscribe({
      next: (response) => {
        this.showToast('Correcteur assigné avec succès!', 'success');
        this.quickAssignCorrector[texteId] = 0;
        this.loadData();
      },
      error: (error) => {
        this.showToast('Erreur lors de l\'assignation: ' + (error.error?.error || 'Erreur inconnue'), 'error');
      }
    });
  }

  getBulkCount(texteId: number): number {
    return (this.bulkAssignSelected[texteId] || []).length;
  }

  toggleBulkSelect(texteId: number, correcteurId: number): void {
    if (!this.bulkAssignSelected[texteId]) this.bulkAssignSelected[texteId] = [];
    const idx = this.bulkAssignSelected[texteId].indexOf(correcteurId);
    if (idx === -1) this.bulkAssignSelected[texteId].push(correcteurId);
    else this.bulkAssignSelected[texteId].splice(idx, 1);
  }

  isBulkSelected(texteId: number, correcteurId: number): boolean {
    return (this.bulkAssignSelected[texteId] || []).includes(correcteurId);
  }

  bulkAssignToText(texteId: number): void {
    const ids = this.bulkAssignSelected[texteId] || [];
    if (ids.length === 0) {
      this.showToast('Cochez au moins un correcteur', 'error');
      return;
    }
    this.cp2iApi.bulkAssignCorrecteurs(texteId, ids).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.showToast(`${res.assigned} correcteur(s) affecté(s) avec succès!`, 'success');
          this.bulkAssignSelected[texteId] = [];
          this.loadData();
        } else {
          this.showToast(res.error || 'Erreur lors de l\'affectation', 'error');
        }
      },
      error: (err) => {
        this.showToast('Erreur: ' + (err.error?.error || 'Erreur inconnue'), 'error');
      }
    });
  }

  getTexteTitle(texteId: number): string {
    const texte = this.textes.find(t => t.id === texteId);
    return texte ? texte.titre : 'Texte introuvable';
  }

  getTexteAuthor(texteId: number): string {
    const texte = this.textes.find(t => t.id === texteId);
    return texte ? `${texte.prenom} ${texte.nom}` : 'Auteur inconnu';
  }

  getTexteLangue(texteId: number): string {
    const texte = this.textes.find(t => t.id === texteId);
    return texte ? texte.langue : 'Langue inconnue';
  }

  getTexteStatut(texteId: number): string {
    const texte = this.textes.find(t => t.id === texteId);
    return texte ? texte.statut : 'en_attente';
  }

  getTexteStatutLabel(texteId: number): string {
    const statut = this.getTexteStatut(texteId);
    return this.getStatusLabel(statut);
  }

  getCorrecteurName(correcteurId: number): string {
    const correcteur = this.correcteurs.find(c => c.id === correcteurId);
    return correcteur ? `${correcteur.prenom} ${correcteur.nom}` : 'Correcteur inconnu';
  }

  getFilteredAssignments(): any[] {
    let filtered = [...this.affectations];
    
    // Filtre par recherche textuelle
    if (this.assignmentSearchTerm.trim()) {
      const searchTerm = this.assignmentSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(affectation => {
        const titre = this.getTexteTitle(affectation.texte_id).toLowerCase();
        const auteur = this.getTexteAuthor(affectation.texte_id).toLowerCase();
        const correcteur = this.getCorrecteurName(affectation.corrector_id).toLowerCase();
        return titre.includes(searchTerm) || auteur.includes(searchTerm) || correcteur.includes(searchTerm);
      });
    }
    
    // Filtre par langue
    if (this.assignmentLangueFilter) {
      filtered = filtered.filter(affectation => {
        const langue = this.getTexteLangue(affectation.texte_id).toLowerCase();
        return langue === this.assignmentLangueFilter.toLowerCase() || 
               (this.assignmentLangueFilter === 'francais' && langue === 'français');
      });
    }
    
    // Filtre par statut
    if (this.assignmentStatutFilter) {
      filtered = filtered.filter(affectation => {
        return this.getTexteStatut(affectation.texte_id) === this.assignmentStatutFilter;
      });
    }
    
    return filtered;
  }

  canUnassignCorrector(texteId: number, correcteurId: number): boolean {
    // Le backend protège contre la suppression si évaluation existe.
    // Côté Angular on bloque uniquement si l'édition est archivée.
    return !this.isEditionArchivee();
  }

  unassignCorrector(texteId: number, correcteurId: number): void {
    const tId = Number(texteId);
    const cId = Number(correcteurId);

    if (!tId || !cId) {
      this.showToast('Erreur: IDs manquants', 'error');
      return;
    }

    this.http.post(
      `${this.cp2iApi['baseUrl']}/cp2i-dashboard.php?action=direct_unassign`,
      { texte_id: tId, corrector_id: cId },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.showToast('Correcteur retiré avec succès', 'success');
          this.loadData();
        } else {
          this.showToast(res?.error || 'Erreur lors du retrait', 'error');
        }
      },
      error: (err) => {
        this.showToast(err.error?.error || 'Impossible de retirer ce correcteur', 'error');
      }
    });
  }



  restoreAffectations(): void {
    if (!confirm('Restaurer les affectations depuis les évaluations existantes ?')) return;
    this.http.post(
      `${this.cp2iApi['baseUrl']}/cp2i-restore-affectations.php`,
      {},
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.showToast(`✅ ${res.restored} affectations restaurées (total: ${res.total_affectations})`, 'success');
          this.loadData();
        } else {
          this.showToast(res?.error || 'Erreur lors de la restauration', 'error');
        }
      },
      error: (err) => this.showToast('Erreur: ' + (err.error?.error || err.message), 'error')
    });
  }

  hasAnyEvaluatedText(): boolean {
    return this.textes.some(t => t.statut === 'accepte' || t.statut === 'refuse');
  }

  removeAllAssignments(): void {
    if (this.isEditionArchivee()) {
      this.showToast('Action impossible : édition archivée', 'error');
      return;
    }
    if (this.hasAnyEvaluatedText()) {
      this.showToast('Impossible : des textes ont déjà été corrigés dans cette édition', 'error');
      return;
    }
    if (this.affectations.length === 0) {
      this.showToast('Aucune assignation à supprimer', 'error');
      return;
    }
    if (!confirm(`Supprimer les ${this.affectations.length} assignations de l'édition ${this.editionActive?.numero} ?`)) {
      return;
    }
    const editionNumero = this.editionActive?.numero;
    this.http.post(
      `${this.cp2iApi['baseUrl']}/cp2i-dashboard.php?action=reset_all_assignments`,
      { edition_id: editionNumero },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (response) => {
        const res = response as any;
        if (res?.success) {
          this.showToast(`${res.count} assignations supprimées (edition ${editionNumero})`, 'success');
          this.logAdminAction('suppression_toutes_assignations', `Suppression de ${res.count} assignations edition ${editionNumero}`);
          this.affectations = [];
          this.loadData();
        } else {
          this.showToast(res?.error || 'Erreur lors de la suppression', 'error');
        }
      },
      error: (error) => {
        this.showToast(error.error?.error || 'Erreur lors de la suppression', 'error');
      }
    });
  }

  removeAllAssignmentsOneByOne(): void {
    if (this.affectations.length === 0) {
      this.showToast('Aucune assignation à supprimer', 'error');
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer toutes les ${this.affectations.length} assignations une par une ?`)) {
      return;
    }
    
    let removedCount = 0;
    let processedCount = 0;
    const totalCount = this.affectations.length;
    
    this.showToast(`Suppression de ${totalCount} assignations...`, 'success');
    
    this.affectations.forEach((affectation, index) => {
      this.http.post(`${this.cp2iApi['baseUrl']}/cp2i-dashboard.php?action=direct_unassign`, 
        { texte_id: affectation.texte_id, corrector_id: affectation.corrector_id }, 
        { headers: this.getHeaders() }
      ).subscribe({
        next: (response) => {
          removedCount++;
          processedCount++;
          
          if (processedCount === totalCount) {
            this.showToast(`${removedCount}/${totalCount} assignations supprimées`, 'success');
            this.loadData();
          }
        },
        error: (error) => {
          processedCount++;
          
          if (processedCount === totalCount) {
            this.showToast(`${removedCount}/${totalCount} assignations supprimées`, removedCount > 0 ? 'success' : 'error');
            if (removedCount > 0) this.loadData();
          }
        }
      });
    });
  }

  autoAssignAll(): void {
    const textesNonAssignes = this.textes.filter(texte => this.getCorrectorsCount(texte.id) < 3);

    if (textesNonAssignes.length === 0) {
      this.showToast('Tous les textes sont déjà complètement assignés', 'error');
      return;
    }

    let assignmentsCount = 0;
    textesNonAssignes.forEach(texte => {
      const placesRestantes = 3 - this.getCorrectorsCount(texte.id);
      const correcteursDisponiblesPourTexte = this.getAvailableCorrectorsForText(texte.id);
      
      correcteursDisponiblesPourTexte.sort((a, b) => 
        this.getCorrecteurAssignmentsCount(a.id) - this.getCorrecteurAssignmentsCount(b.id)
      );

      for (let i = 0; i < Math.min(placesRestantes, correcteursDisponiblesPourTexte.length); i++) {
        const correcteur = correcteursDisponiblesPourTexte[i];
        this.cp2iApi.assignCorrector(texte.id, correcteur.id).subscribe({
          next: () => assignmentsCount++,
          error: (error) => console.error('Erreur auto-assignation:', error)
        });
      }
    });

    this.showToast(`Affectation automatique en cours pour ${textesNonAssignes.length} textes...`, 'success');
    
    setTimeout(() => {
      this.showToast(`${assignmentsCount} affectations automatiques réalisées`, 'success');
      this.loadData();
    }, 2000);
  }

  assignRandomTextToCorrector(correcteurId: number): void {
    const textesDisponibles = this.textes.filter(texte => {
      const correctorsCount = this.getCorrectorsCount(texte.id);
      const isAlreadyAssigned = this.affectations.some(a => a.texte_id === texte.id && a.corrector_id === correcteurId);
      return correctorsCount < 3 && !isAlreadyAssigned;
    });

    if (textesDisponibles.length === 0) {
      this.showToast('Aucun texte disponible pour ce correcteur', 'error');
      return;
    }

    const randomTexte = textesDisponibles[Math.floor(Math.random() * textesDisponibles.length)];
    
    this.cp2iApi.assignCorrector(randomTexte.id, correcteurId).subscribe({
      next: (response) => {
        this.showToast(`Texte "${randomTexte.titre}" assigné au correcteur`, 'success');
        this.loadData();
      },
      error: (error) => {
        this.showToast('Erreur lors de l\'assignation', 'error');
      }
    });
  }

  getCorrecteurLoadPercentage(correcteurId: number): number {
    const maxAssignments = Math.max(...this.correcteurs.map(c => this.getCorrecteurAssignmentsCount(c.id)), 1);
    const currentAssignments = this.getCorrecteurAssignmentsCount(correcteurId);
    return (currentAssignments / maxAssignments) * 100;
  }

  getAverageAssignmentsPerCorrector(): number {
    if (this.correcteurs.length === 0) return 0;
    const totalAssignments = this.correcteurs.reduce((sum, c) => sum + this.getCorrecteurAssignmentsCount(c.id), 0);
    return totalAssignments / this.correcteurs.length;
  }

  async rebalanceAssignments(): Promise<void> {
    // Validation préliminaire
    if (this.correcteurs.length < 2) {
      this.showToast('Il faut au moins 2 correcteurs pour rééquilibrer', 'error');
      return;
    }

    console.log('Début rééquilibrage');
    
    const moyenne = this.getAverageAssignmentsPerCorrector();
    console.log('Moyenne par correcteur:', moyenne);
    
    // Trouver le correcteur le plus chargé et le moins chargé
    const correcteurLePlusCharge = this.correcteurs.reduce((prev, current) => 
      this.getCorrecteurAssignmentsCount(current.id) > this.getCorrecteurAssignmentsCount(prev.id) ? current : prev
    );
    
    const correcteurLeMoinsCharge = this.correcteurs.reduce((prev, current) => 
      this.getCorrecteurAssignmentsCount(current.id) < this.getCorrecteurAssignmentsCount(prev.id) ? current : prev
    );
    
    const chargeMax = this.getCorrecteurAssignmentsCount(correcteurLePlusCharge.id);
    const chargeMin = this.getCorrecteurAssignmentsCount(correcteurLeMoinsCharge.id);
    
    console.log(`Plus chargé: ${correcteurLePlusCharge.prenom} (${chargeMax}), Moins chargé: ${correcteurLeMoinsCharge.prenom} (${chargeMin})`);
    
    if (chargeMax - chargeMin < 2) {
      this.showToast('Les affectations sont déjà équilibrées', 'success');
      return;
    }

    this.showToast('Rééquilibrage des affectations en cours...', 'success');
    
    // Transférer des textes du plus chargé vers le moins chargé
    const textesAssignes = this.getTextsAssignedToCorrector(correcteurLePlusCharge.id);
    const textesEnAttente = textesAssignes.filter(t => t.texte_statut === 'en_attente');
    const nombreATransferer = Math.min(textesEnAttente.length, Math.floor((chargeMax - chargeMin) / 2));
    
    console.log(`Transfert de ${nombreATransferer} textes`);

    if (nombreATransferer === 0) {
      this.showToast('Aucun texte en attente à transférer', 'error');
      return;
    }

    let rebalanceCount = 0;
    let errorCount = 0;
    
    try {
      // Traiter les transferts avec une meilleure gestion d'erreur
      for (let i = 0; i < nombreATransferer && errorCount < 3; i++) {
        const texteAReassigner = textesEnAttente[i];
        
        if (!texteAReassigner || !texteAReassigner.texte_id) {
          console.error('Texte invalide:', texteAReassigner);
          errorCount++;
          continue;
        }
        
        try {
          console.log(`Transfert ${i + 1}/${nombreATransferer}: Texte ID ${texteAReassigner.texte_id}`);
          
          // Désassignation avec timeout
          await Promise.race([
            new Promise((resolve, reject) => {
              this.cp2iApi.unassignCorrector(texteAReassigner.texte_id, correcteurLePlusCharge.id).subscribe({
                next: (response) => {
                  console.log('Désassignation réussie:', response);
                  resolve(true);
                },
                error: (error) => {
                  console.error('Erreur désassignation:', error);
                  reject(error);
                }
              });
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout désassignation')), 10000))
          ]);
          
          // Délai entre désassignation et réassignation
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Réassignation avec timeout
          await Promise.race([
            new Promise((resolve, reject) => {
              this.cp2iApi.assignCorrector(texteAReassigner.texte_id, correcteurLeMoinsCharge.id).subscribe({
                next: (response) => {
                  console.log('Réassignation réussie:', response);
                  resolve(true);
                },
                error: (error) => {
                  console.error('Erreur réassignation:', error);
                  reject(error);
                }
              });
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout réassignation')), 10000))
          ]);
          
          rebalanceCount++;
          console.log(`Texte ${texteAReassigner.texte_id} transféré avec succès (${rebalanceCount}/${nombreATransferer})`);
          
          // Délai entre chaque transfert pour éviter la surcharge
          if (i < nombreATransferer - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          console.error(`Erreur lors du transfert du texte ${texteAReassigner.texte_id}:`, error);
          errorCount++;
          
          // Si c'est une erreur de timeout ou de réseau, on attend plus longtemps
          if ((error as any).message?.includes('Timeout') || (error as any).status === 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (rebalanceCount > 0) {
        this.showToast(`${rebalanceCount} textes transférés pour rééquilibrer`, 'success');
        this.logAdminAction('reequilibrage', `Rééquilibrage: ${rebalanceCount} textes transférés de ${correcteurLePlusCharge.prenom} vers ${correcteurLeMoinsCharge.prenom}`);
      } else {
        this.showToast('Aucun texte n\'a pu être transféré', 'error');
      }
      
      if (errorCount > 0) {
        this.showToast(`${errorCount} erreurs rencontrées pendant le rééquilibrage`, 'error');
      }
      
    } catch (error) {
      console.error('Erreur générale lors du rééquilibrage:', error);
      this.showToast('Erreur lors du rééquilibrage des affectations', 'error');
    } finally {
      // Recharger les données après le rééquilibrage
      console.log('Rechargement des données après rééquilibrage');
      setTimeout(() => {
        this.loadData();
      }, 1000);
    }
  }

  // Méthodes pour la section Notes & Classement
  getParticipantTextsCount(prenom: string, nom: string): number {
    return this.textes.filter(t => 
      t.prenom?.trim() === prenom?.trim() && t.nom?.trim() === nom?.trim()
    ).length;
  }

  getParticipantTexts(prenom: string, nom: string): any[] {
    return this.textes.filter(t => 
      t.prenom?.trim() === prenom?.trim() && t.nom?.trim() === nom?.trim()
    );
  }

  getTextCorrectorsCount(texteId: number): number {
    return this.affectations.filter(a => a.texte_id === texteId).length;
  }

  getTextFinalNote(texteId: number): number | null {
    const texte = this.textes.find(t => t.id === texteId);
    
    // Utiliser directement la note du texte si elle existe
    if (texte && texte.note && texte.note > 0) {
      const noteValue = typeof texte.note === 'string' ? parseFloat(texte.note) : texte.note;
      return Math.round(noteValue * 100) / 100;
    }
    
    return null;
  }

  getTextEvaluations(texteId: number): any[] {
    const texte = this.textes.find(t => t.id === texteId);
    const textAffectations = this.affectations.filter(a => a.texte_id === texteId);
    
    return textAffectations.map(affectation => {
      const correcteur = this.correcteurs.find(c => c.id === affectation.corrector_id);
      
      // Si le texte a une note, l'attribuer à cette évaluation
      let noteEvaluation = null;
      let statutEvaluation = 'en_attente';
      let commentaireEvaluation = null;
      
      if (texte && texte.note && texte.note > 0) {
        noteEvaluation = typeof texte.note === 'string' ? parseFloat(texte.note) : texte.note;
        statutEvaluation = texte.statut || 'accepte';
        commentaireEvaluation = texte.commentaire || null;
      }
      
      return {
        correcteur_id: affectation.corrector_id,
        correcteur_prenom: correcteur?.prenom || 'Correcteur',
        correcteur_nom: correcteur?.nom || 'Inconnu',
        note: noteEvaluation,
        commentaire: commentaireEvaluation,
        statut: statutEvaluation,
        date_evaluation: texte?.updated_at || null
      };
    });
  }

  // Méthodes pour la vue par langue
  getTextsByLanguage(langue: string): any[] {
    return this.textes.filter(texte => 
      texte.langue?.toLowerCase() === langue.toLowerCase() ||
      (langue === 'francais' && texte.langue?.toLowerCase() === 'français')
    );
  }

  getAssignedTextsByLanguage(langue: string): any[] {
    return this.getTextsByLanguage(langue).filter(texte => this.getCorrectorsCount(texte.id) === 3);
  }

  getUnassignedTextsByLanguage(langue: string): any[] {
    return this.getTextsByLanguage(langue).filter(texte => this.getCorrectorsCount(texte.id) < 3);
  }

  getLanguageAssignmentPercentage(langue: string): number {
    const totalTextes = this.getTextsByLanguage(langue).length;
    if (totalTextes === 0) return 0;
    const assignedTextes = this.getAssignedTextsByLanguage(langue).length;
    return Math.round((assignedTextes / totalTextes) * 100);
  }

  openQuickAssignModal(texte: any): void {
    // Pour l'instant, on utilise le premier correcteur disponible
    const availableCorrecteurs = this.getAvailableCorrectorsForText(texte.id);
    if (availableCorrecteurs.length === 0) {
      this.showToast('Aucun correcteur disponible pour ce texte', 'error');
      return;
    }

    // Sélectionner le correcteur le moins chargé
    const correcteurOptimal = availableCorrecteurs.reduce((prev, current) => 
      this.getCorrecteurAssignmentsCount(current.id) < this.getCorrecteurAssignmentsCount(prev.id) ? current : prev
    );

    this.cp2iApi.assignCorrector(texte.id, correcteurOptimal.id).subscribe({
      next: (response) => {
        this.showToast(`Texte assigné à ${correcteurOptimal.prenom} ${correcteurOptimal.nom}`, 'success');
        this.loadData();
      },
      error: (error) => {
        this.showToast('Erreur lors de l\'assignation', 'error');
      }
    });
  }

  autoAssignLanguage(langue: string): void {
    const textesNonAssignes = this.getUnassignedTextsByLanguage(langue);
    
    if (textesNonAssignes.length === 0) {
      this.showToast(`Tous les textes en ${langue} sont déjà assignés`, 'error');
      return;
    }

    // Pas de confirmation, assignation directe

    let assignmentsCount = 0;
    textesNonAssignes.forEach(texte => {
      const availableCorrecteurs = this.getAvailableCorrectorsForText(texte.id);
      
      if (availableCorrecteurs.length > 0) {
        // Sélectionner le correcteur le moins chargé
        const correcteurOptimal = availableCorrecteurs.reduce((prev, current) => 
          this.getCorrecteurAssignmentsCount(current.id) < this.getCorrecteurAssignmentsCount(prev.id) ? current : prev
        );

        this.cp2iApi.assignCorrector(texte.id, correcteurOptimal.id).subscribe({
          next: () => assignmentsCount++,
          error: (error) => console.error('Erreur auto-assignation langue:', error)
        });
      }
    });

    this.showToast(`Assignation automatique en cours pour ${textesNonAssignes.length} textes en ${langue}...`, 'success');
    
    setTimeout(() => {
      this.showToast(`${assignmentsCount} textes en ${langue} assignés automatiquement`, 'success');
      this.loadData();
    }, 2000);
  }
  
  // Méthode pour forcer le recalcul immédiat des notes (bouton manuel)
  forceRefreshNotes() {
    this.showToast('Vérification et recalcul des notes en cours...', 'success');
    
    // Debug: afficher les données des textes
    console.log('Textes avec notes:', this.textes.filter(t => t.note && t.note > 0));
    console.log('Tous les textes:', this.textes);
    
    // 1. Vérifier la cohérence des données
    this.cp2iApi.checkNotesConsistency().subscribe({
      next: (response) => {
        console.log('Vérification cohérence:', response);
        
        // 2. Réparer les données si nécessaire
        if (response.needs_repair) {
          this.cp2iApi.repairNotesData().subscribe({
            next: (repairResponse) => {
              console.log('Réparation:', repairResponse);
              this.showToast('Données réparées avec succès', 'success');
              this.continueRefreshProcess();
            },
            error: (error) => {
              console.error('Erreur réparation:', error);
              this.continueRefreshProcess();
            }
          });
        } else {
          this.continueRefreshProcess();
        }
      },
      error: (error) => {
        console.error('Erreur vérification:', error);
        this.continueRefreshProcess();
      }
    });
  }
  
  private continueRefreshProcess() {
    // 3. Forcer le recalcul des notes
    this.cp2iApi.forceRecalculateNotes().subscribe({
      next: (response) => {
        console.log('Recalcul forcé:', response);
        
        // 4. Recharger toutes les données
        this.loadDetailedEvaluations();
        this.loadDetailedNotesForAllParticipants();
        this.loadData();
        
        setTimeout(() => {
          this.showToast('Notes recalculées et mises à jour avec succès', 'success');
        }, 2000);
      },
      error: (error) => {
        console.error('Erreur recalcul:', error);
        // Fallback: recharger normalement
        this.loadDetailedEvaluations();
        this.loadDetailedNotesForAllParticipants();
        this.loadData();
        
        setTimeout(() => {
          this.showToast('Données rechargées (recalcul partiel)', 'success');
        }, 2000);
      }
    });
  }
  
  // Méthode de débogage pour vérifier les notes d'un participant
  debugParticipantNotes(prenom: string, nom: string): void {
    console.log(`=== DEBUG NOTES POUR ${prenom} ${nom} ===`);
    
    const participantTextes = this.textes.filter(t => 
      t.prenom?.trim() === prenom?.trim() && t.nom?.trim() === nom?.trim()
    );
    
    console.log('Textes trouvés:', participantTextes.length);
    
    participantTextes.forEach((texte, index) => {
      console.log(`Texte ${index + 1}: "${texte.titre}"`);
      console.log('  - Note directe:', texte.note);
      console.log('  - Real evaluations:', texte.real_evaluations);
      console.log('  - Detailed evaluations:', texte.detailed_evaluations);
      console.log('  - Statut:', texte.statut);
    });
    
    const moyenne = this.getParticipantAverageNote(prenom, nom);
    console.log('Note moyenne calculée:', moyenne);
    console.log('=== FIN DEBUG ===');
  }
  
  // Méthode pour exporter les notes des participants
  // Méthode pour obtenir tous les participants uniques (depuis users et textes)
  getAllUniqueParticipants(): any[] {
    const participantsMap = new Map<string, any>();
    
    // Ajouter les participants depuis la liste des utilisateurs
    this.participants.forEach(participant => {
      const key = `${participant.prenom?.trim()}_${participant.nom?.trim()}`;
      participantsMap.set(key, {
        prenom: participant.prenom,
        nom: participant.nom,
        email: participant.email,
        ville: participant.ville,
        telephone: participant.telephone,
        whatsapp: participant.whatsapp,
        source: 'users'
      });
    });
    
    // Ajouter les participants depuis les textes (au cas où ils ne seraient pas dans users)
    this.textes.forEach(texte => {
      const key = `${texte.prenom?.trim()}_${texte.nom?.trim()}`;
      if (!participantsMap.has(key)) {
        // Chercher les infos complètes dans allAccounts
        const fullInfo = this.allAccounts.find(account => 
          account.prenom?.trim() === texte.prenom?.trim() && 
          account.nom?.trim() === texte.nom?.trim()
        );
        
        participantsMap.set(key, {
          prenom: texte.prenom,
          nom: texte.nom,
          email: fullInfo?.email || 'Email non disponible',
          ville: fullInfo?.ville || 'Ville non renseignée',
          telephone: fullInfo?.telephone,
          whatsapp: fullInfo?.whatsapp,
          source: 'textes'
        });
      }
    });
    
    return Array.from(participantsMap.values()).sort((a, b) => 
      `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`)
    );
  }
  
  exportParticipantsNotes() {
    const headers = ['Prénom', 'Nom', 'Email', 'Ville', 'Textes soumis', 'Note moyenne', 'Détail des textes'];
    const rows = this.getAllUniqueParticipants().map(participant => {
      const textes = this.getParticipantTexts(participant.prenom, participant.nom);
      const noteMoyenne = this.getParticipantAverageNote(participant.prenom, participant.nom);
      const detailTextes = textes.map(t => `"${t.titre}" (${this.getTextFinalNote(t.id) || 'N/A'}/20)`).join('; ');
      
      return [
        participant.prenom,
        participant.nom,
        participant.email,
        participant.ville || 'Non renseignée',
        textes.length,
        noteMoyenne ? noteMoyenne.toFixed(2) + '/20' : 'N/A',
        detailTextes || 'Aucun texte'
      ];
    });
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes_participants_cp2i_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    this.showToast('Export des notes réalisé avec succès', 'success');
  }
  
  toggleParticipantDetails(index: number) {
    if (!this.participantDetailsVisible) {
      this.participantDetailsVisible = new Array(this.participantsWithDetailedNotes.length).fill(false);
    }
    this.participantDetailsVisible[index] = !this.participantDetailsVisible[index];
  }
  
  // Sélection équitable des finalistes avec représentation proportionnelle
  selectFinalistes() {
    const textesEvalues = this.textes.filter(t => t.note && t.note > 0 && (t.statut === 'accepte' || t.statut === 'refuse'));
    
    if (textesEvalues.length === 0) {
      this.showToast('Aucun texte évalué disponible pour la sélection', 'error');
      return;
    }

    // Calculer la répartition par langue
    const statsLangues = this.getLanguageStats();
    const totalTextes = textesEvalues.length;
    
    // Répartition proportionnelle des 5 places
    const repartition = {
      francais: Math.round((statsLangues.francais / 100) * this.finalistesSelection.totalFinalistes),
      wolof: Math.round((statsLangues.wolof / 100) * this.finalistesSelection.totalFinalistes),
      anglais: Math.round((statsLangues.anglais / 100) * this.finalistesSelection.totalFinalistes),
      arabe: Math.round((statsLangues.arabe / 100) * this.finalistesSelection.totalFinalistes)
    };

    // Ajuster pour avoir exactement 5 finalistes
    let totalRepartition = Object.values(repartition).reduce((sum, val) => sum + val, 0);
    if (totalRepartition < this.finalistesSelection.totalFinalistes) {
      // Ajouter les places manquantes à la langue la plus représentée
      const langueDominante = Object.keys(repartition).reduce((a, b) => 
        repartition[a as keyof typeof repartition] > repartition[b as keyof typeof repartition] ? a : b
      );
      repartition[langueDominante as keyof typeof repartition] += (this.finalistesSelection.totalFinalistes - totalRepartition);
    } else if (totalRepartition > this.finalistesSelection.totalFinalistes) {
      // Retirer les places en trop de la langue la plus représentée
      const langueDominante = Object.keys(repartition).reduce((a, b) => 
        repartition[a as keyof typeof repartition] > repartition[b as keyof typeof repartition] ? a : b
      );
      repartition[langueDominante as keyof typeof repartition] -= (totalRepartition - this.finalistesSelection.totalFinalistes);
    }

    // Sélectionner les meilleurs textes par langue
    const finalistes: any[] = [];
    
    Object.keys(repartition).forEach(langue => {
      const nbPlaces = repartition[langue as keyof typeof repartition];
      if (nbPlaces > 0) {
        const textesLangue = textesEvalues
          .filter(t => t.langue?.toLowerCase() === langue.toLowerCase() || 
                      (langue === 'francais' && t.langue?.toLowerCase() === 'français'))
          .sort((a, b) => parseFloat(b.note) - parseFloat(a.note))
          .slice(0, nbPlaces);
        
        finalistes.push(...textesLangue.map(t => ({
          ...t,
          langue_selection: langue,
          rang_langue: textesLangue.indexOf(t) + 1
        })));
      }
    });

    // Trier les finalistes par note décroissante
    finalistes.sort((a, b) => parseFloat(b.note) - parseFloat(a.note));

    this.finalistesSelection.finalistes = finalistes;
    this.finalistesSelection.repartitionLangues = repartition;
    this.finalistesSelection.selectionActive = true;
    
    this.showFinalistesModal = true;
    this.logAdminAction('selection_finalistes', `Sélection de ${finalistes.length} finalistes avec répartition proportionnelle`);
  }

  closeFinalistesModal() {
    this.showFinalistesModal = false;
  }


  getCurrentDate(): string {
    return new Date().toLocaleDateString();
  }

  exportFinalistes() {
    if (this.finalistesSelection.finalistes.length === 0) {
      this.showToast('Aucun finaliste sélectionné', 'error');
      return;
    }

    const headers = ['Rang', 'Titre', 'Auteur', 'Langue', 'Note', 'Thème', 'Rang dans la langue', 'Date soumission'];
    const rows = this.finalistesSelection.finalistes.map((finaliste, index) => [
      index + 1,
      finaliste.titre,
      `${finaliste.prenom} ${finaliste.nom}`,
      finaliste.langue,
      finaliste.note + '/20',
      this.getThemeLabel(finaliste.theme),
      finaliste.rang_langue,
      new Date(finaliste.created_at).toLocaleDateString()
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finalistes_cp2i_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    this.showToast('Liste des finalistes exportée avec succès', 'success');
  }

  // Méthodes pour la liste des participants avec soumissions
  getParticipantsWithSubmissionsData(): any[] {
    const participantsMap = new Map<string, any>();
    
    // Créer une map des participants depuis les textes soumis UNIQUEMENT
    this.textes.forEach(texte => {
      const key = `${texte.prenom?.trim()}_${texte.nom?.trim()}`;
      if (!participantsMap.has(key)) {
        // Chercher les infos complètes dans allAccounts ou users
        const fullInfo = this.allAccounts.find(account => 
          account.prenom?.trim() === texte.prenom?.trim() && 
          account.nom?.trim() === texte.nom?.trim()
        ) || this.users.find(user => 
          user.prenom?.trim() === texte.prenom?.trim() && 
          user.nom?.trim() === texte.nom?.trim()
        );
        
        participantsMap.set(key, {
          prenom: texte.prenom,
          nom: texte.nom,
          email: fullInfo?.email || 'Email non disponible',
          telephone: fullInfo?.telephone || '',
          whatsapp: fullInfo?.whatsapp || '',
          ville: fullInfo?.ville || '',
          created_at: fullInfo?.created_at || texte.created_at,
          nb_textes: 0,
          note_moyenne: null
        });
      }
      
      // Compter les textes
      const participant = participantsMap.get(key);
      participant.nb_textes++;
    });
    
    // Calculer les notes moyennes et filtrer seulement ceux qui ont des notes
    const participantsWithNotes = Array.from(participantsMap.values()).filter(participant => {
      const noteMoyenne = this.getParticipantAverageNote(participant.prenom, participant.nom);
      participant.note_moyenne = noteMoyenne;
      // Retourner seulement les participants qui ont soumis ET qui ont des notes
      return participant.nb_textes > 0 && (noteMoyenne !== null && noteMoyenne > 0);
    });
    
    // Trier par note décroissante puis par nom
    return participantsWithNotes.sort((a, b) => {
      if (b.note_moyenne !== a.note_moyenne) {
        return (b.note_moyenne || 0) - (a.note_moyenne || 0);
      }
      return `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`);
    });
  }

  getAverageNoteAllParticipants(): string {
    const participants = this.getParticipantsWithSubmissionsData();
    if (participants.length === 0) return 'N/A';
    
    const totalNotes = participants.reduce((sum, p) => sum + (p.note_moyenne || 0), 0);
    const moyenne = totalNotes / participants.length;
    return moyenne.toFixed(1) + '/20';
  }

  exportParticipantsWithSubmissions() {
    const participants = this.getParticipantsWithSubmissionsData();
    
    if (participants.length === 0) {
      this.showToast('Aucun participant avec soumission et note trouvé', 'error');
      return;
    }

    // Créer un contenu CSV simplifié
    const headers = [
      'Prénom', 
      'Nom', 
      'Téléphone', 
      'Email', 
      'WhatsApp', 
      'Ville'
    ];
    
    const rows = participants.map(participant => [
      participant.prenom || '',
      participant.nom || '',
      participant.telephone || '',
      participant.email || '',
      participant.whatsapp || '',
      participant.ville || ''
    ]);
    
    // Ajouter un en-tête informatif
    const csvHeader = [
      '# LISTE DES PARTICIPANTS CP2i 2026 - COORDONNÉES COMPLÈTES',
      `# Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
      `# Total: ${participants.length} participants avec soumissions et notes`,
      '# ',
      headers.join(';')
    ];
    
    const csvRows = rows.map(row => row.join(';'));
    const csvContent = [...csvHeader, ...csvRows].join('\n');
    
    // Créer le fichier avec BOM pour Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CP2i_2026_Coordonnees_Participants_${new Date().toISOString().split('T')[0]}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // Notification améliorée avec plus de visibilité
    this.showToast(`✓ FICHIER TÉLÉCHARGÉ ! ${participants.length} coordonnées exportées dans vos téléchargements`, 'success');
    
    // Afficher une deuxième notification après 2 secondes
    setTimeout(() => {
      this.showToast(`📁 Fichier: CP2i_2026_Coordonnees_Participants_${new Date().toISOString().split('T')[0]}.csv`, 'success');
    }, 2000);
    
    // Log de l'action
    this.logAdminAction('export_participants', `Export coordonnées de ${participants.length} participants avec soumissions`);
  }
  

  

  


}