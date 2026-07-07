import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { Cp2iApiService } from '../services/cp2i-api.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(private cp2iApi: Cp2iApiService) {}
  
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = localStorage.getItem('cp2i_token');
    
    if (token) {
      // Renouveler le token si nécessaire lors de l'activité
      this.cp2iApi.refreshTokenIfNeeded();
      
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(authReq);
    }
    
    return next.handle(req);
  }
}