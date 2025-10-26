import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://penccumndongo.com/src/app/back-end';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  // Authentification
  register(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth.php?action=register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth.php?action=login`, credentials);
  }

  // Textes
  soumettreTexte(texte: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/textes.php`, texte, { headers: this.getHeaders() });
  }

  getTextes(): Observable<any> {
    return this.http.get(`${this.baseUrl}/textes.php`, { headers: this.getHeaders() });
  }

  // Corrections
  corrigerTexte(correction: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/corrections.php`, correction, { headers: this.getHeaders() });
  }

  getCorrections(): Observable<any> {
    return this.http.get(`${this.baseUrl}/corrections.php`, { headers: this.getHeaders() });
  }

  // Messages
  envoyerMessage(message: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/messages.php`, message, { headers: this.getHeaders() });
  }

  getMessages(): Observable<any> {
    return this.http.get(`${this.baseUrl}/messages.php`, { headers: this.getHeaders() });
  }

  // Statistiques
  getStatistiques(): Observable<any> {
    return this.http.get(`${this.baseUrl}/stats.php`, { headers: this.getHeaders() });
  }

  // Chatbot
  getChatbotConfig(): Observable<any> {
    return this.http.get(`${this.baseUrl}/chatbot.php?action=config`, { headers: this.getHeaders() });
  }

  saveChatbotConfig(config: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/chatbot.php?action=config`, config, { headers: this.getHeaders() });
  }

  getChatbotFAQ(): Observable<any> {
    return this.http.get(`${this.baseUrl}/chatbot.php?action=faq`, { headers: this.getHeaders() });
  }

  addChatbotFAQ(faq: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/chatbot.php?action=faq`, faq, { headers: this.getHeaders() });
  }

  deleteChatbotFAQ(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/chatbot.php?action=faq&id=${id}`, { headers: this.getHeaders() });
  }

  getChatbotConversations(): Observable<any> {
    return this.http.get(`${this.baseUrl}/chatbot.php?action=conversations`, { headers: this.getHeaders() });
  }

  getChatbotStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/chatbot.php?action=stats`, { headers: this.getHeaders() });
  }

  // Messagerie
  getConversations(): Observable<any> {
    return this.http.get(`${this.baseUrl}/messagerie.php?action=conversations`, { headers: this.getHeaders() });
  }

  envoyerMessagePrive(message: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/messagerie.php?action=send`, message, { headers: this.getHeaders() });
  }

  envoyerMessageGroupe(message: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/messagerie.php?action=broadcast`, message, { headers: this.getHeaders() });
  }

  getMessageTemplates(): Observable<any> {
    return this.http.get(`${this.baseUrl}/messagerie.php?action=templates`, { headers: this.getHeaders() });
  }

  // Règlements
  getReglementsCourants(): Observable<any> {
    return this.http.get(`${this.baseUrl}/reglements.php?action=current`);
  }

  updateReglements(reglements: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/reglements.php`, reglements, { headers: this.getHeaders() });
  }
}