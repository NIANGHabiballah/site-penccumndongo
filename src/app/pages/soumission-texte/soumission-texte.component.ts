import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Cp2iApiService, Texte } from '../../services/cp2i-api.service';

@Component({
  selector: 'app-soumission-texte',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './soumission-texte.component.html',
  styleUrls: ['./soumission-texte.component.css']
})
export class SoumissionTexteComponent implements OnInit {
  texte: Texte = {
    titre: '',
    contenu: '',
    langue: 'francais',
    theme: ''
  };

  isSubmitting = false;
  isEditing = false;
  editingTexteId: number | null = null;

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

  constructor(
    private cp2iApi: Cp2iApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Vérifier si l'utilisateur est connecté
    if (!this.cp2iApi.isAuthenticated()) {
      this.router.navigate(['/cp2i']);
      return;
    }
    
    // Vérifier si c'est une modification
    this.route.queryParams.subscribe(params => {
      if (params['edit']) {
        this.isEditing = true;
        this.editingTexteId = +params['edit'];
        this.loadTexteForEdit(this.editingTexteId);
      } else {
        // Vérifier si l'utilisateur a déjà soumis un texte (seulement pour nouvelle soumission)
        this.checkExistingSubmission();
      }
    });
  }
  
  checkExistingSubmission() {
    this.cp2iApi.getUserTexts().subscribe({
      next: (data) => {
        if (data.textes && data.textes.length > 0) {
          this.showToast('Vous avez déjà soumis un texte pour cette édition.', 'error');
          setTimeout(() => {
            this.router.navigate(['/dashboard-participant']);
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Erreur lors de la vérification:', error);
      }
    });
  }
  
  loadTexteForEdit(texteId: number) {
    this.cp2iApi.getUserTexts().subscribe({
      next: (data) => {
        const texteToEdit = data.textes?.find((t: any) => t.id === texteId);
        if (texteToEdit) {
          this.texte = {
            id: texteToEdit.id,
            titre: texteToEdit.titre,
            contenu: texteToEdit.contenu,
            langue: texteToEdit.langue,
            theme: texteToEdit.theme || ''
          };
        } else {
          this.showToast('Texte non trouvé.', 'error');
          this.router.navigate(['/dashboard-participant']);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement du texte:', error);
        this.showToast('Erreur lors du chargement du texte.', 'error');
        this.router.navigate(['/dashboard-participant']);
      }
    });
  }

  getLineCount(): number {
    return this.texte.contenu.split('\n').filter(line => line.trim().length > 0).length;
  }

  isFormValid(): boolean {
    return !!this.texte.titre && 
           !!this.texte.contenu && 
           !!this.texte.theme &&
           this.getLineCount() <= 40;
  }

  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';

  onSubmit() {
    if (!this.isFormValid()) {
      if (this.getLineCount() > 40) {
        this.showToast('Votre texte dépasse la limite de 40 vers. Veuillez le raccourcir.', 'error');
      } else {
        this.showToast('Veuillez remplir tous les champs obligatoires.', 'error');
      }
      return;
    }

    this.isSubmitting = true;
    
    const apiCall = this.isEditing ? 
      this.cp2iApi.updateText(this.texte) : 
      this.cp2iApi.submitText(this.texte);
    
    apiCall.subscribe({
      next: (response) => {
        const message = this.isEditing ? 
          'Texte modifié avec succès !' : 
          'Texte soumis avec succès ! Vous recevrez une notification une fois évalué.';
        this.showToast(message, 'success');
        
        if (!this.isEditing) {
          this.resetForm();
        }
        
        setTimeout(() => {
          this.router.navigate(['/dashboard-participant']);
        }, 2000);
      },
      error: (error) => {
        const message = this.isEditing ? 
          'Erreur lors de la modification. Veuillez réessayer.' :
          'Erreur lors de la soumission. Veuillez réessayer.';
        this.showToast(error.error?.error || message, 'error');
      },
      complete: () => {
        this.isSubmitting = false;
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

  // Obtenir les thèmes selon la langue sélectionnée
  getThemesForLanguage() {
    return this.themesParLangue[this.texte.langue as keyof typeof this.themesParLangue] || this.themesParLangue.francais;
  }

  // Réinitialiser le thème quand la langue change
  onLangueChange() {
    this.texte.theme = '';
  }

  resetForm() {
    this.texte = {
      titre: '',
      contenu: '',
      langue: 'francais',
      theme: ''
    };
  }
}