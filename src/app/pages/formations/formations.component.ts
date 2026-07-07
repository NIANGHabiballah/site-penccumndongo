import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-formations',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './formations.component.html',
  styleUrl: './formations.component.css'
})
export class FormationsComponent implements OnInit {

  showInscriptionModal = false;
  inscriptionForm: FormGroup;
  successMsg = '';
  errorMsg = '';

  showAutreStatut = false;
  showAutreDiplome = false;
  showAutreSource = false;

  currentStep = 1;
  readonly totalSteps = 4;
  readonly stepLabels = ['Module', 'Informations', 'Profil', 'Participation'];

  private readonly stepFields: Record<number, string[]> = {
    1: ['module'],
    2: ['nom', 'sexe', 'trancheAge', 'email', 'telephone', 'ville'],
    3: ['statut', 'diplome'],
    4: ['ancienParticipant', 'newsletter', 'source', 'consentDonnees', 'consentParticipation'],
  };

  isStepValid(step: number): boolean {
    return this.stepFields[step].every(f => this.inscriptionForm.get(f)?.valid);
  }

  nextStep() {
    const fields = this.stepFields[this.currentStep];
    fields.forEach(f => this.inscriptionForm.get(f)?.markAsTouched());
    if (this.isStepValid(this.currentStep)) this.currentStep++;
  }

  prevStep() { this.currentStep--; }

  openDropdown = '';

  @HostListener('document:click')
  onDocumentClick() { this.openDropdown = ''; }

  toggleDropdown(name: string, event: Event) {
    event.stopPropagation();
    this.openDropdown = this.openDropdown === name ? '' : name;
  }

  selectOption(field: string, value: string, event: Event) {
    event.stopPropagation();
    this.inscriptionForm.get(field)?.setValue(value);
    this.inscriptionForm.get(field)?.markAsTouched();
    this.openDropdown = '';
  }


  openFaq: number | null = null;

  faqs = [
    {
      question: 'Le programme est-il gratuit ?',
      answer: 'Oui, PENC\'BOOST est entièrement gratuit. Aucun frais d\'inscription.'
    },
    {
      question: 'Puis-je m\'inscrire à plusieurs modules ?',
      answer: 'Non. Pour cette 2ème édition, chaque participant ne peut s\'inscrire qu\'à un seul module.'
    },
    {
      question: 'Faut-il un niveau particulier pour s\'inscrire ?',
      answer: 'Non, aucun prérequis. Le programme est ouvert à tous — élèves, étudiants, professionnels, entrepreneurs — quel que soit le niveau d\'études.'
    },
    {
      question: 'Comment recevoir le lien Google Meet ?',
      answer: 'Après validation de votre inscription, vous recevrez le lien de connexion par email avant le début de votre module. Pensez à vérifier vos spams.'
    },
    {
      question: 'Peut-on participer depuis n\'importe quel pays ?',
      answer: 'Oui, le programme est 100% en ligne et ouvert à tous les pays de l\'Afrique. Vous pouvez participer depuis n\'importe quel pays, tant que vous avez une connexion internet.'
    },
    {
      question: 'Reçoit-on une attestation ?',
      answer: 'Oui, une attestation de participation est remise à chaque bénéficiaire ayant assisté à la session. Elle sera envoyée par email après la fin du programme.'
    },
    {
      question: 'Que se passe-t-il si mon module est complet ?',
      answer: 'Si le module que vous souhaitez est complet, vous pouvez nous contacter directement via WhatsApp ou par email. Nous vous préviendrons en priorité si une place se libère ou pour la prochaine édition.'
    }
  ];

  toggleFaq(index: number) {
    this.openFaq = this.openFaq === index ? null : index;
  }

