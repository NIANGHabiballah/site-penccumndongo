import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FallbackService {
  
  // Données de fallback pour les messages
  getFallbackMessages(): Observable<any> {
    return of({
      success: true,
      messages: []
    });
  }
  
  // Données de fallback pour le compteur de messages non lus
  getFallbackUnreadCount(): Observable<any> {
    return of({
      success: true,
      count: 0
    });
  }
  
  // Données de fallback pour les évaluations
  getFallbackEvaluations(): Observable<any> {
    return of({
      success: true,
      evaluations: []
    });
  }
  
  // Données de fallback pour le profil
  getFallbackProfile(): Observable<any> {
    return of({
      success: true,
      user: {
        nom: 'Utilisateur',
        prenom: 'Test',
        email: 'test@example.com'
      }
    });
  }
}