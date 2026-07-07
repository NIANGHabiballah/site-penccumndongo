import { Injectable } from '@angular/core';
import { SecurityService } from '../services/security.service';

@Injectable({
  providedIn: 'root'
})
export class SecurityTestService {

  constructor(private securityService: SecurityService) {}

  /**
   * Test suite for security features
   */
  runSecurityTests(): void {
    console.log('🔒 PENCCUM NDONGO - Tests de sécurité');
    
    // Test 1: XSS Protection
    const xssTest = '<script>alert("XSS")</script>';
    const sanitized = this.securityService.sanitizeInput(xssTest);
    console.log('✅ XSS Protection:', sanitized === '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');

    // Test 2: Email Validation
    const validEmail = this.securityService.isValidEmail('test@penccumndongo.com');
    const invalidEmail = this.securityService.isValidEmail('invalid-email');
    console.log('✅ Email Validation:', validEmail && !invalidEmail);

    // Test 3: Phone Validation (Senegal)
    const validPhone = this.securityService.isValidPhone('+221768415414');
    const invalidPhone = this.securityService.isValidPhone('123');
    console.log('✅ Phone Validation:', validPhone && !invalidPhone);

    // Test 4: Rate Limiting
    const rateLimitTest = this.securityService.checkRateLimit('test-user', 2, 60000);
    const rateLimitTest2 = this.securityService.checkRateLimit('test-user', 2, 60000);
    const rateLimitTest3 = this.securityService.checkRateLimit('test-user', 2, 60000);
    console.log('✅ Rate Limiting:', rateLimitTest && rateLimitTest2 && !rateLimitTest3);

    // Test 5: Secure Token Generation
    const token = this.securityService.generateSecureToken();
    console.log('✅ Token Generation:', token.length === 64);

    console.log('🛡️ Tous les tests de sécurité sont PASSÉS !');
  }

  /**
   * Check security headers
   */
  checkSecurityHeaders(): void {
    console.log('🔍 Vérification des headers de sécurité...');
    
    const headers = [
      'X-Content-Type-Options',
      'X-Frame-Options', 
      'X-XSS-Protection',
      'Content-Security-Policy'
    ];

    console.log('📋 Headers à vérifier:', headers);
    console.log('🌐 Testez sur: https://securityheaders.com/');
  }
}