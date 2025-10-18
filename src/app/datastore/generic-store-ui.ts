
import {CdkTableModule, DataSource} from '@angular/cdk/table';
import { Signal, effect, untracked, Injector, runInInjectionContext } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';

export class CDKDataSource<T> extends DataSource<T> {

  private dataSubject$ = new BehaviorSubject<T[]>([]);
  private connected = false;
  private injector: Injector | null = null;

  constructor(private dataSignal: Signal<T[]>, injector?: Injector) {
    super();
    this.injector = injector || null;
    // Initialize with current value
    this.dataSubject$.next(this.dataSignal());
  }

  connect(): Observable<T[]> {
    // Only set up the effect once when first connected
    if (!this.connected && this.injector) {
      this.connected = true;
      // Run effect within the injection context
      runInInjectionContext(this.injector, () => {
        effect(() => {
          const data = this.dataSignal();
          untracked(() => {
            this.dataSubject$.next(data);
          });
        });
      });
    } else if (!this.connected) {
      // Fallback: just subscribe to signal changes manually without effect
      this.connected = true;
      // Create a simple subscription that updates on signal changes
      const updateData = () => {
        this.dataSubject$.next(this.dataSignal());
      };
      // Check periodically for changes (not ideal but works without injection context)
      const interval = setInterval(updateData, 100);
      // Store interval ID for cleanup if needed
      (this as any)._interval = interval;
    }
    return this.dataSubject$.asObservable();
  }

  disconnect() {
    this.connected = false;
    if ((this as any)._interval) {
      clearInterval((this as any)._interval);
    }
  }
}