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
      const currentPath = window.location.pathname;
      const directory = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
      const versionUrl = `${directory}version.json`;
      const versionData = await firstValueFrom(this.http.get<VersionInfo>(versionUrl));
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
