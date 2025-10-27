import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Cp2iApiService, User } from '../../services/cp2i-api.service';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
  
  // Gestion des messages
  messages: any[] = [];
  recipients: any[] = [];
  filteredRecipients: any[] = [];
  recipientFilter = 'all';
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
  selectedUser: any = null;
  userForm: any = {
    prenom: '',
    nom: '',
    email: '',
    role: 'participant',
    telephone: '',
    password: ''
  };
  
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private cp2iApi: Cp2iApiService,
    private router: Router,
    private http: HttpClient
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
    
    this.calculateStatsFromTexts();
    
    // Charger tous les utilisateurs
    this.cp2iApi.getUsers().subscribe({
      next: (data) => {
        this.users = data?.users || [];
        this.filteredUsers = [...this.users];
        this.participants = this.users.filter(u => u.role === 'participant');
        this.correcteurs = this.users.filter(u => u.role === 'correcteur');
        this.affectations = data?.affectations || [];
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
        this.filteredTextes = [...this.textes];
        this.applyEvaluationFilters();
        
        // Charger les évaluations détaillées pour chaque texte
        this.loadDetailedEvaluations();
        
        this.calculateStatsFromTexts();
        setTimeout(() => this.calculateStatsFromTexts(), 500);
      },
      error: (error) => console.error('Erreur textes:', error)
    });
    
    // Charger tous les comptes avec mots de passe
    this.cp2iApi.getAllAccounts().subscribe({
      next: (data) => {
        this.allAccounts = data.accounts || [];
        this.filteredAccounts = [...this.allAccounts];
        console.log('Comptes chargés:', this.allAccounts.length);
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
  }

  assignCorrector() {
    if (!this.selectedTexte || !this.selectedCorrector) {
      this.showToast('Veuillez sélectionner un texte et un correcteur', 'error');
      return;
    }
    
    this.cp2iApi.assignCorrector(this.selectedTexte, this.selectedCorrector).subscribe({
      next: (response) => {
        this.showToast('Correcteur affecté avec succès!', 'success');
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
    // Chercher dans les données d'affectation par texte
    const texteAffectation = this.stats.textes_affectations?.find((ta: any) => ta.texte_id === texteId);
    return texteAffectation?.correcteurs_noms || 'Aucun';
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
    const phoneRegex = /^[0-9+\-\s()]{8,15}$/;
    
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
    
    if (!phoneRegex.test(this.userForm.telephone)) {
      this.showToast('Veuillez entrer un numéro de téléphone valide', 'error');
      return false;
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
    const headers = ['Prénom', 'Nom', 'Email', 'Rôle', 'Téléphone', 'Textes', 'Note moyenne', 'Inscription'];
    const rows = this.filteredUsers.map(user => [
      user.prenom,
      user.nom,
      user.email,
      user.role,
      user.telephone || '',
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
    const headers = ['Email', 'Mot de passe', 'Prénom', 'Nom', 'Rôle', 'Statut', 'Inscription'];
    const rows = this.filteredAccounts.map(account => [
      account.email,
      account.mot_de_passe_clair || 'Non disponible',
      account.prenom,
      account.nom,
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
    // Ouvrir modal de visualisation
    this.showToast(`Visualisation du texte: ${texte.titre}`, 'success');
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
    this.cp2iApi.getEvaluationHistory(texte.id).subscribe({
      next: (data) => {
        console.log('Historique:', data.history);
        this.showToast(`Historique chargé pour: ${texte.titre}`, 'success');
      },
      error: (error) => {
        this.showToast('Erreur lors du chargement de l\'historique', 'error');
      }
    });
  }
  
  reassignTexte(texte: any) {
    this.showToast(`Réassignation du texte: ${texte.titre}`, 'success');
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
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      this.cp2iApi.deleteMessage(message.id).subscribe({
        next: (response) => {
          this.showToast('Message supprimé', 'success');
          this.loadMessages();
        },
        error: (error) => {
          this.showToast('Erreur lors de la suppression', 'error');
        }
      });
    }
  }
  
  getTotalRecipients(): number {
    return this.messages.reduce((total, msg) => total + (msg.total_recipients || 0), 0);
  }
  
  getTotalReads(): number {
    return this.messages.reduce((total, msg) => total + parseInt(msg.read_count || 0), 0);
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
      
      console.log('📊 Note moyenne calculée:', noteMoyenne, 'depuis', notesValides.length, 'notes:', notesValides);
    }
  }
  
  getNoteMoyenne(): string {
    if (this.stats.note_moyenne !== null && this.stats.note_moyenne !== undefined && this.stats.note_moyenne > 0) {
      return this.stats.note_moyenne.toFixed(1) + '/20';
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
}