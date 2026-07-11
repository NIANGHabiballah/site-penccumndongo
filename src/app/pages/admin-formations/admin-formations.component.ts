import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

type Section = 'accueil' | 'pencboost-stats' | 'pencboost-inscrits' | 'pencboost-presences' | 'pencboost-liens' | 'pencboost-rapport' | 'infographie-stats' | 'infographie-inscrits' | 'parametres';

@Component({
  selector: 'app-admin-formations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-formations.component.html',
  styleUrls: ['./admin-formations.component.css']
})
export class AdminFormationsComponent implements OnInit {

  // ── Auth ──────────────────────────────────────────────────────────────────
  authenticated = false;
  loginError = '';
  loginForm = { email: '', password: '' };
  ADMIN_EMAIL    = 'pencc.penccumndongo@gmail.com';
  ADMIN_PASSWORD = 'PencBoostAdmin2026!';
  private readonly ADMIN_KEY = 'PencBoostAdmin2026';

  // ── Navigation ────────────────────────────────────────────────────────────
  section: Section = 'accueil';
  programme: 'pencboost' | 'infographie' | '' = '';

  // ── Données Penc'Boost ────────────────────────────────────────────────────
  pbStats: any = null;
  pbInscrits: any[] = [];
  pbPresences: any[] = [];
  pbModuleFilter = '';
  pbSearch = '';
  pbSortField = 'taux';
  pbSortDir: 'asc' | 'desc' = 'desc';
  pbLoading = false;

  // ── Données Infographie ───────────────────────────────────────────────────
  infInscrits: any[] = [];
  infSearch = '';
  infLoading = false;

  // ── Paramètres / Changement mot de passe ─────────────────────────────────
  pwForm = { current: '', newPw: '', confirm: '' };
  pwError = '';
  pwSuccess = '';

  // ── UI ──────────────────────────────────────────────────────────────────
  sidebarOpen = true;

  // ── Toast ─────────────────────────────────────────────────────────────────
  toastMsg = '';
  toastType: 'success' | 'error' = 'success';
  showToast = false;

  readonly BASE = 'https://penccumndongo.com';
  encodeURIComponent = encodeURIComponent;

  readonly modules = [
    { value: 'leadership',    label: 'Leadership & Développement Personnel', date: 'Lun 20 juil · 18h–20h', icon: 'fa-user-graduate',  color: '#0380C2' },
    { value: 'design',        label: 'Design Graphique',                      date: 'Mar 21 juil · 18h–20h', icon: 'fa-palette',        color: '#8B5CF6' },
    { value: 'numerique-ia',  label: 'Compétences Numériques & IA',           date: 'Mer 22 juil · 18h–20h', icon: 'fa-robot',          color: '#06B6D4' },
    { value: 'marketing',     label: 'Marketing Digital',                     date: 'Jeu 23 juil · 18h–20h', icon: 'fa-bullhorn',       color: '#F59E0B' },
    { value: 'employabilite', label: 'Employabilité & Insertion Pro.',        date: 'Ven 24 juil · 16h–18h', icon: 'fa-briefcase',      color: '#10B981' },
    { value: 'bureautique',   label: 'Bureautique & Informatique',            date: 'Sam 25 juil · 10h–12h', icon: 'fa-desktop',        color: '#EF4444' },
    { value: 'poesie',        label: 'Poésie & Arts Visuels',                 date: 'Dim 26 juil · 10h–12h', icon: 'fa-feather-pointed', color: '#FF7F1A' },
  ];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    const saved = sessionStorage.getItem('admin_formations_auth');
    if (saved === 'true') this.authenticated = true;
    const savedPw = sessionStorage.getItem('admin_formations_pw');
    if (savedPw) this.ADMIN_PASSWORD = savedPw;
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  login() {
    if (this.loginForm.email === this.ADMIN_EMAIL && this.loginForm.password === this.ADMIN_PASSWORD) {
      this.authenticated = true;
      sessionStorage.setItem('admin_formations_auth', 'true');
      this.loginError = '';
    } else {
      this.loginError = 'Email ou mot de passe incorrect.';
    }
  }

