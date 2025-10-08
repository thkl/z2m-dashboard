import { Component, computed, effect, inject, signal, Signal } from '@angular/core';
import { DeviceStore } from '../../datastore/device.store';
import { TranslateModule } from '@ngx-translate/core';
import { DeviceFeature, DeviceFeatureVisual, DeviceTargetState } from '../../models/device';
import { JSONStringifyPipe } from '../../pipes/json.pipe';
import { DeviceService } from '../../services/device.service';
import { InfoOverlayComponent } from '../infooverlay/infooverlay';
import { ExpansionPanelComponent } from "../expansionpanel/expansionpanel";
import { RadioElement, RadiolistComponent } from '../radiolist/radiolist';
import { SwitchComponent } from '../switch/switch';
import { OptionComponent } from '../option/option';
import { SwitchElement } from '../../models/types';
import { ColorSelectorComponent } from '../colorselector/colorselector';

@Component({
  selector: 'DeviceFeaturesComponent',
  imports: [TranslateModule, JSONStringifyPipe, InfoOverlayComponent, ExpansionPanelComponent,RadiolistComponent,OptionComponent,ColorSelectorComponent],
  templateUrl: './devicefeatures.html',
  styleUrl: './devicefeatures.scss'
})

export class DeviceFeaturesComponent {
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly deviceService = inject(DeviceService);

  deviceExposure = signal<DeviceFeatureVisual[]>([]);

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


  flattenExposures(exposures: DeviceFeature[], states: any): DeviceFeatureVisual[] {
    const result: DeviceFeatureVisual[] = [];

    const flatten = (exp: DeviceFeature, parentValue?: any, parentIsComposite: boolean = false) => {
      const value = parentValue?.[exp.property] ?? states?.[exp.property];

      // Set hidden property for features that don't have it defined
      if (exp.hidden === undefined) {
        // Only hide nested features that are inside a composite type
        exp.hidden = parentIsComposite;
      }

      // Skip hidden features
      if (exp.hidden === true) {
        return;
      }

      if (!exp.features || exp.features.length === 0) {
        result.push({
          property: exp,
          value: value ?? null
        });
      } else {
        // Only add parent feature if it's a composite type or light type
        // For composite types, we show both the parent and children
        // For light types, we only show the children
        const isComposite = exp.type === 'composite';

        if (isComposite) {
          result.push({
            property: exp,
            value: value ?? null
          });
        }

        // Recursively flatten sub-features
        exp.features.forEach(f => flatten(f, value, isComposite));
      }
    };

    exposures.forEach(exp => flatten(exp));
    return result;
  };

  radioItems(property:DeviceFeature,currentValue:any):RadioElement[] {
    return property.values ? property.values.map(v=>{return {label:v,isActive:v === currentValue}}):[];
  }

  switch(property: DeviceFeature, item: SwitchElement): void {
    if (this.device()) {
      const device = this.device()!;
      const state: DeviceTargetState = {};
      state[property.name] = item.isActive ? property.value_on ?? "ON" : property.value_off ?? "OFF"  
      this.deviceService.updateDeviceState(device.friendly_name, state )
    }
  }

  enumClick(property: DeviceFeature, item: RadioElement): void {
    if (this.device()) {
      const device = this.device()!;
      const state: DeviceTargetState = {};
      state[property.name] = item ? item.label : ''  
      this.deviceService.updateDeviceState(device.friendly_name, state )
    }
  }
}
