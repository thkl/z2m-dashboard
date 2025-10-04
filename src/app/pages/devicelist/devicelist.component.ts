import { Component, computed, inject, signal, effect, OnDestroy } from '@angular/core';
import { DeviceStore } from '../../datastore/device.store';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-devicelist',
  imports: [TimeAgoPipe],
  templateUrl: './devicelist.component.html',
  styleUrl: './devicelist.component.scss'
})
export class DeviceListComponent implements OnDestroy {

    protected readonly deviceStore = inject(DeviceStore);
    devices = computed(()=>{
      console.log(".")
      return this.deviceStore.entities();
    });

    private updateTrigger = signal(0);
    private intervalId?: number;

    constructor() {
      effect(() => {
        const devices = this.devices();
        this.setupUpdateInterval(devices);
      });
    }

    private setupUpdateInterval(devices: any[]) {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }

      // Find the shortest time difference
      const now = new Date();
      let minSeconds = Infinity;

      for (const device of devices) {
        if (device.state?.last_seen) {
          const past = new Date(device.state.last_seen);
          const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
          minSeconds = Math.min(minSeconds, seconds);
        }
      }

      // Determine update interval based on shortest time difference
      let interval: number;
      if (minSeconds < 60) {
        interval = 5000; // Update every 5 seconds if any device was seen in last minute
      } else if (minSeconds < 3600) {
        interval = 30000; // Update every 30 seconds if any device was seen in last hour
      } else if (minSeconds < 86400) {
        interval = 300000; // Update every 5 minutes if any device was seen in last day
      } else {
        interval = 3600000; // Update every hour for older timestamps
      }

      this.intervalId = window.setInterval(() => {
        this.updateTrigger.set(this.updateTrigger() + 1);
      }, interval);
    }

    ngOnDestroy() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
    }
}
