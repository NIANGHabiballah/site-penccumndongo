import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
  private mailchimpUrl = 'https://penccumndongo.us18.list-manage.com/subscribe/post-json';
  private listId = 'acddea436a';

  constructor(private http: HttpClient) {}

  // Méthode Mailchimp (JSONP pour éviter CORS)
  subscribeMailchimp(email: string): Observable<any> {
    const url = `${this.mailchimpUrl}?u=YOUR_USER_ID&id=${this.listId}&EMAIL=${email}&c=?`;
    return this.http.jsonp(url, 'c');
  }

  // Méthode alternative avec votre propre API
  subscribeCustom(email: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post('https://penccumndongo.com/newsletter.php', 
      { email }, 
      { headers }
    );
  }
}