import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface Texte {
  id?: number;
  titre: string;
  contenu: string;
  langue: string;
  theme: string;
  nb_vers?: number;
  statut?: string;
  note?: number;
  commentaire?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Cp2iApiService {
  private baseUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredUser();
    this.setupActivityListener();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('cp2i_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private loadStoredUser(): void {
    const user = localStorage.getItem('cp2i_user');
    const token = localStorage.getItem('cp2i_token');
    
    if (user && token && this.isAuthenticated()) {
      this.currentUserSubject.next(JSON.parse(user));
    } else if (token || user) {
      // Nettoyer seulement s'il y a des données à nettoyer
      localStorage.removeItem('cp2i_token');
      localStorage.removeItem('cp2i_user');
      this.currentUserSubject.next(null);
    }
  }

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/cp2i-auth.php?action=register`, userData);
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/cp2i-auth.php?action=login`, credentials);
  }

  setAuthData(token: string, user: User): void {
    localStorage.setItem('cp2i_token', token);
    localStorage.setItem('cp2i_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  logout(): void {
    localStorage.removeItem('cp2i_token');
    localStorage.removeItem('cp2i_user');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('cp2i_token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Token valide
      
      if (payload.exp < now) {
        console.log('Token expired, logging out');
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.log('Token validation error:', error);
      this.logout();
      return false;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  submitText(texte: Texte): Observable<any> {
    return this.http.post(`${this.baseUrl}/cp2i-textes.php`, texte, { headers: this.getHeaders() });
  }
  
  updateText(texte: Texte): Observable<any> {
    return this.http.put(`${this.baseUrl}/cp2i-textes.php`, texte, { headers: this.getHeaders() });
  }

  getUserTexts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-textes.php`, { headers: this.getHeaders() });
  }

  // Méthode améliorée pour récupérer les textes avec validation
  getUserTextsValidated(): Observable<any> {
    return this.getUserTexts();
  }

  fixDashboardData(): Observable<any> {
    return this.getUserTexts();
  }

  getAllTexts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-textes.php`, { headers: this.getHeaders() });
  }

  updateTextStatus(id: number, statut: string, note?: number, commentaire?: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/cp2i-textes.php`, 
      { id, statut, note, commentaire }, 
      { headers: this.getHeaders() }
    );
  }

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-admin-stats.php`, { headers: this.getHeaders() });
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-dashboard.php?action=profile`, { headers: this.getHeaders() });
  }

  // Méthodes admin
  getUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-dashboard.php?action=get_users`, { headers: this.getHeaders() });
  }

  assignCorrector(texteId: number, correctorId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/cp2i-dashboard.php?action=assign_corrector`, 
      { texte_id: texteId, corrector_id: correctorId }, 
      { headers: this.getHeaders() }
    );
  }

  getAllAccounts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-accounts.php`, { headers: this.getHeaders() });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/cp2i-password.php`, {
      current_password: currentPassword,
      new_password: newPassword
    }, { headers: this.getHeaders() });
  }

  getHistory(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-history.php`, { headers: this.getHeaders() });
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/cp2i-reset-password.php?action=request`, { email });
  }

  resetPassword(token: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/cp2i-reset-password.php?action=reset`, {
      token, email, password
    });
  }

  updateUser(userId: number, userData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/cp2i-accounts.php`, 
      { id: userId, ...userData }, 
      { headers: this.getHeaders() }
    );
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cp2i-accounts.php?id=${userId}`, 
      { headers: this.getHeaders() }
    );
  }

  // Méthodes d'évaluation
  getEvaluations(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-evaluations.php?action=list`, { headers: this.getHeaders() });
  }

  saveEvaluation(evaluationData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/cp2i-evaluations.php?action=evaluate`, 
      evaluationData, 
      { headers: this.getHeaders() }
    );
  }

  getEvaluationHistory(texteId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-evaluations.php?action=history&texte_id=${texteId}`, 
      { headers: this.getHeaders() }
    );
  }

  reassignTexte(participantId: number, correctorId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/cp2i-evaluations.php?action=reassign`, 
      { participant_id: participantId, corrector_id: correctorId }, 
      { headers: this.getHeaders() }
    );
  }

  sendEvaluationReminders(): Observable<any> {
    return this.http.post(`${this.baseUrl}/cp2i-evaluations.php?action=send_reminders`, 
      {}, 
      { headers: this.getHeaders() }
    );
  }

  // Méthodes de messagerie
  getMessages(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-messages.php`, { headers: this.getHeaders() });
  }

  getRecipients(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-dashboard.php?action=recipients`, { headers: this.getHeaders() });
  }

  sendMessage(messageData: any): Observable<any> {
    console.log('Sending to:', `${this.baseUrl}/cp2i-messages.php`);
    return this.http.post(`${this.baseUrl}/cp2i-messages.php`, 
      messageData, 
      { headers: this.getHeaders() }
    );
  }

  deleteMessage(messageId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/cp2i-dashboard.php?action=delete_message`, 
      { message_id: messageId }, 
      { headers: this.getHeaders() }
    );
  }

  refreshTokenIfNeeded(): void {
    const token = localStorage.getItem('cp2i_token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;
      
      // Renouveler si le token expire dans moins de 30 minutes
      if (timeUntilExpiry < 1800 && timeUntilExpiry > 0) {
        this.refreshToken().subscribe({
          next: (response: any) => {
            if (response.token) {
              localStorage.setItem('cp2i_token', response.token);
            }
          },
          error: () => this.logout()
        });
      }
    } catch (error) {
      this.logout();
    }
  }

  private refreshToken(): Observable<any> {
    return this.http.post(`${this.baseUrl}/cp2i-auth.php?action=refresh`, {}, { headers: this.getHeaders() });
  }

  private setupActivityListener(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        if (this.isAuthenticated()) {
          this.refreshTokenIfNeeded();
        }
      }, { passive: true });
    });
  }

  // Méthodes pour le correcteur
  getCorrecteurTexts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-correcteur.php?action=textes`, { headers: this.getHeaders() });
  }

  getCorrecteurMessages(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-correcteur.php?action=messages`, { headers: this.getHeaders() });
  }

  getCorrecteurHistory(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-correcteur.php?action=history`, { headers: this.getHeaders() });
  }

  getCorrecteurStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-correcteur.php?action=stats`, { headers: this.getHeaders() });
  }

  markMessageAsRead(messageId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/cp2i-messages.php?action=mark_read`, 
      { message_id: messageId }, 
      { headers: this.getHeaders() }
    );
  }

  // Méthodes pour le participant
  getParticipantMessages(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-dashboard.php?action=messages`, { headers: this.getHeaders() });
  }

  getParticipantHistory(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-participant.php?action=history`, { headers: this.getHeaders() });
  }

  getDetailedEvaluations(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-participant.php?action=evaluations`, { headers: this.getHeaders() });
  }

  getTextCorrections(texteId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-evaluation-details.php?texte_id=${texteId}`, { headers: this.getHeaders() });
  }

  getParticipantEvaluations(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-dashboard.php?action=evaluations`, { headers: this.getHeaders() });
  }

  // Validation des données
  validateUserData(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-data-validation.php?action=validate`, { headers: this.getHeaders() });
  }

  cleanInconsistentData(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-data-validation.php?action=clean&admin=true`, { headers: this.getHeaders() });
  }

  // Méthode pour récupérer le classement réel
  getClassement(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-classement.php`, { headers: this.getHeaders() });
  }

  deleteTexte(texteId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cp2i-textes.php?id=${texteId}`, { headers: this.getHeaders() });
  }
}