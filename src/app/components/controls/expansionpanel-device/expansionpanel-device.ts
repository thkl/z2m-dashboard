import { ExpansionPanelComponent } from '@/app/components/controls/expansionpanel/expansionpanel';
import { SearchInput } from '@/app/components/controls/searchinput/searchinput';
import { Device } from '@/app/models/device';
import { Component, input } from '@angular/core';
import { DeviceImage } from "../device/device-image/device-image";

@Component({
  selector: 'ExpansionPanelDeviceComponent',
  imports: [SearchInput, DeviceImage],
  templateUrl: './expansionpanel-device.html',
  styleUrls: ['../expansionpanel/expansionpanel.scss','./expansionpanel-device.scss'],
})
export class ExpansionPanelDeviceComponent extends ExpansionPanelComponent{
  device = input.required<Device>(); 
}
