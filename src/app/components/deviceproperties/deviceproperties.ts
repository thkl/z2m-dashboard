import { Component, computed, inject, input, Signal } from '@angular/core';
import { Device } from '../../models/device';
import { createStoreView } from '../../datastore/generic-store-view';
import { DeviceStore } from '../../datastore/device.store';
import { SearchOperator } from '../../datastore/generic.store';
import { DeviceEndpointComponent } from '../endpoints/endpoints';
import { ExpansionPanelComponent } from '../expansionpanel/expansionpanel';
import { DeviceSettingsExtended } from '../devicesettingsextended/devicesettingsextended';

@Component({
  selector: 'DevicePropertiesComponent',
  imports: [DeviceEndpointComponent,ExpansionPanelComponent,DeviceSettingsExtended],
  templateUrl: './deviceproperties.html',
  styleUrl: './deviceproperties.scss'
})
export class DevicePropertiesComponent {
  ieee_address = input.required<string | undefined>();
  protected readonly deviceStore = inject(DeviceStore);
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


}
