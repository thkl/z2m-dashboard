import { DeviceFeaturesComponent } from '@/app/components/controls/device/devicefeatures/devicefeatures';
import { DeviceInfoComponent } from '@/app/components/controls/device/deviceinfo/deviceinfo';
import { DevicePropertiesComponent } from '@/app/components/controls/device/deviceproperties/deviceproperties';
import { DeviceStore } from '@/app/datastore/device.store';
import { createStoreView } from '@/app/datastore/generic-store-view';
import { SearchOperator } from '@/app/datastore/generic.store';
import { Device } from '@/app/models/device';
import { DeviceService } from '@/app/services/device.service';
import { PropertyTabManagerService } from '@/app/services/propertytab.service';
import { Component, computed, inject, input, output, Signal, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'DeviceInspectorComponent',
  imports: [TranslateModule, DeviceInfoComponent, DeviceFeaturesComponent, DevicePropertiesComponent],
  templateUrl: './deviceinspector.component.html',
  styleUrl: './deviceinspector.component.scss'
})
export class DeviceInspectorComponent {
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly deviceService = inject(DeviceService);
  tabManager = inject(PropertyTabManagerService);
  
  panel = signal<number>(1);

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



  closeSidebar(): void {
    this.tabManager.closeTab(this.ieee_address()!);
  }

}
