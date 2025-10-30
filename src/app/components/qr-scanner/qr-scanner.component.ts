import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QrCertificateService } from '../../services/qr-certificate.service';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="qr-scanner-container">
      <div class="scanner-header">
        <h3>Scanner un QR Code de Certificat</h3>
        <button class="close-btn" (click)="closeScanner()">×</button>
      </div>
      
      <div class="scanner-body">
        <video #videoElement autoplay playsinline class="scanner-video"></video>
        <div class="scanner-overlay">
          <div class="scan-frame"></div>
          <p class="scan-instruction">Placez le QR code dans le cadre</p>
        </div>
      </div>
      
      <div class="verification-result" *ngIf="verificationResult">
        <div class="result-card" [ngClass]="verificationResult.valid ? 'valid' : 'invalid'">
          <div class="result-icon">
            <i [class]="verificationResult.valid ? 'fa fa-check-circle' : 'fa fa-times-circle'"></i>
          </div>
          
          <div class="result-content" *ngIf="verificationResult.valid">
            <h4>Certificat Authentique ✓</h4>
            <div class="cert-details">
              <p><strong>Participant:</strong> {{verificationResult.data?.participant_name}}</p>
              <p><strong>Formation:</strong> {{verificationResult.data?.formation_title}}</p>
              <p><strong>Date d'émission:</strong> {{formatDate(verificationResult.data?.date_issued)}}</p>
              <p><strong>Vérifications:</strong> {{verificationResult.data?.verified_count}} fois</p>
            </div>
          </div>
          
          <div class="result-content" *ngIf="!verificationResult.valid">
            <h4>Certificat Non Valide ❌</h4>
            <p class="error-reason">{{getErrorMessage(verificationResult.reason)}}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./qr-scanner.component.css']
})
export class QrScannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  
  verificationResult: any = null;
  isScanning = false;
  stream: MediaStream | null = null;

  constructor(private qrService: QrCertificateService) {}

  ngOnInit() {
    this.startCamera();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
        this.isScanning = true;
      }
    } catch (error) {
      console.error('Erreur accès caméra:', error);
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.isScanning = false;
  }

  verifyQRCode(qrText: string) {
    try {
      const url = new URL(qrText);
      const qrId = url.searchParams.get('id');
      
      if (qrId) {
        this.qrService.verifyQR(qrId).subscribe({
          next: (result) => {
            this.verificationResult = result;
            this.stopCamera();
          },
          error: (error) => {
            this.verificationResult = { 
              valid: false, 
              reason: 'Erreur de vérification' 
            };
          }
        });
      }
    } catch (error) {
      this.verificationResult = { 
        valid: false, 
        reason: 'QR code invalide' 
      };
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  getErrorMessage(reason: string): string {
    const messages = {
      'not_found': 'Ce certificat n\'existe pas dans notre base de données',
      'expired': 'Ce certificat a expiré',
      'already_used': 'Ce certificat a déjà été utilisé',
      'missing': 'ID de certificat manquant'
    };
    return messages[reason as keyof typeof messages] || 'Certificat non valide';
  }

  closeScanner() {
    this.stopCamera();
  }
}