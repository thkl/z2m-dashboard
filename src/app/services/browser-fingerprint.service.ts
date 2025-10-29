import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BrowserFingerprintService {

  private fingerprintBuffer: ArrayBuffer | null = null;

  async getFingerprintBuffer(): Promise<ArrayBuffer> {
    if (this.fingerprintBuffer) return this.fingerprintBuffer;

    const components = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset().toString(),
      navigator.hardwareConcurrency || 'unknown',
      (navigator as any).deviceMemory || 'unknown',
    ].join('|');

    this.fingerprintBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(components));
    return this.fingerprintBuffer;
  }

  async getFingerprint(): Promise<string> {
    const buffer = await this.getFingerprintBuffer();
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
