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
  private baseUrl = 'https://penccumndongo.com';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredUser();
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
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
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
    return !!localStorage.getItem('cp2i_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  submitText(texte: Texte): Observable<any> {
    return this.http.post(`${this.baseUrl}/cp2i-textes.php`, texte, { headers: this.getHeaders() });
  }

  getUserTexts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-textes.php`, { headers: this.getHeaders() });
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
    return this.http.get(`${this.baseUrl}/cp2i-dashboard.php?action=stats`, { headers: this.getHeaders() });
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-dashboard.php?action=profile`, { headers: this.getHeaders() });
  }

  // Méthodes admin
  getUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cp2i-dashboard.php?action=users`, { headers: this.getHeaders() });
  }

  assignCorrector(participantId: number, correctorId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/cp2i-dashboard.php?action=assign_corrector`, 
      { participant_id: participantId, corrector_id: correctorId }, 
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
}