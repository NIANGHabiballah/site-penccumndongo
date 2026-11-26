import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Cp2iApiService } from '../../services/cp2i-api.service';

interface Correcteur {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  nb_affectations_actuelles: number;
}

interface LangueStat {
  langue: string;
  total_textes: number;
  textes_sans_affectation: number;
  textes_avec_affectation: number;
}

interface Affectation {
  affectation_id: number;
  texte_id: number;
  corrector_id: number;
  date_affectation: string;
  texte_titre: string;
  texte_langue: string;
  texte_statut: string;
  edition_id: number;
  auteur_nom: string;
  correcteur_nom: string;
  correcteur_email: string;
  a_evalue: number;
}

@Component({
  selector: 'app-auto-affectation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auto-affectation.component.html',
  styleUrls: ['./auto-affectation.component.css']
})
export class AutoAffectationComponent implements OnInit, OnChanges {
  @Input() editionId: number | null = null;
  @Input() correcteurs: any[] = [];
  @Output() affectationDone = new EventEmitter<void>();

  // ── Données ──────────────────────────────────────────────────────────────
  languesDisponibles: LangueStat[] = [];
  affectations: Affectation[] = [];
  filteredAffectations: Affectation[] = [];

  // ── Formulaire auto-affectation ──────────────────────────────────────────
  form = {
    correcteur_id: 0,
    langues: [] as string[],
    nb_textes: 5,
    strategie: 'equilibre' as 'equilibre' | 'aleatoire'
  };

  // ── Filtres liste affectations ────────────────────────────────────────────
  filterCorrecteur = 0;
  filterLangue = '';
  searchTerm = '';

  // ── UI state ──────────────────────────────────────────────────────────────
  loading = false;
  loadingList = false;
  activeTab: 'form' | 'list' = 'form';
  toast: { message: string; type: 'success' | 'error' } | null = null;
  confirmDelete: Affectation | null = null;
  lastResult: { assigned: number; requested: number; available: number; details: any[] } | null = null;

  private get baseUrl(): string { return (this.cp2iApi as any)['baseUrl']; }
  private getHeaders() {
    const token = localStorage.getItem('cp2i_token');
    return { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' };
  }

  constructor(private http: HttpClient, private cp2iApi: Cp2iApiService) {}

  ngOnInit() {
    this.loadPreview();
    this.loadAffectations();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editionId'] && !changes['editionId'].firstChange) {
      this.loadPreview();
      this.loadAffectations();
    }
  }

