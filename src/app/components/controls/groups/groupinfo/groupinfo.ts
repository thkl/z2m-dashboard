import { Component, computed, inject, input, signal, Signal } from '@angular/core';
import { Group } from '../../../../models/group';
import { createStoreView } from '../../../../datastore/generic-store-view';
import { GroupStore } from '../../../../datastore/group.store';
import { SearchOperator } from '../../../../datastore/generic.store';
import { TranslateModule } from '@ngx-translate/core';
import { DeviceStore } from '../../../../datastore/device.store';
import { ExpansionPanelComponent } from '../../expansionpanel/expansionpanel';
import { Device } from '../../../../models/device';
import { RemoveDeviceFromGroupOptions } from '../../../../models/types';
import { DeviceService } from '../../../../services/device.service';
import { DeviceFeaturesComponent } from '../../device/devicefeatures/devicefeatures';
import { OptionPanelComponent } from '../../optionpanel/optionpanel';

@Component({
  selector: 'GroupInfoComponent',
  imports: [TranslateModule, ExpansionPanelComponent, DeviceFeaturesComponent, OptionPanelComponent],
  templateUrl: './groupinfo.html',
  styleUrl: './groupinfo.scss'
})
export class GroupInfoComponent {

  protected readonly groupStore = inject(GroupStore);
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly deviceService = inject(DeviceService);

  group_id = input.required<number | undefined>();
  group = computed(() => {
    //Filter the coordinator from the devices
    let groupView: Signal<Group[]> = createStoreView(this.groupStore, {
      criteria: [
        { property: "id", value: this.group_id(), operator: "equals" }
      ],
      logicalOperator: SearchOperator.AND
    }, false, undefined);

    return groupView().length > 0 ? groupView()[0] : null
  });

  members = computed(() => {

    const mb = this.group()?.members;
    const dv = this.deviceStore.entities();

    return mb?.map(m => {
      return { device: dv.find(d => d.ieee_address === m.ieee_address), endpoint: m.endpoint };
    })
  });

  selectedDevice = signal<Device|null>(null);

  deviceSelectorTitle = computed(()=>{

    const d = this.selectedDevice();
    return d !== null ? d.friendly_name : "SELECT_DEVICE"

  });

  availabelDevices = createStoreView(this.deviceStore, {
    criteria: [
      { property: "type", value: "Coordinator", operator: "not" }
    ],
    logicalOperator: SearchOperator.AND
  }, false, undefined);

  deviceNameList = computed(() => {
    const dv = this.availabelDevices();
    return dv.map((d:Device) => {
      return {
        isSelected: false,
        label: d.friendly_name,
        value: d.ieee_address
      }
    }
    );
  })

  renameGroup() {
    console.log(this.group());
  }

  removeDeviceFromGroup(device: Device, endpoint: number) {
    if (this.group()) {
      const options: RemoveDeviceFromGroupOptions = {
        device: device.friendly_name,
        group: this.group()!.friendly_name,
        endpoint
      }
      this.deviceService.removeDeviceFromGroup(options);
    }
  }

  addDevice(): void {

  }

  selectNewDevice(selected: any) {
    this.selectedDevice.set(this.availabelDevices().find((d:Device)=>d.ieee_address === selected.value));
  }
}