  logout() {
    sessionStorage.removeItem('admin_formations_auth');
    this.authenticated = false;
    this.section = 'accueil';
    this.programme = '';
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  choisirProgramme(p: 'pencboost' | 'infographie') {
    this.programme = p;
    this.section = p === 'pencboost' ? 'pencboost-stats' : 'infographie-stats';
    if (p === 'pencboost') this.loadPencboostStats();
    if (p === 'infographie') this.loadInfographieInscrits();
  }

  setSection(s: Section) {
    this.section = s;
    if (s === 'pencboost-stats')     this.loadPencboostStats();
    if (s === 'pencboost-inscrits')  this.loadPencboostInscrits();
    if (s === 'pencboost-presences') this.loadPencboostPresences();
    if (s === 'pencboost-rapport')   { this.loadPencboostStats(); this.loadPencboostInscrits(); }
    if (s === 'infographie-inscrits') this.loadInfographieInscrits();
  }

  // ── Penc'Boost : Stats ────────────────────────────────────────────────────
  loadPencboostStats() {
    this.pbLoading = true;
    this.http.get<any>(`${this.BASE}/presence-pencboost.php?action=stats&admin_key=${this.ADMIN_KEY}`)
      .subscribe({
        next: (res) => { this.pbStats = res; this.pbLoading = false; },
        error: () => { this.pbLoading = false; this.toast('Erreur chargement stats', 'error'); }
      });
  }

  getInscritsPourModule(module: string): number {
    if (!this.pbStats?.inscrits_par_module) return 0;
    const found = this.pbStats.inscrits_par_module.find((m: any) => m.module === module);
    return found ? parseInt(found.inscrits) : 0;
  }

  getPresencesPourModule(module: string): number {
    if (!this.pbStats?.presences_par_module) return 0;
    const found = this.pbStats.presences_par_module.find((m: any) => m.module === module);
    return found ? parseInt(found.total) : 0;
  }

  getTauxPresence(module: string): number {
    const inscrits = this.getInscritsPourModule(module);
    const presences = this.getPresencesPourModule(module);
    if (inscrits === 0) return 0;
    return Math.round((presences / inscrits) * 100);
  }

  getTauxGlobal(): number {
    if (!this.pbStats) return 0;
    const inscrits = this.pbStats.total_inscrits || 0;
    const presences = this.pbStats.total_presences || 0;
    if (inscrits === 0) return 0;
    return Math.round((presences / inscrits) * 100);
  }

  // ── Penc'Boost : Inscrits ─────────────────────────────────────────────────
  loadPencboostInscrits() {
    this.pbLoading = true;
    const params = new URLSearchParams({ action: 'inscrits', admin_key: this.ADMIN_KEY });
    if (this.pbModuleFilter) params.set('module', this.pbModuleFilter);
    if (this.pbSearch) params.set('search', this.pbSearch);

    this.http.get<any>(`${this.BASE}/presence-pencboost.php?${params}`)
      .subscribe({
        next: (res) => { this.pbInscrits = res.inscrits || []; this.pbLoading = false; },
        error: () => { this.pbLoading = false; this.toast('Erreur chargement inscrits', 'error'); }
      });
  }

  // ── Penc'Boost : Présences ────────────────────────────────────────────────
  loadPencboostPresences() {
    this.pbLoading = true;
    const params = new URLSearchParams({ action: 'liste', admin_key: this.ADMIN_KEY });
    if (this.pbModuleFilter) params.set('module', this.pbModuleFilter);
    if (this.pbSearch) params.set('search', this.pbSearch);

    this.http.get<any>(`${this.BASE}/presence-pencboost.php?${params}`)
      .subscribe({
        next: (res) => { this.pbPresences = res.presences || []; this.pbLoading = false; },
        error: () => { this.pbLoading = false; this.toast('Erreur chargement présences', 'error'); }
      });
  }

  // ── Infographie : Inscrits ────────────────────────────────────────────────
  loadInfographieInscrits() {
    this.infLoading = true;
    this.http.get<any>(`${this.BASE}/inscription.php?action=liste`)
      .subscribe({
        next: (res) => { this.infInscrits = res.inscrits || res.data || []; this.infLoading = false; },
        error: () => { this.infLoading = false; }
      });
  }

  // ── Liens de présence ─────────────────────────────────────────────────────
  getLienPresence(module: string): string {
    return `https://penccumndongo.com/presence/${module}`;
  }

  copierLien(module: string) {
    navigator.clipboard.writeText(this.getLienPresence(module)).then(() => {
      this.toast('Lien copié !', 'success');
    });
  }

  // ── Export CSV ────────────────────────────────────────────────────────────
  exportCSV(type: 'inscrits' | 'presences', module = '') {
    const action = type === 'inscrits' ? 'export_inscrits' : 'export_presences';
    const params = new URLSearchParams({ action, admin_key: this.ADMIN_KEY });
    if (module) params.set('module', module);

    this.http.get<any>(`${this.BASE}/presence-pencboost.php?${params}`)
      .subscribe({
        next: (res) => {
          if (!res.data?.length) { this.toast('Aucune donnée à exporter', 'error'); return; }
          const headers = Object.keys(res.data[0]);
          const rows = res.data.map((r: any) => headers.map((h: string) => `"${r[h] ?? ''}"`).join(';'));
          const csv = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `pencboost_${type}_${module || 'tous'}_${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          this.toast(`Export ${type} réussi`, 'success');
        },
        error: () => this.toast('Erreur export', 'error')
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getModuleLabel(value: string): string {
    return this.modules.find(m => m.value === value)?.label ?? value;
  }

  getModuleColor(value: string): string {
    return this.modules.find(m => m.value === value)?.color ?? '#0380C2';
  }

  getWhatsappLink(phone: string): string {
    if (!phone) return '';
    const clean = phone.replace(/[^0-9+]/g, '');
    const num = clean.startsWith('+') ? clean.replace('+', '') : '221' + clean.replace(/^0/, '');
    return `https://wa.me/${num}`;
  }

  // ── Stats inscrits ────────────────────────────────────────────────────────
  getStatCount(field: string, value: string): number {
    return this.pbInscrits.filter(i => i[field] === value).length;
  }

  getTopVilles(): {ville: string, count: number}[] {
    const map: Record<string, number> = {};
    this.pbInscrits.forEach(i => { if (i.ville) map[i.ville] = (map[i.ville] || 0) + 1; });
    return Object.entries(map).map(([ville, count]) => ({ville, count}))
      .sort((a, b) => b.count - a.count).slice(0, 5);
  }

  getTopVillesAll(): {ville: string, count: number}[] {
    const map: Record<string, number> = {};
    this.pbInscrits.forEach(i => { if (i.ville) map[i.ville] = (map[i.ville] || 0) + 1; });
    return Object.entries(map).map(([ville, count]) => ({ville, count}))
      .sort((a, b) => b.count - a.count);
  }

  getStatCountAll(field: string): {value: string, count: number}[] {
    const map: Record<string, number> = {};
    this.pbInscrits.forEach(i => {
      const v = i[field] || 'Non renseigné';
      map[v] = (map[v] || 0) + 1;
    });
    return Object.entries(map).map(([value, count]) => ({value, count}))
      .sort((a, b) => b.count - a.count);
  }

  getPourcentage(count: number): number {
    if (!this.pbInscrits.length) return 0;
    return Math.round((count / this.pbInscrits.length) * 100);
  }

  getModuleInscritsRapport(): {module: any, inscrits: number, presences: number, taux: number}[] {
    return this.modules.map(m => ({
      module: m,
      inscrits: this.getInscritsPourModule(m.value),
      presences: this.getPresencesPourModule(m.value),
      taux: this.getTauxPresence(m.value)
    })).sort((a, b) => b.inscrits - a.inscrits);
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // ── Changement mot de passe ───────────────────────────────────────────────
  changerMotDePasse() {
    this.pwError = '';
    this.pwSuccess = '';
    if (!this.pwForm.current || !this.pwForm.newPw || !this.pwForm.confirm) {
      this.pwError = 'Tous les champs sont obligatoires.'; return;
    }
    if (this.pwForm.current !== this.ADMIN_PASSWORD) {
      this.pwError = 'Mot de passe actuel incorrect.'; return;
    }
    if (this.pwForm.newPw.length < 8) {
      this.pwError = 'Le nouveau mot de passe doit contenir au moins 8 caractères.'; return;
    }
    if (this.pwForm.newPw !== this.pwForm.confirm) {
      this.pwError = 'Les deux mots de passe ne correspondent pas.'; return;
    }
    this.ADMIN_PASSWORD = this.pwForm.newPw;
    sessionStorage.setItem('admin_formations_pw', this.pwForm.newPw);
    this.pwSuccess = 'Mot de passe modifié avec succès !';
    this.pwForm = { current: '', newPw: '', confirm: '' };
  }

  supprimerPresence(id: number) {
    if (!confirm('Supprimer cette présence ? Cette action est irréversible.')) return;
    this.http.delete<any>(`${this.BASE}/presence-pencboost.php?admin_key=${this.ADMIN_KEY}&id=${id}`)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.pbPresences = this.pbPresences.filter(p => p.id !== id);
            this.toast('Présence supprimée', 'success');
          } else {
            this.toast(res.message || 'Erreur suppression', 'error');
          }
        },
        error: () => this.toast('Erreur suppression', 'error')
      });
  }

  toast(msg: string, type: 'success' | 'error') {
    this.toastMsg = msg;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3500);
  }

