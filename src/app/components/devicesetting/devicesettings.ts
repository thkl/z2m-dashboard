import { Component, effect, input, signal, Signal } from '@angular/core';
import { AccessMode, Device, DeviceOption } from '../../models/device';
import { InfoOverlayComponent } from '../controls/infooverlay/infooverlay';
import { OptionComponent } from '../controls/option/option';
import { DeviceConfigSchema } from '../../models/bridge';

@Component({
  selector: 'DeviceSettings',
  imports: [InfoOverlayComponent, OptionComponent],
  templateUrl: './devicesettings.html',
  styleUrl: './devicesettings.scss'
})
export class DeviceSettings {
  section = input.required<DeviceOption[] | DeviceConfigSchema | undefined>();
  device = input.required<Device | null>()
  readonly AccessMode = AccessMode;
  deviceOptions = signal<DeviceOption[]>([]);
  hasInitialized = false;

  hasAccess(access: number, mode: AccessMode): boolean {
    return (access & mode) !== 0;
  }

  constructor() {
    effect(() => {
      if (this.hasInitialized) {
        return;
      }
      const section = this.section();

      if (!section) {
        // Handle undefined case
        this.deviceOptions.set([]);
        return;
      }

      if ('properties' in section && !Array.isArray(section)) {
        // Handle DeviceConfigSchema
        const schema = section as DeviceConfigSchema;
        // Convert schema properties to DeviceOption[] format
        const options: DeviceOption[] = Object.entries(schema.properties).map(([key, prop]) => ({
          name: key,
          label: prop.title || key,
          description: prop.description,
          type: prop.type,
          enum: prop.enum,
          access: 0, // Set appropriate access mode
          property: key,
          value: undefined
        }));
        this.buildExtendedOptions(options);
      } else if (Array.isArray(section)) {
        // Handle DeviceOption[]
        this.buildExtendedOptions(section);
      }
      this.hasInitialized = true;
    })
  }

  buildExtendedOptions(options: DeviceOption[]) {
    const states = this.device()?.options;
    const flattend: DeviceOption[] = [...options ?? []];
    flattend.forEach((option: DeviceOption) => {
      if (Array.isArray(option.type)) {
        option.type = `Array.${option.type[0]}`
      }
      if (states) {
        option.value = states[option.name] ?? '?'
      }
    });
    this.deviceOptions.set(flattend);
  }
}

