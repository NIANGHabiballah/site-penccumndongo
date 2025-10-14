import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { routes } from './app.routes';
import { SecurityService } from './services/security.service';
import { SecurityGuard } from './guards/security.guard';
import { SecurityInterceptor } from './interceptors/security.interceptor';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { RECAPTCHA_SETTINGS, RecaptchaSettings } from 'ng-recaptcha';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    SecurityService,
    SecurityGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SecurityInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: {
        siteKey: '6LfFersrAAAAABbhJKt8aOy7J-kio_QXNM7cN1ym',
      } as RecaptchaSettings,
    }
  ]
};