  modulesList = [
    { value: 'leadership', label: 'Leadership & Développement Personnel', date: 'Lundi 20 juillet · 18h–20h', inscrits: 0, total: 100, complet: false },
    { value: 'design', label: 'Design Graphique', date: 'Mardi 21 juillet · 18h–20h', inscrits: 0, total: 100, complet: false },
    { value: 'numerique-ia', label: 'Compétences Numériques & IA', date: 'Mercredi 22 juillet · 18h–20h', inscrits: 0, total: 100, complet: false },
    { value: 'marketing', label: 'Marketing Digital', date: 'Jeudi 23 juillet · 18h–20h', inscrits: 0, total: 100, complet: false },
    { value: 'employabilite', label: 'Employabilité, Entrepreneuriat & Insertion Professionnelle', date: 'Vendredi 24 juillet · 16h–18h', inscrits: 0, total: 100, complet: false },
    { value: 'bureautique', label: 'Initiation à la Bureautique & Informatique', date: 'Samedi 25 juillet · 10h–12h', inscrits: 0, total: 100, complet: false },
    { value: 'poesie', label: 'Poésie & Arts Visuels', date: 'Dimanche 26 juillet · 10h–12h', inscrits: 0, total: 100, complet: false },
  ];

constructor(private fb: FormBuilder, private http: HttpClient) {
    this.inscriptionForm = this.fb.group({
      // Section 1
      module: ['', Validators.required],
      // Section 2
      nom: ['', Validators.required],
      sexe: ['', Validators.required],
      trancheAge: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      whatsapp: [''],
      ville: ['', Validators.required],
      // Section 3
      statut: ['', Validators.required],
      autreStatut: [''],
      diplome: ['', Validators.required],
      autreDiplome: [''],
      etablissement: [''],
      domaine: [''],
      // Section 4
      ancienParticipant: ['', Validators.required],
      newsletter: ['', Validators.required],
      source: ['', Validators.required],
      autreSource: [''],
      motivation: [''],
      consentDonnees: [false, Validators.requiredTrue],
      consentParticipation: [false, Validators.requiredTrue],
    });
  }

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.loadPlaces();
  }

  loadPlaces() {
    this.http.get<{ success: boolean; data: Record<string, number> }>('https://penccumndongo.com/pencboost-places.php')
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.modulesList = this.modulesList.map(m => {
              const inscrits = res.data[m.value] ?? 0;
              return { ...m, inscrits, complet: inscrits >= m.total };
            });
          }
        },
        error: () => {} // silencieux, les valeurs par défaut restent
      });
  }

  etablissementSuggestions: string[] = [];

  etablissementsList = [
    // Universités publiques
    'UCAD - Université Cheikh Anta Diop, Dakar',
    'UGB - Université Gaston Berger, Saint-Louis',
    'UADB - Université Alioune Diop, Bambey',
    'UASZ - Université Assane Seck, Ziguinchor',
    'UIDT - Université Iba Der Thiam de Thiès',
    'USSEIN - Université du Sine Saloum El Hâdj Ibrahima Niasse, Kaolack',
    'UAM - Université Amadou Mahtar Mbow, Diamniadio',
    'UN-CHK - Université Numérique Cheikh Hamidou Kane (ex UVS)',
    // Grandes écoles & instituts publics
    'ESP - École Supérieure Polytechnique, Dakar (UCAD)',
    'EPT - École Polytechnique de Thiès',
    'ENEA - École Nationale d\'Économie Appliquée',
    'ENA - École Nationale d\'Administration',
    'ENAMC - École Nationale des Arts et Métiers de la Culture',
    'ESMT - École Supérieure Multinationale des Télécommunications',
    'INSEPS - Institut Supérieur d\'Éducation Populaire et Sportive',
    'FASTEF - Faculté des Sciences et Technologies de l\'Éducation et de la Formation',
    'EBAD - École de Bibliothécaires, Archivistes et Documentalistes',
    'ENAM - École Nationale d\'Administration et de Magistrature',
    'INFTS - Institut National de Formation des Travailleurs Sociaux',
    // Établissements privés reconnus
    'IAM - Institut Africain de Management',
    'ISM - Institut Supérieur de Management',
    'ISTDI - Institut Supérieur de Technologie et de Design Industriel',
    'Sup de Co Dakar',
    'ISI - Institut Supérieur d\'Informatique',
    'DIT - Dakar Institute of Technology',
    'BEM - Higher Institute of Business and Technology',
    'CESAG - Centre Africain d\'Études Supérieures en Gestion',
    'ISCAM - Institut Supérieur de Commerce et d\'Administration',
    'Dakar Bourguiba',
    'Home School',
    // Formation professionnelle
    'CFPT - Centre de Formation Professionnelle et Technique',
    'ONFP - Office National de Formation Professionnelle',
    'Lycée Technique André Peytavin',
    'Lycée Technique Maurice Delafosse',
    // Lycées généraux
    'Lycée Seydou Nourou Tall',
    'Lycée Lamine Guèye',
    'Lycée John F. Kennedy',
    'Lycée Blaise Diagne',
    'Lycée Limamoulaye',
    'Lycée Malick Sy de Thiès',
    'Lycée de Ziguinchor',
    'Lycée Djignabo de Ziguinchor',
    'Lycée Thierno Mamadou Tall',
    'Lycée Demba Diop de Mbour',
    'Autre'
  ];

  onEtablissementInput(event: any) {
    const val = event.target.value.toLowerCase().trim();
    if (val.length === 0) {
      this.etablissementSuggestions = [];
      return;
    }
    this.etablissementSuggestions = this.etablissementsList
      .filter(e => e.toLowerCase().includes(val))
      .slice(0, 6);
  }

  selectEtablissement(value: string) {
    this.inscriptionForm.get('etablissement')?.setValue(value);
    this.etablissementSuggestions = [];
  }

  hideEtablissementSuggestions() {
    setTimeout(() => this.etablissementSuggestions = [], 150);
  }

  onStatutChange(event: any) {
    this.showAutreStatut = event.target.value === 'Autre';
    if (this.showAutreStatut) {
      this.inscriptionForm.get('autreStatut')?.setValidators(Validators.required);
    } else {
      this.inscriptionForm.get('autreStatut')?.clearValidators();
      this.inscriptionForm.get('autreStatut')?.setValue('');
    }
    this.inscriptionForm.get('autreStatut')?.updateValueAndValidity();
  }

  onDiplomeChange(event: any) {
    this.showAutreDiplome = event.target.value === 'Autre';
    if (this.showAutreDiplome) {
      this.inscriptionForm.get('autreDiplome')?.setValidators(Validators.required);
    } else {
      this.inscriptionForm.get('autreDiplome')?.clearValidators();
      this.inscriptionForm.get('autreDiplome')?.setValue('');
    }
    this.inscriptionForm.get('autreDiplome')?.updateValueAndValidity();
  }

  onSourceChange(event: any) {
    this.showAutreSource = event.target.value === 'Autre';
    if (this.showAutreSource) {
      this.inscriptionForm.get('autreSource')?.setValidators(Validators.required);
    } else {
      this.inscriptionForm.get('autreSource')?.clearValidators();
      this.inscriptionForm.get('autreSource')?.setValue('');
    }
    this.inscriptionForm.get('autreSource')?.updateValueAndValidity();
  }

  submitInscription() {
    this.successMsg = '';
    this.errorMsg = '';

    if (this.inscriptionForm.invalid) {
      this.errorMsg = 'Merci de remplir tous les champs obligatoires.';
      this.markAllAsTouched();
      return;
    }

    this.http.post<{ success: boolean; message: string }>('https://penccumndongo.com/inscription-pencboost.php', this.inscriptionForm.value)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.successMsg = res.message;
            this.errorMsg = '';
            this.inscriptionForm.reset();
            setTimeout(() => {
              document.querySelector('.modal-content')?.scrollTo({ top: 0, behavior: 'smooth' });
            }, 50);
          } else {
            this.errorMsg = res.message;
          }
        },
        error: () => {
          this.errorMsg = "Erreur lors de l'envoi. Veuillez réessayer.";
        }
      });
  }

  markAllAsTouched() {
    Object.values(this.inscriptionForm.controls).forEach(c => c.markAsTouched());
  }

  openInscriptionModal() {
    this.showInscriptionModal = true;
    this.openDropdown = '';
    this.currentStep = 1;
    this.successMsg = '';
    this.errorMsg = '';
  }

  closeInscriptionModal() {
    this.showInscriptionModal = false;
    this.successMsg = '';
    this.errorMsg = '';
  }
}
