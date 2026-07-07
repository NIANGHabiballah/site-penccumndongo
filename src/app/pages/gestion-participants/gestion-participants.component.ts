import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cp2iService, Participant } from '../../services/cp2i.service';

@Component({
  selector: 'app-gestion-participants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-participants.component.html',
  styleUrls: ['./gestion-participants.component.css']
})
export class GestionParticipantsComponent implements OnInit {
  participants: Participant[] = [];
  filteredParticipants: Participant[] = [];
  searchTerm = '';
  selectedStatus = 'tous';
  
  showAddForm = false;
  newParticipant = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    ville: '',
    dateInscription: new Date().toISOString().split('T')[0],
    statut: 'actif' as const
  };

  constructor(private cp2iService: Cp2iService) {}

  ngOnInit() {
    this.chargerParticipants();
  }

  chargerParticipants() {
    this.cp2iService.getParticipants().subscribe(participants => {
      this.participants = participants;
      this.filtrerParticipants();
    });
  }

  filtrerParticipants() {
    this.filteredParticipants = this.participants.filter(participant => {
      const matchSearch = !this.searchTerm || 
        participant.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        participant.prenom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        participant.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchStatus = this.selectedStatus === 'tous' || participant.statut === this.selectedStatus;
      
      return matchSearch && matchStatus;
    });
  }

  onSearchChange() {
    this.filtrerParticipants();
  }

  onStatusChange() {
    this.filtrerParticipants();
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.resetForm();
    }
  }

  ajouterParticipant() {
    if (this.isFormValid()) {
      this.cp2iService.ajouterParticipant(this.newParticipant);
      this.resetForm();
      this.showAddForm = false;
    }
  }

  isFormValid(): boolean {
    return !!(this.newParticipant.nom && 
             this.newParticipant.prenom && 
             this.newParticipant.email && 
             this.newParticipant.telephone);
  }

  resetForm() {
    this.newParticipant = {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      ville: '',
      dateInscription: new Date().toISOString().split('T')[0],
      statut: 'actif'
    };
  }

  changerStatut(participant: Participant, nouveauStatut: 'actif' | 'inactif' | 'suspendu') {
    // Logique pour changer le statut
    console.log(`Changement de statut pour ${participant.nom}: ${nouveauStatut}`);
  }

  voirDetails(participant: Participant) {
    console.log('Voir détails:', participant);
  }

  exporterDonnees() {
    console.log('Export des données participants...');
  }
}