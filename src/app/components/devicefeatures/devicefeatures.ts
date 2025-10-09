import { Component, computed, effect, inject, signal, Signal } from '@angular/core';
import { DeviceStore } from '../../datastore/device.store';
import { TranslateModule } from '@ngx-translate/core';
import { AccessMode, DeviceFeature, DeviceFeatureVisual, DeviceTargetState } from '../../models/device';
 
import { DeviceService } from '../../services/device.service';
import { InfoOverlayComponent } from '../infooverlay/infooverlay';
import { ExpansionPanelComponent } from "../expansionpanel/expansionpanel";
import { RadioElement, RadiolistComponent } from '../radiolist/radiolist';
 
import { OptionComponent } from '../option/option';
import { SwitchElement } from '../../models/types';
import { ColorSelectorComponent } from '../colorselector/colorselector';
import { hsvToHtmlRgb, xyToHtmlRgb, htmlRgbToHsv, htmlRgbToXy } from '../../utils/color.util';
import { ColorTemperatureSelectorComponent } from '../colortemperatureselector/colortemperatureselector';
import { HumanReadablePipe } from '../../pipes/human.pipe';

@Component({
  selector: 'DeviceFeaturesComponent',
  imports: [TranslateModule, HumanReadablePipe, InfoOverlayComponent, ExpansionPanelComponent, RadiolistComponent, OptionComponent, ColorSelectorComponent, ColorTemperatureSelectorComponent],
  templateUrl: './devicefeatures.html',
  styleUrl: './devicefeatures.scss'
})

export class DeviceFeaturesComponent {
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly deviceService = inject(DeviceService);
  readonly AccessMode = AccessMode;

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
          value: value ?? null,
          helper: null,
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
            helper: helperValue
          });
        }

        // Recursively flatten sub-features
        exp.features.forEach(f => flatten(f, value, isComposite));
      }
    };

    exposures.forEach(exp => flatten(exp));
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

  temperatureChange(property: DeviceFeature, newTemp: number): void {
    if (this.device()) {
      const device = this.device()!;
      const state: DeviceTargetState = {};
      state[property.name] = newTemp;
      this.deviceService.updateDeviceState(device.friendly_name, state);
    }
  }

  colorChange(property: DeviceFeature, newColor: string): void {
    console.log(property, newColor)
    if (property && property.type === "composite" && property.features) {
      const state: DeviceTargetState = {};
      state[property.property] = { "hex": newColor }

      /*
      // Check which color properties are available
      const hueFeature = property.features.find(f => f.property === "hue");
      const saturationFeature = property.features.find(f => f.property === "saturation");
      const xFeature = property.features.find(f => f.property === "x");
      const yFeature = property.features.find(f => f.property === "y");

      if (hueFeature && saturationFeature) {
        // Convert to HSV (Hue/Saturation/Value)
        const hsv = htmlRgbToHsv(newColor);
        console.log('Converting to Hue/Saturation:', hsv);

        const colorValue: any = {};
        colorValue[hueFeature.property] =  Math.round((hsv.h / 100) * 254);  
        colorValue[saturationFeature.property] = Math.round((hsv.s / 100) * 254 );  

        const state: DeviceTargetState = {};
        state[property.property] = colorValue;

        if (this.device()) {
          this.deviceService.updateDeviceState(this.device()!.friendly_name, state);
        }
      } else if (xFeature && yFeature) {
        // Convert to XY color space
        const xy = htmlRgbToXy(newColor);
        console.log('Converting to XY:', xy);

        const colorValue: any = {};
        colorValue[xFeature.property] = xy.x;
        colorValue[yFeature.property] = xy.y;

        const state: DeviceTargetState = {};
        state[property.property] = colorValue;
*/
      if (this.device()) {
        this.deviceService.updateDeviceState(this.device()!.friendly_name, state);
      }
    }

  }

  hasAccess(access: number, mode: AccessMode): boolean {
    return (access & mode) !== 0;
  }
}
