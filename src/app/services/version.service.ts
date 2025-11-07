import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WritableSignal, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface VersionInfo {
  version: string;
}

@Injectable({
  providedIn: 'root',
})
export class VersionService {
  private versionSignal: WritableSignal<string> = signal('0.0.0');

  constructor(private http: HttpClient) {
    this.initializeVersion();
  }

  private async initializeVersion(): Promise<void> {
    try {
      const versionData = await firstValueFrom(this.http.get<VersionInfo>('/version.json'));
      this.versionSignal.set(versionData.version);
    } catch (error) {
      console.warn('Failed to load version.json:', error);
      // Fallback to default version
      this.versionSignal.set('0.0.0');
    }
  }

  getVersion() {
    return this.versionSignal;
  }
}
