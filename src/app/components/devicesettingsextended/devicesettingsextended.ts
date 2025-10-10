import { Component, effect, input, signal, Signal } from '@angular/core';
import { AccessMode, Device, DeviceOption } from '../../models/device';
import { InfoOverlayComponent } from '../infooverlay/infooverlay';
import { OptionComponent } from '../option/option';

@Component({
  selector: 'DeviceSettingsExtended',
  imports: [InfoOverlayComponent,OptionComponent],
  templateUrl: './devicesettingsextended.html',
  styleUrl: './devicesettingsextended.scss'
})
export class DeviceSettingsExtended {
  device = input.required<Device|null>()
  readonly AccessMode = AccessMode;
  deviceOptions = signal<DeviceOption[]>([]);

 
  hasAccess(access: number, mode: AccessMode): boolean {
    return (access & mode) !== 0;
  }

  constructor() {
    effect(()=>{
      const options = this.device()?.definition.options;
      const states = this.device()?.options;
      
      const flattend :DeviceOption[] = [... options??[]];
      
      flattend.forEach((option:DeviceOption)=> {
        if (states) {
          option.value = states[option.name]
        } 
      });

      this.deviceOptions.set(flattend);
    })
  }

}

