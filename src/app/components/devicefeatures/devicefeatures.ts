import { Component, computed, effect, inject, input, model, signal, Signal } from '@angular/core';
import { DeviceStore } from '../../datastore/device.store';
import { TranslateModule } from '@ngx-translate/core';
import { AccessMode, Device, DeviceFeature, DeviceFeatureVisual, DeviceTargetState } from '../../models/device';

import { DeviceService } from '../../services/device.service';
import { InfoOverlayComponent } from '../controls/infooverlay/infooverlay';
import { RadioElement, RadiolistComponent } from '../controls/radiolist/radiolist';

import { OptionComponent } from '../controls/option/option';
import { SelectOption, SwitchElement } from '../../models/types';
import { hsvToHtmlRgb, xyToHtmlRgb, htmlRgbToHsv, htmlRgbToXy } from '../../utils/color.util';
import { HumanReadablePipe } from '../../pipes/human.pipe';
import { createStoreView } from '../../datastore/generic-store-view';
import { SearchOperator } from '../../datastore/generic.store';
import { LevelMarkOption, LevelSelectorComponent } from '../controls/levelselector/levelselector';
import { ExpansionPanelComponent } from '../controls/expansionpanel/expansionpanel';
import { ColorSelectorComponent } from '../controls/colorselector/colorselector';
import { ColorTemperatureSelectorComponent } from '../controls/colortemperatureselector/colortemperatureselector';
import { DropdownComponent } from '../controls/dropdown/dropdown';
import { isValidForScenes } from '../../utils/filter.utils';
import { FeatureDisplayMode } from '../../models/constants';

@Component({
  selector: 'DeviceFeaturesComponent',
  imports: [TranslateModule, HumanReadablePipe, LevelSelectorComponent, InfoOverlayComponent, ExpansionPanelComponent, RadiolistComponent, OptionComponent, ColorSelectorComponent, ColorTemperatureSelectorComponent, DropdownComponent],
  templateUrl: './devicefeatures.html',
  styleUrl: './devicefeatures.scss'
})

export class DeviceFeaturesComponent {
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly deviceService = inject(DeviceService);
  readonly AccessMode = AccessMode;

  deviceFeatures = signal<DeviceFeatureVisual[]>([]);
  displayMode = input<FeatureDisplayMode>('settings');
  
  filterEndpoints = input<string[]>();

  levelMarks: LevelMarkOption[] = [{ percent: 0, label: "0" }, { percent: 25, label: "25" }, { percent: 50, label: "50" }, { percent: 75, label: "75" }, { percent: 100, label: "100" }];

  ieee_address = input.required<string | undefined>();
  device = computed(() => {
    //Filter the coordinator from the devices
    let devicesView: Signal<Device[]> = createStoreView(this.deviceStore, {
      criteria: [
        { property: "ieee_address", value: this.ieee_address(), operator: "equals" }
      ],
      logicalOperator: SearchOperator.AND
    }, false, undefined);

    return devicesView().length > 0 ? devicesView()[0] : null
  });

  constructor() {
    effect(() => {
      const expos = this.device()?.definition.exposes;
      const states = this.device()?.state;
      const result = this.flattenExposures(expos || [], states || []);
      console.log(result);
      this.deviceFeatures.set(result);
    })
  }


