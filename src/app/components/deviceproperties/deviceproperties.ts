import { Component, computed, inject, input, Signal } from '@angular/core';
import { Device } from '../../models/device';
import { createStoreView } from '../../datastore/generic-store-view';
import { DeviceStore } from '../../datastore/device.store';
import { SearchOperator } from '../../datastore/generic.store';
import { DeviceEndpointComponent } from '../endpoints/endpoints';
import { DeviceSettings } from '../devicesetting/devicesettings';
import { BridgeService } from '../../services/bridge.service';
import { DeviceConfigSchema } from '../../models/bridge';
import { ExpansionPanelComponent } from '../controls/expansionpanel/expansionpanel';

@Component({
  selector: 'DevicePropertiesComponent',
  imports: [DeviceEndpointComponent,ExpansionPanelComponent,DeviceSettings],
  templateUrl: './deviceproperties.html',
  styleUrl: './deviceproperties.scss'
})
export class DevicePropertiesComponent {
  ieee_address = input.required<string | undefined>();
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly bridgeService = inject(BridgeService);

  bridgeDeviceOptions:Signal<DeviceConfigSchema|undefined> = computed(()=>{
    const bi =  this.bridgeService.getBridgeInfo();
    return bi()?.config_schema.definitions.device;
  });


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
