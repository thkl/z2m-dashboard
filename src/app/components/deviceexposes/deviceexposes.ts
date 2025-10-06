import { Component, computed, effect, inject, signal, Signal } from '@angular/core';
import { DeviceStore } from '../../datastore/device.store';
import { TranslateModule } from '@ngx-translate/core';
import { DeviceExpose, DeviceExposeVisual } from '../../models/device';

@Component({
  selector: 'app-deviceexposes',
  imports: [TranslateModule],
  templateUrl: './deviceexposes.html',
  styleUrl: './deviceexposes.scss'
})

export class DeviceExposes {
  protected readonly deviceStore = inject(DeviceStore);

  deviceExposure = signal<DeviceExposeVisual[]>([]);

  device = computed(() => {
    return this.deviceStore.selectedEntity();
  })

  constructor() {
    effect(() => {
      const expos = this.device()?.definition.exposes;
      const states = this.device()?.state;
      const result = this.flattenExposures(expos || [], states || []);
      this.deviceExposure.set(result);
    })
  }


  flattenExposures(exposures: DeviceExpose[], states: any): DeviceExposeVisual[] {
    const result: DeviceExposeVisual[] = [];

    const flatten = (exp: DeviceExpose, parentValue?: any) => {
      const value = parentValue?.[exp.property] ?? states?.[exp.property];
      if (!exp.features || exp.features.length === 0) {
        result.push({
          property: exp,
          value: value ?? null
        });
      } else {
        // Recursively flatten sub-features
        exp.features.forEach(feature => flatten(feature, value));
      }
    };

    exposures.forEach(exp => flatten(exp));
    return result;
  };
}
