import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';
import { FallbackService } from './fallback.service';

export interface ParticipantMessage {
  id: number;
  subject: string;
  content: string;
  created_at: string;
  send_to_all: boolean;
  read_at: string | null;
  sender_nom: string;
  sender_prenom: string;
  is_read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ParticipantMessagesService {
  private baseUrl = environment.apiUrl;
  private messagesSubject = new BehaviorSubject<ParticipantMessage[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public messages$ = this.messagesSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient, private fallbackService: FallbackService) {
    // Polling pour vérifier les nouveaux messages toutes les 30 secondes
    interval(30000).subscribe(() => {
      this.checkForNewMessages();
    });
  }

  private getHeaders() {
    const token = localStorage.getItem('cp2i_token');
    return { 'Authorization': `Bearer ${token}` };
  }

  // Récupérer tous les messages du participant
  getMessages(): Observable<ParticipantMessage[]> {
    const headers = this.getHeaders();
    const url = `${this.baseUrl}/participant-messages.php?action=messages`;
      
    return this.http.get<{success: boolean, messages: ParticipantMessage[]}>(url, { headers })
      .pipe(
        map(response => {
          if (response.success && response.messages) {
            this.messagesSubject.next(response.messages);
            return response.messages;
          }
          return [];
        }),
        catchError(error => {
          console.error('Erreur récupération messages:', error);
          return of([]);
        })
      );
  }

  // Récupérer le nombre de messages non lus
  getUnreadCount(): Observable<number> {
    const headers = this.getHeaders();
    return this.http.get<{success: boolean, count: number}>
      (`${this.baseUrl}/participant-messages.php?action=unread_count`, { headers })
      .pipe(
        map(response => {
          if (response.success) {
            this.unreadCountSubject.next(response.count);
            return response.count;
          }
          return 0;
        }),
        catchError(error => {
          console.error('Erreur lors de la récupération du nombre de messages non lus:', error);
          return this.fallbackService.getFallbackUnreadCount().pipe(
            map(response => response.count)
          );
        })
      );
  }

  // Récupérer un message spécifique
  getMessage(id: number): Observable<ParticipantMessage | null> {
    const headers = this.getHeaders();
    return this.http.get<{success: boolean, message: ParticipantMessage}>
      (`${this.baseUrl}/participant-messages.php?action=message&id=${id}`, { headers })
      .pipe(
        map(response => response.success ? response.message : null),
        catchError(error => {
          console.error('Erreur récupération message:', error);
          return of(null);
        })
      );
  }

  // Marquer un message comme lu
  markAsRead(messageId: number): Observable<boolean> {
    const headers = this.getHeaders();
    return this.http.post<{success: boolean}>
      (`${this.baseUrl}/participant-messages.php?action=mark_read`, 
       { message_id: messageId }, 
       { headers })
      .pipe(
        map(response => {
          if (response.success) {
            const currentMessages = this.messagesSubject.value;
            const updatedMessages = currentMessages.map(msg => 
              msg.id === messageId ? { ...msg, is_read: true, read_at: new Date().toISOString() } : msg
            );
            this.messagesSubject.next(updatedMessages);
            this.updateUnreadCount();
          }
          return response.success;
        }),
        catchError(error => {
          console.error('Erreur marquage lu:', error);
          return of(false);
        })
      );
  }

  // Marquer tous les messages comme lus
  markAllAsRead(): Observable<boolean> {
    const headers = this.getHeaders();
    return this.http.post<{success: boolean}>
      (`${this.baseUrl}/participant-messages.php?action=mark_all_read`, {}, { headers })
      .pipe(
        map(response => {
          if (response.success) {
            const currentMessages = this.messagesSubject.value;
            const updatedMessages = currentMessages.map(msg => 
              ({ ...msg, is_read: true, read_at: new Date().toISOString() })
            );
            this.messagesSubject.next(updatedMessages);
            this.unreadCountSubject.next(0);
          }
          return response.success;
        }),
        catchError(error => {
          console.error('Erreur marquage tous lus:', error);
          return of(false);
        })
      );
  }

  // Vérifier les nouveaux messages (polling)
  private checkForNewMessages(): void {
    const token = localStorage.getItem('cp2i_token');
    if (token) {
      this.getUnreadCount().subscribe();
    }
  }

  // Mettre à jour le compteur de messages non lus
  private updateUnreadCount(): void {
    const currentMessages = this.messagesSubject.value;
    const unreadCount = currentMessages.filter(msg => !msg.is_read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  // Initialiser le service
  initialize(): void {
    this.getMessages().subscribe();
    this.getUnreadCount().subscribe();
  }
}