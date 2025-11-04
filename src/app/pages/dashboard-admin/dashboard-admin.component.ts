import { Component, OnInit, OnDestroy } from '@angular/core';
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
  
  stats: any = {};
  users: any[] = [];
  filteredUsers: any[] = [];
  participants: any[] = [];
  correcteurs: any[] = [];
  affectations: any[] = [];
  textes: any[] = [];
  allAccounts: any[] = [];
  history: any[] = [];
  
  selectedTexte: number = 0;
  selectedCorrector: number = 0;
  selectedTexteForEvaluation: any = null;
  
  // Filtres et recherche
  currentFilter = 'all';
  searchTerm = '';
  
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
  filteredTextes: any[] = [];
  
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
  
  // Gestion des paramètres
  currentSettingsTab = 'concours';
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
  
  settings = {
    start_date: '2025-11-03',
    end_date: '2025-11-23',
    evaluation_deadline: '2025-12-03',
    results_date: '2025-12-10',
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
    languages: {
      francais: true,
      wolof: true,
      arabe: false,
      anglais: false
    },
    notifications: {
      new_registration: true,
      new_submission: true,
      evaluation_completed: true
    },
    password: {
      min_length: 8,
      validity_days: 90,
      require_uppercase: false,
      require_numbers: false,
      require_special: false
    }
  };
  
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

  constructor(
    private cp2iApi: Cp2iApiService,
    private router: Router,
    private http: HttpClient,
    private chatService: ChatSupportService
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
    
    this.currentUser = this.cp2iApi.getCurrentUser();
    if (this.currentUser?.role !== 'admin') {
      this.router.navigate(['/cp2i']);
      return;
    }
    
    // Initialiser les tableaux filtrés
    this.filteredUsers = [];
    this.filteredAccounts = [];
    
    this.loadData();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.chatCheckInterval) {
      clearInterval(this.chatCheckInterval);
    }
  }

  loadData() {
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
    this.http.get(`${this.cp2iApi['baseUrl']}/cp2i-dashboard.php?action=stats`, { headers: this.getHeaders() }).subscribe({
      next: (data: any) => {
        if (data.stats) {
          this.stats = { ...this.stats, ...data.stats };
        }
        if (data.stats_langues) {
          this.stats.stats_langues = data.stats_langues;
        }
      },
      error: (error) => console.error('Erreur stats dashboard:', error)
    });
    
    this.calculateStatsFromTexts();
    
    // Charger tous les utilisateurs
    this.cp2iApi.getUsers().subscribe({
      next: (data) => {
        this.users = data?.users || [];
        this.filteredUsers = [...this.users];
        this.participants = this.users.filter(u => u.role === 'participant');
        this.correcteurs = this.users.filter(u => u.role === 'correcteur');
        this.affectations = data?.affectations || [];
        
        // Générer les stats d'affectation après avoir chargé les données
        setTimeout(() => this.generateAffectationStats(), 100);
      },
      error: (error) => {
        console.error('Erreur utilisateurs:', error);
        this.users = [];
        this.filteredUsers = [];
        this.participants = [];
        this.correcteurs = [];
        this.affectations = [];
      }
    });
    
    // Charger tous les textes avec évaluations
    this.cp2iApi.getAllTexts().subscribe({
      next: (data) => {
        this.textes = data.textes || [];
        // Le champ theme est maintenant supporté par l'API
        this.filteredTextes = [...this.textes];
        this.applyEvaluationFilters();
        
        // Charger les évaluations détaillées pour chaque texte
        this.loadDetailedEvaluations();
        
        this.calculateStatsFromTexts();
        setTimeout(() => {
          this.calculateStatsFromTexts();
          this.generateAffectationStats();
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
    this.cp2iApi.getHistory().subscribe({
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
    
    // Charger les statistiques d'affectation
    this.loadAffectationStats();
    
    // Démarrer la vérification des messages de chat
    this.startChatNotificationCheck();
  }
  
  startChatNotificationCheck() {
    this.checkUnreadChatMessages();
    this.chatCheckInterval = setInterval(() => {
      this.checkUnreadChatMessages();
    }, 30000); // Vérifier toutes les 30 secondes
  }
  
  checkUnreadChatMessages() {
    if (!this.currentUser?.id) return;
    
    this.chatService.getConversations().subscribe({
      next: (conversations) => {
        const unreadConversations = conversations.filter(conv => 
          conv.unread_count > 0
        );
        
        const newCount = unreadConversations.length;
        
        // Ne notifier que si c'est une vraie augmentation (pas au démarrage)
        if (newCount > this.unreadChatMessages && this.unreadChatMessages > 0 && this.currentView !== 'chat-support') {
          this.showToast(`${newCount - this.unreadChatMessages} nouveau(x) message(s) de support`, 'success');
        }
        
        this.unreadChatMessages = newCount;
      },
      error: (error) => {
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
    return this.affectations.filter(a => a.texte_id === texteId).length;
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

  onSearch(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.users];
    
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
    const headers = ['Prénom', 'Nom', 'Email', 'Rôle', 'Téléphone', 'WhatsApp', 'Ville', 'Textes', 'Note moyenne', 'Inscription'];
    const rows = this.filteredUsers.map(user => [
      user.prenom,
      user.nom,
      user.email,
      user.role,
      user.telephone || '',
      user.whatsapp || '',
      user.ville || '',
      user.nb_textes || 0,
      user.note_moyenne || '',
      new Date(user.created_at).toLocaleDateString()
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
    const headers = ['Email', 'Mot de passe', 'Prénom', 'Nom', 'Téléphone', 'WhatsApp', 'Ville', 'Rôle', 'Statut', 'Inscription'];
    const rows = this.filteredAccounts.map(account => [
      account.email,
      account.mot_de_passe_clair || 'Non disponible',
      account.prenom,
      account.nom,
      account.telephone || '',
      account.whatsapp || '',
      account.ville || '',
      account.role,
      account.email_verified ? 'Vérifié' : 'En attente',
      new Date(account.created_at).toLocaleDateString()
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
  
  applyEvaluationFilters() {
    let filtered = [...this.textes];
    
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
    this.cp2iApi.getMessages().subscribe({
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
    
    const messageData = {
      subject: this.messageForm.subject,
      content: this.messageForm.content,
      send_to_all: this.messageForm.sendToAll,
      recipients: this.messageForm.sendToAll ? [] : this.recipients.filter(r => r.selected).map(r => r.id)
    };
    
    console.log('Sending message:', messageData);
    console.log('Using endpoint: cp2i-messages.php');
    
    // Forcer l'utilisation du bon endpoint
    const token = localStorage.getItem('cp2i_token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
    this.http.post(`https://penccumndongo.com/cp2i-messages.php`, messageData, { headers }).subscribe({
      next: (response: any) => {
        const recipients = this.messageForm.sendToAll ? 'tous les utilisateurs' : `${this.getSelectedRecipientsCount()} utilisateurs`;
        this.logAdminAction('envoi_message', `Message envoyé à ${recipients}: "${this.messageForm.subject}"`);
        this.showToast(response.message, 'success');
        this.closeMessageModal();
        this.loadMessages();
      },
      error: (error: any) => {
        this.showToast('Erreur lors de l\'envoi: ' + (error.error?.error || 'Erreur inconnue'), 'error');
      }
    });
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
    // Simuler la sauvegarde des paramètres
    this.showToast('Paramètres sauvegardés avec succès', 'success');
  }
  
  resetSettings() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      // Réinitialiser aux valeurs par défaut
      this.settings = {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        evaluation_deadline: '2025-02-15',
        results_date: '2025-02-28',
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
        languages: {
          francais: true,
          wolof: true,
          arabe: false,
          anglais: false
        },
        notifications: {
          new_registration: true,
          new_submission: true,
          evaluation_completed: true
        },
        password: {
          min_length: 8,
          validity_days: 90,
          require_uppercase: false,
          require_numbers: false,
          require_special: false
        }
      };
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
    this.textes.forEach(texte => {
      this.cp2iApi.getTextCorrections(texte.id).subscribe({
        next: (data) => {
          texte.evaluations = data.corrections || [];
        },
        error: (error) => console.error(`Erreur évaluations texte ${texte.id}:`, error)
      });
    });
  }

  getParticipantAverageNote(prenom: string, nom: string): number | null {
    const participantTextes = this.textes.filter(t => t.prenom === prenom && t.nom === nom);
    
    if (participantTextes.length === 0) return null;
    
    let toutesLesNotes: number[] = [];
    
    participantTextes.forEach(texte => {
      if (texte.evaluations && Array.isArray(texte.evaluations)) {
        const notesEvaluations = texte.evaluations
          .filter((evaluation: any) => evaluation.note && evaluation.note > 0)
          .map((evaluation: any) => parseFloat(evaluation.note));
        toutesLesNotes.push(...notesEvaluations);
      } else if (texte.note && texte.note > 0) {
        toutesLesNotes.push(parseFloat(texte.note));
      }
    });
    
    if (toutesLesNotes.length === 0) return null;
    
    const moyenne = toutesLesNotes.reduce((sum, note) => sum + note, 0) / toutesLesNotes.length;
    return Math.round(moyenne * 10) / 10;
  }
  
  getThemeLabel(theme: string): string {
    const themes = {
      'patriotisme': 'Patriotisme',
      'justice_dignite': 'Justice et dignité',
      'beaute_africaine': 'Beauté Africaine',
      'jeunesse_responsable': 'Jeunesse responsable',
      'emprise_ecrans': 'Sous l\'emprise des écrans'
    };
    return themes[theme as keyof typeof themes] || theme || 'Non spécifié';
  }
  
  loadAffectationStats() {
    this.cp2iApi.getDashboardStats().subscribe({
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
    
    const affectationsStats = this.textes.map(texte => {
      // Utiliser seulement texte_id pour les affectations
      const affectationsTexte = this.affectations.filter(a => a.texte_id === texte.id);
      
      const correcteursNoms = [...new Set(affectationsTexte.map(a => {
        const correcteur = this.correcteurs.find(c => c.id === a.corrector_id);
        return correcteur ? `${correcteur.prenom} ${correcteur.nom}` : null;
      }).filter(nom => nom !== null))].join(', ');
      
      return {
        texte_id: texte.id,
        titre: texte.titre,
        auteur_prenom: texte.prenom,
        auteur_nom: texte.nom,
        correcteurs_noms: correcteursNoms || '',
        nb_correcteurs: affectationsTexte.length
      };
    });
    
    this.stats.textes_affectations = affectationsStats;
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
  
  // Classification par nationalité
  classifyNationality(ville: string, telephone: string): string {
    const villeLC = ville?.toLowerCase() || '';
    const tel = telephone?.replace(/\s/g, '') || '';
    
    // Sénégal
    if (villeLC.includes('sénégal') || villeLC.includes('senegal') || 
        villeLC.includes('dakar') || villeLC.includes('saint-louis') || 
        villeLC.includes('thiès') || villeLC.includes('thies') ||
        villeLC.includes('rufisque') || villeLC.includes('guédiawaye') ||
        villeLC.includes('guediawaye') || villeLC.includes('kolda') ||
        villeLC.includes('mbour') || villeLC.includes('louga') ||
        villeLC.includes('dahra') || villeLC.includes('ugb') ||
        villeLC.includes('malika') || tel.startsWith('+221') ||
        tel.startsWith('221') || /^7\d{8}$/.test(tel)) {
      return 'senegal';
    }
    
    // Côte d'Ivoire
    if (villeLC.includes('côte') || villeLC.includes('daloa') || villeLC.includes('abidjan') ||
        tel.startsWith('+225') || tel.startsWith('225')) {
      return 'cote_ivoire';
    }
    
    // Mali
    if (villeLC.includes('mali') || villeLC.includes('bamako') ||
        tel.startsWith('+223') || tel.startsWith('223')) {
      return 'mali';
    }
    
    // Niger
    if (villeLC.includes('niger') || villeLC.includes('niamey') ||
        tel.startsWith('+227') || tel.startsWith('227')) {
      return 'niger';
    }
    
    // Mauritanie
    if (villeLC.includes('mauritanie') || villeLC.includes('nouakchott') ||
        tel.startsWith('+222') || tel.startsWith('222')) {
      return 'mauritanie';
    }
    
    // Togo
    if (villeLC.includes('togo') || villeLC.includes('lomé') || villeLC.includes('lome') ||
        tel.startsWith('+228') || tel.startsWith('228')) {
      return 'togo';
    }
    
    // Congo (République du Congo)
    if (villeLC.includes('congo') || villeLC.includes('brazzaville') ||
        tel.startsWith('+242') || tel.startsWith('242')) {
      return 'congo';
    }
    
    // RDC (République Démocratique du Congo)
    if (villeLC.includes('rdc') || villeLC.includes('kinshasa') ||
        tel.startsWith('+243') || tel.startsWith('243')) {
      return 'rdc';
    }
    
    // Burkina Faso
    if (villeLC.includes('burkina') || villeLC.includes('ouagadougou') ||
        tel.startsWith('+226') || tel.startsWith('226')) {
      return 'burkina';
    }
    
    // Guinée
    if (villeLC.includes('guinée') || villeLC.includes('guinee') || villeLC.includes('conakry') ||
        tel.startsWith('+224') || tel.startsWith('224')) {
      return 'guinee';
    }
    
    // France
    if (tel.startsWith('+33') || tel.startsWith('33')) {
      return 'france';
    }
    
    return 'autres';
  }
  
  // Statistiques par nationalité
  getNationalityStats() {
    if (this.users.length === 0) return { senegal: 0, cote_ivoire: 0, mali: 0, niger: 0, mauritanie: 0, togo: 0, congo: 0, rdc: 0, burkina: 0, guinee: 0, france: 0, autres: 0 };
    
    const countries = ['senegal', 'cote_ivoire', 'mali', 'niger', 'mauritanie', 'togo', 'congo', 'rdc', 'burkina', 'guinee', 'france', 'autres'];
    const stats: any = {};
    
    countries.forEach(country => {
      const count = this.users.filter(u => this.classifyNationality(u.ville, u.telephone) === country).length;
      stats[country] = Math.round((count / this.users.length) * 100);
    });
    
    return stats;
  }
  
  // Top pays (affiche tous même avec 0%)
  getTopCountries() {
    const stats = this.getNationalityStats();
    const countries = [
      { name: 'Sénégal', flag: '🇸🇳', key: 'senegal', percentage: stats.senegal },
      { name: 'Côte d\'Ivoire', flag: '🇮🇨', key: 'cote_ivoire', percentage: stats.cote_ivoire },
      { name: 'Mali', flag: '🇲🇱', key: 'mali', percentage: stats.mali },
      { name: 'Niger', flag: '🇳🇪', key: 'niger', percentage: stats.niger },
      { name: 'Mauritanie', flag: '🇲🇷', key: 'mauritanie', percentage: stats.mauritanie },
      { name: 'France', flag: '🇫🇷', key: 'france', percentage: stats.france }
    ];
    
    return countries.sort((a, b) => b.percentage - a.percentage);
  }
  
  // Extraction et normalisation des villes
  extractCity(ville: string): string {
    if (!ville) return 'Non spécifiée';
    
    const villeLC = ville.toLowerCase().trim();
    
    // Extraction des villes principales du Sénégal
    if (villeLC.includes('dakar')) return 'Dakar';
    if (villeLC.includes('thiès') || villeLC.includes('thies')) return 'Thiès';
    if (villeLC.includes('saint-louis')) return 'Saint-Louis';
    if (villeLC.includes('kaolack')) return 'Kaolack';
    if (villeLC.includes('ziguinchor')) return 'Ziguinchor';
    if (villeLC.includes('rufisque')) return 'Rufisque';
    if (villeLC.includes('guédiawaye') || villeLC.includes('guediawaye')) return 'Guédiawaye';
    if (villeLC.includes('kolda')) return 'Kolda';
    if (villeLC.includes('mbour')) return 'Mbour';
    if (villeLC.includes('louga')) return 'Louga';
    if (villeLC.includes('ugb')) return 'Saint-Louis'; // UGB = Université Gaston Berger à Saint-Louis
    
    // Villes internationales
    if (villeLC.includes('daloa')) return 'Daloa';
    if (villeLC.includes('abidjan')) return 'Abidjan';
    
    return 'Autres';
  }
  
  // Statistiques des villes
  getCityStats() {
    if (this.users.length === 0) return [];
    
    const cityCount: { [key: string]: number } = {};
    
    this.users.forEach(user => {
      const city = this.extractCity(user.ville);
      cityCount[city] = (cityCount[city] || 0) + 1;
    });
    
    const total = this.users.length;
    const cities = Object.entries(cityCount)
      .map(([city, count]) => ({
        name: city,
        count: count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);
    
    // Garder le top 5 + regrouper le reste dans "Autres"
    const top5 = cities.slice(0, 5);
    const others = cities.slice(5);
    
    if (others.length > 0) {
      const othersCount = others.reduce((sum, city) => sum + city.count, 0);
      const othersPercentage = Math.round((othersCount / total) * 100);
      
      if (othersPercentage > 0) {
        top5.push({
          name: 'Autres',
          count: othersCount,
          percentage: othersPercentage
        });
      }
    }
    
    return top5;
  }
  
  // Classification par région
  extractRegion(ville: string): string {
    if (!ville) return 'Non spécifiée';
    
    const villeLC = ville.toLowerCase().trim();
    
    // Région de Dakar
    if (villeLC.includes('dakar') || villeLC.includes('rufisque') || 
        villeLC.includes('guédiawaye') || villeLC.includes('guediawaye') ||
        villeLC.includes('malika') || villeLC.includes('pikine')) {
      return 'Dakar';
    }
    
    // Région de Thiès
    if (villeLC.includes('thiès') || villeLC.includes('thies') || 
        villeLC.includes('mbour') || villeLC.includes('tivaouane')) {
      return 'Thiès';
    }
    
    // Région de Saint-Louis
    if (villeLC.includes('saint-louis') || villeLC.includes('ugb') ||
        villeLC.includes('ross-béthio') || villeLC.includes('dagana')) {
      return 'Saint-Louis';
    }
    
    // Région de Casamance (Ziguinchor + Sédhiou)
    if (villeLC.includes('ziguinchor') || villeLC.includes('sédhiou') ||
        villeLC.includes('sedhiou') || villeLC.includes('bignona') ||
        villeLC.includes('oussouye')) {
      return 'Casamance';
    }
    
    // Région de Kaolack
    if (villeLC.includes('kaolack') || villeLC.includes('kaffrine') ||
        villeLC.includes('nioro') || villeLC.includes('guinguinéo')) {
      return 'Kaolack';
    }
    
    // Région de Louga
    if (villeLC.includes('louga') || villeLC.includes('dahra') ||
        villeLC.includes('linguère') || villeLC.includes('kebemer')) {
      return 'Louga';
    }
    
    // Région de Kolda
    if (villeLC.includes('kolda') || villeLC.includes('vélingara') ||
        villeLC.includes('médina yoro foulah')) {
      return 'Kolda';
    }
    
    // Région de Tambacounda
    if (villeLC.includes('tambacounda') || villeLC.includes('kédougou') ||
        villeLC.includes('bakel') || villeLC.includes('goudiry')) {
      return 'Tambacounda';
    }
    
    // Région de Fatick
    if (villeLC.includes('fatick') || villeLC.includes('foundiougne') ||
        villeLC.includes('gossas') || villeLC.includes('sokone')) {
      return 'Fatick';
    }
    
    // Région de Diourbel
    if (villeLC.includes('diourbel') || villeLC.includes('touba') ||
        villeLC.includes('mbacké') || villeLC.includes('bambey')) {
      return 'Diourbel';
    }
    
    // Région de Matam
    if (villeLC.includes('matam') || villeLC.includes('kanel') ||
        villeLC.includes('ranérou') || villeLC.includes('ourossogui')) {
      return 'Matam';
    }
    
    return 'Autres';
  }
  
  // Statistiques des régions
  getRegionStats() {
    if (this.users.length === 0) return [];
    
    const regionCount: { [key: string]: number } = {};
    
    this.users.forEach(user => {
      const region = this.extractRegion(user.ville);
      regionCount[region] = (regionCount[region] || 0) + 1;
    });
    
    const total = this.users.length;
    const regions = Object.entries(regionCount)
      .map(([region, count]) => ({
        name: region,
        count: count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);
    
    return regions.slice(0, 6);
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
    // Calculer la note moyenne pour chaque participant
    const participantsAvecNotes = this.participants.map(participant => {
      const noteMoyenne = this.getParticipantAverageNote(participant.prenom, participant.nom);
      const nbTextes = this.textes.filter(t => t.prenom === participant.prenom && t.nom === participant.nom).length;
      
      return {
        ...participant,
        note_moyenne: noteMoyenne,
        nb_textes: nbTextes
      };
    });
    
    // Trier par note moyenne décroissante, puis par nombre de textes
    return participantsAvecNotes
      .sort((a, b) => {
        // D'abord par note moyenne (décroissant)
        if (a.note_moyenne && b.note_moyenne) {
          return b.note_moyenne - a.note_moyenne;
        }
        if (a.note_moyenne && !b.note_moyenne) return -1;
        if (!a.note_moyenne && b.note_moyenne) return 1;
        
        // Ensuite par nombre de textes (décroissant)
        return b.nb_textes - a.nb_textes;
      })
      .slice(0, 5);
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
    }).filter(c => c.assignes > 0).sort((a, b) => b.completion - a.completion);
  }
  
  // Statistiques de délais
  getAverageCorrectionTime(): string {
    const textesCorrigés = this.textes.filter(t => t.statut === 'accepte' || t.statut === 'refuse');
    if (textesCorrigés.length === 0) return '0';
    
    const totalDays = textesCorrigés.reduce((sum, texte) => {
      const soumission = new Date(texte.created_at);
      const correction = new Date(texte.updated_at || texte.created_at);
      const diffDays = Math.ceil((correction.getTime() - soumission.getTime()) / (1000 * 60 * 60 * 24));
      return sum + Math.max(0, diffDays);
    }, 0);
    
    return Math.round(totalDays / textesCorrigés.length).toString();
  }
  
  getOverdueTexts(): number {
    const delaiMax = 7;
    return this.textes.filter(t => {
      if (t.statut !== 'en_attente') return false;
      const soumission = new Date(t.created_at);
      const maintenant = new Date();
      const diffDays = Math.ceil((maintenant.getTime() - soumission.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > delaiMax;
    }).length;
  }
  
  getFastestCorrector(): string {
    const performance = this.getCorrectorPerformance();
    if (performance.length === 0) return 'Aucun';
    const fastest = performance.reduce((prev, current) => current.completion > prev.completion ? current : prev);
    return fastest.nom.split(' ')[0];
  }
  
  // Statistiques d'engagement
  getMultiTextParticipants(): number {
    const participantTextes = new Map<string, number>();
    this.textes.forEach(texte => {
      const key = `${texte.prenom}_${texte.nom}`;
      participantTextes.set(key, (participantTextes.get(key) || 0) + 1);
    });
    return Array.from(participantTextes.values()).filter(count => count > 1).length;
  }
  
  getMultiTextPercentage(): number {
    const total = this.participants.length;
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
    const regions = new Set(this.users.map(u => this.extractRegion(u.ville)));
    regions.delete('Non spécifiée'); regions.delete('Autres');
    return regions.size;
  }
  
  getUniqueCountriesCount(): number {
    const countries = new Set(this.users.map(u => this.classifyNationality(u.ville, u.telephone)));
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
    return this.getCorrectorPerformance().filter(c => c.completion < 50 && c.assignes > 2).length;
  }
  
  getPeakSubmissionDay(): string {
    const dayStats = this.getDailySubmissions();
    const maxDay = dayStats.reduce((prev, current) => current.count > prev.count ? current : prev);
    return maxDay.name;
  }
  
  private getDaysFromStart(): number {
    const startDate = new Date('2025-11-03');
    const today = new Date();
    return Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  }
  
  private getTotalDays(): number {
    const startDate = new Date('2025-11-03');
    const endDate = new Date('2025-11-23');
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }
}