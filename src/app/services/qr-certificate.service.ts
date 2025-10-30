import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QRCertificate {
  id: string;
  url: string;
  participant_name: string;
  formation_title: string;
  date_issued: string;
}

export interface QRVerification {
  valid: boolean;
  reason?: string;
  data?: {
    participant_name: string;
    formation_title: string;
    date_issued: string;
    certificate_id: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class QrCertificateService {
  private apiUrl = 'https://penccumndongo.com/api';

  constructor(private http: HttpClient) {}

  generateQR(certificateData: any): Observable<QRCertificate> {
    return this.http.post<QRCertificate>(`${this.apiUrl}/generate-qr.php`, certificateData);
  }

  verifyQR(qrId: string): Observable<QRVerification> {
    return this.http.get<QRVerification>(`${this.apiUrl}/verify-qr.php?id=${qrId}`);
  }
}