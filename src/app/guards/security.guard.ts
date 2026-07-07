import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SecurityService } from '../services/security.service';

@Injectable({
  providedIn: 'root'
})
export class SecurityGuard implements CanActivate {

  constructor(
    private securityService: SecurityService,
    private router: Router
  ) {}

  canActivate(): boolean {
    // Rate limiting check
    const clientId = this.getClientIdentifier();
    if (!this.securityService.checkRateLimit(clientId, 100, 60000)) {
      this.securityService.logSecurityEvent('Rate limit exceeded', { clientId });
      return false;
    }

    return true;
  }

  private getClientIdentifier(): string {
    return navigator.userAgent + window.location.hostname;
  }
}