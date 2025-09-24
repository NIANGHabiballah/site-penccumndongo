import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SecurityService } from '../services/security.service';

@Injectable()
export class SecurityInterceptor implements HttpInterceptor {

  constructor(private securityService: SecurityService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add security headers to all HTTP requests
    const secureReq = req.clone({
      setHeaders: {
        'X-Requested-With': 'XMLHttpRequest',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    });

    return next.handle(secureReq);
  }
}