import { Component, effect, inject, input, signal, Signal } from '@angular/core';
import { InfoOverlayComponent } from '../../infooverlay/infooverlay';
import { OptionComponent } from '../../option/option';
import { DeviceConfigSchema } from '../../../../models/bridge';
import { AccessMode, Device, DeviceOption } from '../../../../models/device';
import { DeviceService } from '../../../../services/device.service';
import { ButtonComponent } from '@/app/components/controls/button/button';
import { JSONStringifyPipe } from '@/app/pipes/json.pipe';
import { HumanReadablePipe } from '@/app/pipes/human.pipe';

@Component({
  selector: 'DeviceSettings',
  imports: [InfoOverlayComponent, OptionComponent,ButtonComponent,HumanReadablePipe],
  templateUrl: './devicesettings.html',
  styleUrl: './devicesettings.scss'
})
export class DeviceSettings {
  section = input.required<DeviceOption[] | DeviceConfigSchema | undefined>();
  device = input.required<Device | null>()
  readonly AccessMode = AccessMode;
  deviceService = inject(DeviceService)
  deviceOptions = signal<DeviceOption[]>([]);
  hasInitialized = false;
  settingsChanged = signal<boolean>(false);

  hasAccess(access: number, mode: AccessMode): boolean {
    return (access & mode) !== 0;
  }

  constructor() {
    effect(() => {
      //if (this.hasInitialized) {
      //  return;
      //}
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
       
        const options: DeviceOption[] = Object.entries(schema.properties).map(([key, prop]) => 
        {
          const schemaKey = prop.properties ? Object.keys(prop.properties)[0] : key;
          return {
          name: key,
          label: prop.title || key,
          description: prop.description,
          type: prop.type,
          enum: prop.enum,
          access: 0, // Set appropriate access mode
          property: key,
          value: undefined,
          accessor:schemaKey
        }});
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

  changeSetting(option: DeviceOption, item: any) {
    if (this.device()) {
      option.value = item;
      const data: {[key: string]:any} = {}
      if ((option.value !== null) && (option.value !== '?')) {
        const propKey = option.property;
        this.device()!.options[propKey] = option.value;
        this.settingsChanged.set(true);
        console.log(option)
      }
    }
  }

  applySettings() {
        if (this.device()) {
          this.deviceService.updateSetting(this.device()!, this.device()!.options);
          this.settingsChanged.set(false);
    }
  }
}

