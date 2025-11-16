import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';


interface FormationModule {
  icon: string;
  title: string;
  description: string;
  duration: string;
}

interface Formateur {
  name: string;
  title: string;
  experience: string[];
  image?: string;
}


@Component({
  selector: 'app-formation-infographie',
  imports: [ReactiveFormsModule, CommonModule, RouterModule,],
  templateUrl: './formation-infographie.component.html',
  styleUrl: './formation-infographie.component.css',
   animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('500ms ease-out', style({ transform: 'translateX(0)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})

export class FormationInfographieComponent implements OnInit {
  
  
  ngAfterViewInit(): void {
    // Logique WhatsApp flottant
    const whatsappFloat = document.getElementById('whatsapp-float');
    const whatsappIcon = document.querySelector('.whatsapp-icon');
    const whatsappText = document.getElementById('whatsapp-text');
    const whatsappLink = document.getElementById('whatsapp-link');
    if (whatsappIcon && whatsappFloat && whatsappText && whatsappLink) {
      whatsappIcon.addEventListener('click', (e) => {
        e.preventDefault();
        whatsappFloat.classList.toggle('active');
        if (whatsappFloat.classList.contains('active')) {
          whatsappText.style.display = 'inline-block';
        } else {
          whatsappText.style.display = 'none';
        }
      });
      whatsappText.addEventListener('click', () => {
        window.open(whatsappLink.getAttribute('href')!, '_blank');
      });
    }

    // Affichage initial du texte WhatsApp (optionnel)
    if (whatsappText) whatsappText.style.display = 'none';
  }

  @ViewChild('formSection') formSection!: ElementRef;
  
  inscriptionForm: FormGroup;
  selectedFormat: 'online' | 'presential' = 'online';
  showSuccessMessage = false;
  showErrorMessage = false;
  loading = false;
  userEmail = '';
  currentTestimonial = 0;
  countdown: any = {};
  inscriptionsClosed = false; // Inscriptions clôturées
  showClosedModal = false;
  
  modules: FormationModule[] = [
    {
      icon: '🎨',
      title: 'Design Graphique',
      description: 'Maîtrisez les fondamentaux du design et de la composition visuelle',
      duration: 'Semaine 1'
    },
    {
      icon: '💻',
      title: 'Outils Professionnels',
      description: 'Adobe Creative Suite (Photoshop, Illustrator, Premiere Pro) et Canva Pro',
      duration: 'Semaine 2'
    },
    {
      icon: '📱',
      title: 'Digital & Print',
      description: 'Créez des visuels pour tous supports : réseaux sociaux, web et impression',
      duration: 'Semaine 3'
    },
    {
      icon: '🚀',
      title: 'Projets & Portfolio',
      description: 'Réalisez des projets concrets et construisez votre portfolio professionnel',
      duration: 'Semaine 4'
    }
  ];

  formateur: Formateur = {
    name: 'Mouhamadou Mbaye',
    title: 'Graphiste Senior & Formateur Expert',
    experience: [
      'Graphiste à l\'École des Hautes Études en Sciences (EHES) Dakar',
      'Designer à l\'ONG Galine Africa',
      'Freelancer chez Kajou Sénégal',
      'Formateur en Graphic Design à l\'ISEP de Diamniadio',
      'Intervenant dans les Unités Mobiles de Formation (UMF)'
    ]
  };

  testimonials = [
    {
      name: 'Aly THIAW',
      role: 'Bénéficiaire Penc\'Boost',
      text: 'Je tiens à remercier toute l\'équipe de PENCCUM NDONGO pour la qualité de la formation et l\'accompagnement que vous m\'avez apporté. Cette expérience m\'a permis d\'acquérir de nouvelles compétences et de renforcer ma motivation à réussir dans mon projet professionnel.',
      rating: 5
    },
    {
      name: 'Astou NDONGO',
      role: 'Bénéficiaire Penc\'Boost',
      text: 'Le module sur l\'insertion professionnelle et l\'employabilité m\'a permis de connaître les outils nécessaires pour intégrer le monde professionnel. Il est primordial de se préparer, mettre en place des stratégies et mettre en valeur ses compétences.',
      rating: 5
    },
    {
      name: 'Alioune TOURÉ',
      role: 'Freelance débutant',
      text: 'Avec Penc\'Boost, j\'ai gagné en confiance et en compétences. Cette formation m\'a donné les clés pour démarrer mon parcours en tant que freelance. Je suis très reconnaissant pour cette opportunité.',
      rating: 5
    },
    {
      name: 'Aminata SALL',
      role: 'Bénéficiaire Penc\'Boost',
      text: 'Excellente expérience ! Non seulement j\'ai appris, mais j\'ai aussi pris confiance pour entreprendre par moi-même. Je recommande à 100% !',
      rating: 5
    },
    {
      name: 'Ridwane CHABI YÔ',
      role: 'Étudiant',
      text: 'Durant cette formation, j\'ai eu l\'opportunité de renforcer mes compétences en leadership, création graphique, marketing digital et bien-être au travail. Une véritable expérience d\'apprentissage.',
      rating: 5
    },
    {
      name: 'Saliou SÈNE',
      role: 'Bénéficiaire Penc\'Boost',
      text: 'C\'est une formation très intéressante qui peut pousser les étudiants à se lancer dans l\'entrepreneuriat.',
      rating: 5
    },
    {
      name: 'Ababacar FALL',
      role: 'Bénéficiaire Penc\'Boost',
      text: 'Cette formation a approfondi mes compétences en gestion de projet et en bien-être au travail.',
      rating: 5
    }
  ];

  faqs = [
    {
      question: 'Ai-je besoin de connaissances préalables en design?',
      answer: 'Non, la formation commence par les bases. Seule la motivation est requise!',
      open: false
    },
    {
      question: 'Quel matériel est nécessaire?',
      answer: 'Un ordinateur avec une connexion internet stable. Les logiciels seront fournis avec des guides d\'installation.',
      open: false
    },
    {
      question: 'Y a-t-il un suivi après la formation?',
      answer: 'Oui, vous intégrez la communauté PENCCUM NDONGO avec accès à un groupe d\'entraide et des opportunités professionnelles.',
      open: false
    },
    {
      question: 'Puis-je payer en plusieurs fois?',
      answer: 'Oui, le paiement peut se faire en 2 tranches (online) ou 3 tranches (présentiel).',
      open: false
    }
  ];

      
  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.inscriptionForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(\+221)?[0-9]{9}$/)]],
      format: ['online', Validators.required],
      profession: ['', Validators.required],
      motivation: ['', [Validators.required, Validators.minLength(20)]],
      acceptTerms: [false, Validators.requiredTrue]
    });
  }

  

  ngOnInit(): void {
    this.startCountdown();
    this.startTestimonialRotation();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    }

  startCountdown(): void {
    const deadline = new Date('2025-11-29T23:59:59').getTime();
    
    setInterval(() => {
      const now = new Date().getTime();
      const distance = deadline - now;
      
      this.countdown = {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      };
    }, 1000);
  }

  startTestimonialRotation(): void {
    setInterval(() => {
      this.currentTestimonial = (this.currentTestimonial + 1) % this.testimonials.length;
    }, 5000);
  }

  selectFormat(format: 'online' | 'presential'): void {
    // Pour le moment, seule l'option 'online' est disponible
    if (format === 'online') {
      this.selectedFormat = format;
      this.inscriptionForm.patchValue({ format });
    }
  }

  scrollToForm(): void {
    // Track Facebook Pixel InitiateCheckout event
    if (typeof (window as any).fbq !== 'undefined') {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_name: 'Formation Infographie Cohorte 2',
        content_category: 'Formation',
        value: 30000,
        currency: 'XOF'
      });
    }
    
    this.formSection.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  toggleFaq(index: number): void {
    this.faqs[index].open = !this.faqs[index].open;
  }

  onSubmit(): void {
    // Vérifier si les inscriptions sont clôturées
    if (this.inscriptionsClosed) {
      this.showClosedModal = true;
      return;
    }

    if (this.inscriptionForm.valid) {
      this.loading = true;
      
      const formData = {
        ...this.inscriptionForm.value,
        submittedAt: new Date().toISOString(),
        formationType: 'infographie'
      };

      // Envoyer l'inscription
      this.http.post('https://penccumndongo.com/formation-infographie.php', formData)
        .subscribe({
          next: (response: any) => {
            console.log('Réponse serveur complète:', JSON.stringify(response, null, 2));
            if (response && response.data && response.data.id) {
              console.log('✅ INSCRIPTION CONFIRMÉE - ID:', response.data.id);
            }
            
            // Plus de popup - l'email contient toutes les informations
            
            this.loading = false;
            // Sauvegarder l'email avant de réinitialiser le formulaire
            this.userEmail = this.inscriptionForm.get('email')?.value || '';
            this.showSuccessMessage = true;
            
            // Track Facebook Pixel Lead event
            if (typeof (window as any).fbq !== 'undefined') {
              (window as any).fbq('track', 'Lead', {
                content_name: 'Formation Infographie Cohorte 2',
                content_category: 'Formation',
                value: 30000,
                currency: 'XOF'
              });
            }
            
            this.inscriptionForm.reset();
            setTimeout(() => {
              this.showSuccessMessage = false;
            }, 15000);
          },
          error: (error) => {
            console.error('Erreur inscription:', error);
            this.loading = false;
            this.showErrorMessage = true;
            setTimeout(() => {
              this.showErrorMessage = false;
            }, 5000);
          }
        });
    } else {
      this.markFormGroupTouched(this.inscriptionForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getErrorMessage(field: string): string {
    const control = this.inscriptionForm.get(field);
    if (control?.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (control?.hasError('email')) {
      return 'Email invalide';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Minimum ${minLength} caractères requis`;
    }
    if (control?.hasError('pattern')) {
      return 'Format invalide';
    }
    return '';
  }

  downloadBrochure(): void {
    // Implémenter le téléchargement de la brochure
    window.open('https://penccumndongo.com/Programme_Formation_INFOGRAPHIE.pdf', '_blank');
  }

  closeModal(): void {
    this.showClosedModal = false;
  }

  joinWhatsAppGroup(): void {
    window.open('https://chat.whatsapp.com/DSnk6NSXxLO5qfSKudT5Aw', '_blank');
    this.closeModal();
  }

  contactWhatsApp(): void {
    window.open('https://wa.me/221776290639?text=Bonjour Penccum Ndongo, je souhaite être informé des prochaines sessions de formation en infographie.', '_blank');
    this.closeModal();
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }


  
}
