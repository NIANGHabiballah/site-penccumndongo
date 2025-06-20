import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = 'http://localhost:8000/contact';

  constructor() {}

  sendContactForm(contactData: any): Observable<any> {
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData)
    };

    return from(fetch(this.apiUrl, requestOptions).then(response => response.json()));
  }
}