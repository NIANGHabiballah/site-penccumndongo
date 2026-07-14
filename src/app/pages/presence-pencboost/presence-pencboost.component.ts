import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-presence-pencboost',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './presence-pencboost.component.html',
  styleUrls: ['./presence-pencboost.component.css']
})
export class PresencePencboostComponent implements OnInit {

  form: FormGroup;
  module = '';
  moduleLabel = '';
  moduleDate = '';
  loading = false;
  successMsg = '';
  errorMsg = '';

  readonly modules: Record<string, { label: string; date: string; icon: string }> = {
    'leadership':    { label: 'Leadership & Développement Personnel', date: 'Lundi 20 juillet 2026 · 18h–20h', icon: 'fa-user-graduate' },
    'design':        { label: 'Design Graphique',                      date: 'Mardi 21 juillet 2026 · 19h–21h', icon: 'fa-palette' },
    'numerique-ia':  { label: 'Compétences Numériques & IA',           date: 'Mercredi 22 juillet 2026 · 18h–20h', icon: 'fa-robot' },
    'marketing':     { label: 'Marketing Digital',                     date: 'Jeudi 23 juillet 2026 · 18h–20h', icon: 'fa-bullhorn' },
    'employabilite': { label: 'Employabilité & Insertion Pro.',        date: 'Vendredi 24 juillet 2026 · 16h–18h', icon: 'fa-briefcase' },
    'bureautique':   { label: 'Bureautique & Informatique',            date: 'Samedi 25 juillet 2026 · 10h–12h', icon: 'fa-desktop' },
    'poesie':        { label: 'Poésie & Arts Visuels',                 date: 'Dimanche 26 juillet 2026 · 10h–12h', icon: 'fa-feather-pointed' },
  };

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      nom_prenom:       ['', [Validators.required, Validators.minLength(3)]],
      email:            ['', [Validators.required, Validators.email]],
      telephone:        ['', Validators.required],
      heure_arrivee:    ['', Validators.required],
      statut_presence:  ['present', Validators.required],
      note:             [0],
      observations:     [''],
      suggestions:      ['']
    });
  }

  ngOnInit() {
    this.module = this.route.snapshot.paramMap.get('module') ?? '';
    const info = this.modules[this.module];
    if (info) {
      this.moduleLabel = info.label;
      this.moduleDate  = info.date;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get moduleIcon(): string {
    return this.modules[this.module]?.icon ?? 'fa-graduation-cap';
  }

  get moduleValide(): boolean {
    return !!this.modules[this.module];
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

    const payload = { ...this.form.value, module: this.module };

    this.http.post<{ success: boolean; message: string }>(
      'https://penccumndongo.com/presence-pencboost.php?action=enregistrer',
      payload
    ).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.successMsg = res.message;
          this.form.reset({ statut_presence: 'present' });
        } else {
          this.errorMsg = res.message;
          setTimeout(() => {
            document.getElementById('error-submit')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 50);
        }
      },
      error: () => {
        this.loading = false;
        this.errorMsg = "Erreur de connexion. Vérifiez votre réseau et réessayez.";
        setTimeout(() => {
          document.getElementById('error-submit')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
      }
    });
  }

  heureActuelle(): string {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  }

  remplirHeure() {
    this.form.get('heure_arrivee')?.setValue(this.heureActuelle());
  }
}