  get filteredInscrits() {
    if (!this.pbSearch) return this.pbInscrits;
    const s = this.pbSearch.toLowerCase();
    return this.pbInscrits.filter(i => i.nom?.toLowerCase().includes(s) || i.email?.toLowerCase().includes(s));
  }

  get filteredPresences() {
    if (!this.pbSearch) return this.pbPresences;
    const s = this.pbSearch.toLowerCase();
    return this.pbPresences.filter(p => p.nom_prenom?.toLowerCase().includes(s) || p.email?.toLowerCase().includes(s));
  }

  get sortedModules() {
    return [...this.modules].sort((a, b) => {
      let va: number, vb: number;
      if (this.pbSortField === 'inscrits') {
        va = this.getInscritsPourModule(a.value);
        vb = this.getInscritsPourModule(b.value);
      } else if (this.pbSortField === 'presences') {
        va = this.getPresencesPourModule(a.value);
        vb = this.getPresencesPourModule(b.value);
      } else {
        va = this.getTauxPresence(a.value);
        vb = this.getTauxPresence(b.value);
      }
      return this.pbSortDir === 'asc' ? va - vb : vb - va;
    });
  }

  toggleSort(field: string) {
    if (this.pbSortField === field) {
      this.pbSortDir = this.pbSortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.pbSortField = field;
      this.pbSortDir = 'desc';
    }
  }
}
