import { Component, effect, inject, input, signal, Signal } from '@angular/core';
import { ButtonComponent } from '@/app/components/controls/button/button';
import { ArrayInputComponent } from '@/app/components/controls/arrayinput/arrayinput';
import { DeviceService } from '@/app/services/device.service';
import { InfoOverlayComponent } from '@/app/components/controls/infooverlay/infooverlay';
import { OptionComponent } from '@/app/components/controls/option/option';
import { AccessMode, Device, DeviceOption } from '@/app/models/device';
import { DeviceConfigSchema } from '@/app/models/bridge';
import { DropdownComponent } from '@/app/components/controls/dropdown/dropdown';
import { SelectOption } from '@/app/models/types';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'DeviceSettings',
  imports: [InfoOverlayComponent, OptionComponent, ButtonComponent, ArrayInputComponent, DropdownComponent, NgTemplateOutlet],
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

        const options: DeviceOption[] = Object.entries(schema.properties).map(([key, prop]) => {
          const schemaKey = prop.properties ? Object.keys(prop.properties)[0] : undefined;
          return {
            name: key,
            label: prop.title || key,
            description: prop.description,
            type: prop.type,
            enum: prop.enum,
            access: 0, // Set appropriate access mode
            property: key,
            value: undefined,
            accessor: schemaKey,
            restartRequired: prop.requiresRestart
          }
        });
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
        option.value = states[option.name] ?? ''
      }
      if (option.features) {
        // find the feature with the matching name
        option.features.forEach(ofe => {
          console.log(ofe);
          ofe.value = option.value[ofe.name];
        })
      }
    });

    this.deviceOptions.set(flattend);
  }

  convertValue(option: DeviceOption, value: any) {
    if (option.type === 'number' || option.type === 'numeric') {
      return parseFloat(value);
    } else {
      return value;
    }

  }

  changeSetting(option: DeviceOption, item: any, parent: any) {
    if (this.device()) {
      option.value = this.convertValue(option,item);
      const data: { [key: string]: any } = {}
      if ((option.value !== null) && (option.value !== '?')) {
        const propKey = option.property;
        if (option.accessor) {
          const v: any = {};
          v[option.accessor] = option.value;
          this.device()!.options[propKey] = v;
        } else {
          if (parent) {
            let po = this.device()!.options[parent.name]

            po[option.name] = option.value;
            this.device()!.options[parent.name] = po;
          } else {
              this.device()!.options[propKey] = option.value;
          }
        }
        this.settingsChanged.set(true);
      }
    }
  }

  buildOptionItems(items: string[] | undefined, value: any): SelectOption[] {
    return items ? items.map(item => { return { label: item, value: item, isSelected: item === value } }) : []
  }

  applySettings() {
    if (this.device()) {

      this.deviceService.updateSetting(this.device()!, this.device()!.options);
      this.settingsChanged.set(false);
    }
  }
}

