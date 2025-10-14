import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Cp2iApiService } from '../services/cp2i-api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private cp2iApi: Cp2iApiService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.cp2iApi.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['/cp2i']);
      return false;
    }
  }
}