  // ── Chargement ────────────────────────────────────────────────────────────
  loadPreview() {
    const params = this.editionId ? `?edition_id=${this.editionId}` : '';
    this.http.get<any>(`${this.baseUrl}/cp2i-auto-affectation.php?action=preview${this.editionId ? '&edition_id=' + this.editionId : ''}`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (data) => {
        if (data.success) {
          this.languesDisponibles = data.langues || [];
        }
      },
      error: () => this.showToast('Erreur lors du chargement des données', 'error')
    });
  }

  loadAffectations() {
    this.loadingList = true;
    let url = `${this.baseUrl}/cp2i-auto-affectation.php?action=list`;
    if (this.editionId) url += `&edition_id=${this.editionId}`;
    if (this.filterCorrecteur) url += `&correcteur_id=${this.filterCorrecteur}`;
    if (this.filterLangue) url += `&langue=${encodeURIComponent(this.filterLangue)}`;

    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.loadingList = false;
        if (data.success) {
          this.affectations = data.affectations || [];
          this.applySearch();
        }
      },
      error: () => {
        this.loadingList = false;
        this.showToast('Erreur lors du chargement des affectations', 'error');
      }
    });
  }

  applySearch() {
    if (!this.searchTerm.trim()) {
      this.filteredAffectations = [...this.affectations];
      return;
    }
    const s = this.searchTerm.toLowerCase().trim();
    this.filteredAffectations = this.affectations.filter(a =>
      a.texte_titre?.toLowerCase().includes(s) ||
      a.auteur_nom?.toLowerCase().includes(s) ||
      a.correcteur_nom?.toLowerCase().includes(s) ||
      a.texte_langue?.toLowerCase().includes(s)
    );
  }

  onFilterChange() {
    this.loadAffectations();
  }

  // ── Formulaire ────────────────────────────────────────────────────────────
  toggleLangue(langue: string) {
    const idx = this.form.langues.indexOf(langue);
    if (idx === -1) {
      this.form.langues.push(langue);
    } else {
      this.form.langues.splice(idx, 1);
    }
  }

  isLangueSelected(langue: string): boolean {
    return this.form.langues.includes(langue);
  }

  getTextesDispo(): number {
    return this.languesDisponibles
      .filter(l => this.form.langues.includes(l.langue))
      .reduce((sum, l) => sum + l.textes_sans_affectation, 0);
  }

  canSubmit(): boolean {
    return this.form.correcteur_id > 0 &&
           this.form.langues.length > 0 &&
           this.form.nb_textes >= 1 &&
           !this.loading;
  }

  submitAutoAffectation() {
    if (!this.canSubmit()) return;
    this.loading = true;
    this.lastResult = null;

    const payload = {
      correcteur_id: this.form.correcteur_id,
      langues: this.form.langues,
      nb_textes: this.form.nb_textes,
      strategie: this.form.strategie,
      edition_id: this.editionId
    };

    this.http.post<any>(
      `${this.baseUrl}/cp2i-auto-affectation.php?action=run`,
      payload,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.lastResult = { assigned: res.assigned, requested: res.requested, available: res.available, details: res.details };
          this.showToast(res.message, 'success');
          this.loadPreview();
          this.loadAffectations();
          this.affectationDone.emit();
        } else {
          this.showToast(res.message || 'Aucune affectation réalisée', 'error');
        }
      },
      error: (err) => {
        this.loading = false;
        this.showToast(err.error?.error || 'Erreur lors de l\'affectation automatique', 'error');
      }
    });
  }

  resetForm() {
    this.form = { correcteur_id: 0, langues: [], nb_textes: 5, strategie: 'equilibre' };
    this.lastResult = null;
  }

  // ── Suppression ───────────────────────────────────────────────────────────
  askDelete(affectation: Affectation) {
    if (affectation.a_evalue) {
      this.showToast('Impossible : ce correcteur a déjà évalué ce texte', 'error');
      return;
    }
    this.confirmDelete = affectation;
  }

  cancelDelete() {
    this.confirmDelete = null;
  }

  confirmDeleteAction() {
    if (!this.confirmDelete) return;
    const id = this.confirmDelete.affectation_id;
    this.confirmDelete = null;

    this.http.post<any>(
      `${this.baseUrl}/cp2i-auto-affectation.php?action=delete`,
      { affectation_id: id },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.showToast(res.message, 'success');
          this.loadPreview();
          this.loadAffectations();
          this.affectationDone.emit();
        } else {
          this.showToast(res.error || 'Erreur lors de la suppression', 'error');
        }
      },
      error: (err) => {
        this.showToast(err.error?.error || 'Erreur lors de la suppression', 'error');
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getCorrecteurName(id: number): string {
    const c = this.correcteurs.find(c => c.id === id);
    return c ? `${c.prenom} ${c.nom}` : `Correcteur #${id}`;
  }

  getLangueLabel(langue: string): string {
    const labels: Record<string, string> = {
      francais: 'Français', wolof: 'Wolof', arabe: 'Arabe', anglais: 'Anglais'
    };
    return labels[langue?.toLowerCase()] || langue || 'Inconnue';
  }

  getLangueIcon(langue: string): string {
    const icons: Record<string, string> = {
      francais: '🇫🇷', wolof: '🇸🇳', arabe: '🌙', anglais: '🇬🇧'
    };
    return icons[langue?.toLowerCase()] || '📝';
  }

  getStatutClass(statut: string): string {
    return { en_attente: 'badge-warning', accepte: 'badge-success', refuse: 'badge-danger' }[statut] || 'badge-secondary';
  }

  getStatutLabel(statut: string): string {
    return { en_attente: 'En attente', accepte: 'Admis', refuse: 'Non admis' }[statut] || statut;
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toast = { message, type };
    setTimeout(() => this.toast = null, 4000);
  }

  trackByAffectation(_: number, a: Affectation) { return a.affectation_id; }
}