  flattenExposures(exposures: DeviceFeature[], states: any): DeviceFeatureVisual[] {
    const result: DeviceFeatureVisual[] = [];

    const flatten = (exp: DeviceFeature, parentValue?: any, parentIsComposite: boolean = false, parentType?: any) => {
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
          value: value ?? null,
          helper: null,
          subtype: parentType,
          validForScenes:isValidForScenes(exp)
        });
      } else {
        // Only add parent feature if it's a composite type or light type
        // For composite types, we show both the parent and children
        // For light types, we only show the children
        const isComposite = exp.type === 'composite';

        if (isComposite) {
          let helperValue = null;

          // Check if this is a color composite
          if (exp.property === 'color' && value) {
            helperValue = this.convertColorToHtml(exp, value);
          }

          result.push({
            property: exp,
            value: value ?? null,
            helper: helperValue,
            subtype: parentType,
            validForScenes:isValidForScenes(exp)
          });
        }

        // Recursively flatten sub-features
        exp.features.forEach(f => flatten(f, value, isComposite,exp.type));
      }
    };

    exposures.forEach(exp => flatten(exp));
    console.log(result);
    return result;
  }



  /**
   * Convert color values to HTML RGB format
   * Checks for hue/saturation or x/y sub-features and converts to HTML color
   */
  private convertColorToHtml(colorFeature: DeviceFeature, value: any): string | null {
    if (!colorFeature.features) {
      return null;
    }

    // Check for hue and saturation properties
    const hasHue = colorFeature.features.some(f => f.property === 'hue');
    const hasSaturation = colorFeature.features.some(f => f.property === 'saturation');

    if (hasHue && hasSaturation && value.hue !== undefined && value.saturation !== undefined) {
      try {
        // Zigbee hue is 0-360, saturation is 0-254
        // Convert to 0-360 for hue and 0-100 for saturation
        const hsv = {
          h: value.hue,
          s: Math.round((value.saturation / 254) * 100),
          v: 100 // Assume full brightness for color display
        };
        return hsvToHtmlRgb(hsv);
      } catch (e) {
        console.error('Error converting HSV to HTML RGB:', e);
        return null;
      }
    }

    // Check for x and y properties (CIE color space)
    const hasX = colorFeature.features.some(f => f.property === 'x');
    const hasY = colorFeature.features.some(f => f.property === 'y');

    if (hasX && hasY && value.x !== undefined && value.y !== undefined) {
      try {
        // XY values are already in 0-1 range (not 0-65535)
        const xy = {
          x: value.x,
          y: value.y
        };
        return xyToHtmlRgb(xy);
      } catch (e) {
        console.error('Error converting XY to HTML RGB:', e);
        return null;
      }
    }

    return null;
  }

  radioItems(property: DeviceFeature, currentValue: any): RadioElement[] {
    return property.values ? property.values.map(v => { return { label: v, isActive: v === currentValue } }) : [];
  }

  selectItems(property: DeviceFeature, currentValue: any): SelectOption[] {
    return property.values ? property.values.map(v => { return { label: v, isSelected: v === currentValue } }) : [];
  }

  switch(property: DeviceFeature, item: SwitchElement): void {
    if (this.device()) {
      const device = this.device()!;
      const state: DeviceTargetState = {};
      state[property.name] = item.isActive ? property.value_on ?? "ON" : property.value_off ?? "OFF"
      this.deviceService.updateDeviceState(device.friendly_name, state)
    }
  }

  enumClick(property: DeviceFeature, item: RadioElement): void {
    if (this.device()) {
      const device = this.device()!;
      const state: DeviceTargetState = {};
      state[property.name] = item ? item.label : ''
      this.deviceService.updateDeviceState(device.friendly_name, state)
    }
  }

  optionClick(property: DeviceFeature, item: SelectOption): void {
    if (this.device()) {
      const device = this.device()!;
      const state: DeviceTargetState = {};
      state[property.name] = item ? item.label : ''
      this.deviceService.updateDeviceState(device.friendly_name, state)
    }
  }

  colorTemperatureChange(property: DeviceFeature, newTemp: number): void {
    if (this.device()) {
      const device = this.device()!;
      const state: DeviceTargetState = {};
      state[property.name] = newTemp;
      this.deviceService.updateDeviceState(device.friendly_name, state);
    }
  }

  colorChange(property: DeviceFeature, newColor: string): void {
    console.log(property, newColor)
    if (property && property.subtype === "composite" && property.features) {
      const state: DeviceTargetState = {};
      state[property.property] = { "hex": newColor }
      if (this.device()) {
        this.deviceService.updateDeviceState(this.device()!.friendly_name, state);
      }
    }

  }

  valueChange(property: DeviceFeature, newValue: number): void {
    if (this.device()) {
      const state: DeviceTargetState = {};
      state[property.property] = newValue;
      this.deviceService.updateDeviceState(this.device()!.friendly_name, state);
    }
  }

  hasAccess(access: number, mode: AccessMode): boolean {
    return (access & mode) !== 0;
  }
}
