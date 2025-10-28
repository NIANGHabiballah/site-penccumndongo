import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface ChatMessage {
  id?: number;
  conversation_id: number;
  sender_id: number;
  sender_type: 'participant' | 'admin';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ChatConversation {
  id?: number;
  participant_id: number;
  admin_id?: number;
  status: 'open' | 'assigned' | 'closed';
  priority: 'low' | 'medium' | 'high';
  subject: string;
  created_at: string;
  updated_at: string;
  unread_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatSupportService {
  private baseUrl = 'https://penccumndongo.com';
  private conversationsSubject = new BehaviorSubject<ChatConversation[]>([]);
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public conversations$ = this.conversationsSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient, private apiService: ApiService) {
    // Polling pour les nouveaux messages toutes les 5 secondes
    interval(5000).subscribe(() => {
      this.checkNewMessages();
    });
  }

  // Créer une nouvelle conversation
  createConversation(subject: string, initialMessage: string): Observable<any> {
    const token = localStorage.getItem('cp2i_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.post(`${this.baseUrl}/chat-support.php?action=create`, {
      subject,
      message: initialMessage
    }, { headers });
  }

  // Obtenir toutes les conversations
  getConversations(): Observable<ChatConversation[]> {
    const token = localStorage.getItem('cp2i_token');
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    return this.http.get<ChatConversation[]>(`${this.baseUrl}/chat-support.php?action=conversations`, 
      { headers });
  }

  // Obtenir les messages d'une conversation
  getMessages(conversationId: number): Observable<ChatMessage[]> {
    const token = localStorage.getItem('cp2i_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/chat-support.php?action=messages&conversation_id=${conversationId}`, 
      { headers });
  }

  // Envoyer un message
  sendMessage(conversationId: number, message: string): Observable<any> {
    const token = localStorage.getItem('cp2i_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.post(`${this.baseUrl}/chat-support.php?action=send`, {
      conversation_id: conversationId,
      message
    }, { headers });
  }

  // Marquer les messages comme lus
  markAsRead(conversationId: number): Observable<any> {
    const token = localStorage.getItem('cp2i_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.post(`${this.baseUrl}/chat-support.php?action=mark_read`, {
      conversation_id: conversationId
    }, { headers });
  }

  // Assigner une conversation à un admin
  assignConversation(conversationId: number, adminId: number): Observable<any> {
    const token = localStorage.getItem('cp2i_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.post(`${this.baseUrl}/chat-support.php?action=assign`, {
      conversation_id: conversationId,
      admin_id: adminId
    }, { headers });
  }

  // Fermer une conversation
  closeConversation(conversationId: number): Observable<any> {
    const token = localStorage.getItem('cp2i_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.post(`${this.baseUrl}/chat-support.php?action=close`, {
      conversation_id: conversationId
    }, { headers });
  }

  // Changer la priorité
  setPriority(conversationId: number, priority: string): Observable<any> {
    const token = localStorage.getItem('cp2i_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.post(`${this.baseUrl}/chat-support.php?action=priority`, {
      conversation_id: conversationId,
      priority
    }, { headers });
  }

  // Obtenir le nombre de messages non lus
  getUnreadCount(): Observable<number> {
    const token = localStorage.getItem('cp2i_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    return this.http.get<{count: number}>(`${this.baseUrl}/chat-support.php?action=unread_count`, 
      { headers }).pipe(
        map(result => result.count)
      );
  }

  // Vérifier les nouveaux messages
  private checkNewMessages(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      this.getUnreadCount().subscribe(count => {
        this.unreadCountSubject.next(count);
      });
    }
  }

  // Obtenir les statistiques du support
  getSupportStats(): Observable<any> {
    const token = localStorage.getItem('cp2i_token');
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    return this.http.get(`${this.baseUrl}/chat-support.php?action=stats`, 
      { headers });
  }
}