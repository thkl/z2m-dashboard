import { Component, computed, inject, input, Signal } from '@angular/core';
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

@Component({
  selector: 'GroupInfoComponent',
  imports: [TranslateModule, ExpansionPanelComponent, DeviceFeaturesComponent],
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
}
