import { Injectable } from '@angular/core';
import { BrowserFingerprintService } from './browser-fingerprint.service';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly ALGORITHM = 'AES-GCM';

  constructor(private fingerprint: BrowserFingerprintService) {}

  async encryptToken(token: string): Promise<string> {
    const key = await this.getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encoded = new TextEncoder().encode(token);
    const encrypted = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv },
      key,
      encoded
    );

    // Combine IV + encrypted data and encode to base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  async decryptToken(encryptedToken: string): Promise<string | null> {
    try {
      const key = await this.getEncryptionKey();
      const combined = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));

      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv },
        key,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Failed to decrypt token:', error);
      return null;
    }
  }

  private async getEncryptionKey(): Promise<CryptoKey> {
    const buffer = await this.fingerprint.getFingerprintBuffer();

    return crypto.subtle.importKey(
      'raw',
      buffer,
      { name: this.ALGORITHM },
      false,
      ['encrypt', 'decrypt']
    );
  }
}
