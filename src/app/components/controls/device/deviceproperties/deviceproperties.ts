import { Component, computed, inject, input, Signal } from '@angular/core';
import { DeviceStore } from '@/app/datastore/device.store';
import { DeviceEndpointComponent } from '../endpoints/endpoints';
import { ExpansionPanelComponent } from '../../expansionpanel/expansionpanel';
import { DeviceSettings } from '../devicesetting/devicesettings';
import { BridgeService } from '@/app/services/bridge.service';
import { DeviceConfigSchema } from '@/app/models/bridge';
import { Device } from '@/app/models/device';
import { createStoreView } from '@/app/datastore/generic-store-view';
import { SearchOperator } from '@/app/datastore/generic.store';
import { DeviceBindingsComponent } from '@/app/components/controls/device/devicebindings/devicebindings';
import { DeviceReportingComponent } from '@/app/components/controls/device/devicereporting/devicereporting';
import { TranslateModule } from '@ngx-translate/core';
 

@Component({
  selector: 'DevicePropertiesComponent',
  imports: [DeviceEndpointComponent,ExpansionPanelComponent,DeviceSettings,DeviceBindingsComponent,DeviceReportingComponent,TranslateModule],
  templateUrl: './deviceproperties.html',
  styleUrl: './deviceproperties.scss'
})
export class DevicePropertiesComponent {
  ieee_address = input.required<string | undefined>();
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly bridgeService = inject(BridgeService);

  bridgeDeviceOptions:Signal<DeviceConfigSchema|undefined> = computed(()=>{
    const bi =  this.bridgeService.bridgeInfo;
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
