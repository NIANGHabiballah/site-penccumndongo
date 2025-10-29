import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { catchError, throwError, map } from 'rxjs';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      map((event: any) => {
        if (event instanceof HttpResponse) {
          // Vérifier si la réponse est du HTML au lieu de JSON
          if (typeof event.body === 'string' && event.body.includes('<!doctype html>')) {
            console.error('Réponse HTML reçue au lieu de JSON:', req.url);
            throw new HttpErrorResponse({
              error: 'Réponse HTML inattendue',
              status: 500,
              statusText: 'Server Error',
              url: req.url
            });
          }
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Erreur HTTP interceptée:', error);
        
        if (error.error instanceof ProgressEvent) {
          return throwError(() => new Error('Erreur de connexion réseau'));
        }
        
        if (typeof error.error === 'string' && error.error.includes('<!doctype html>')) {
          return throwError(() => new Error('Erreur serveur: réponse HTML inattendue'));
        }
        
        return throwError(() => error);
      })
    );
  }
}