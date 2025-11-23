import { DeviceStore } from '@/app/datastore/device.store';
import { createStoreView } from '@/app/datastore/generic-store-view';
import { SearchOperator } from '@/app/datastore/generic.store';
import { GroupStore } from '@/app/datastore/group.store';
import { Device } from '@/app/models/device';
import { Component, computed, inject, input, Signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'DeviceGroupsComponent',
  imports: [TranslateModule],
  templateUrl: './devicegroups.html',
  styleUrl: './devicegroups.scss',
})
export class DeviceGroupsComponent {
  protected readonly groupStore = inject(GroupStore);
  protected readonly deviceStore = inject(DeviceStore);

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


    groups = computed(()=>{
        const groups = this.groupStore.entities();
        return groups.filter(group=>{
           return group.members.filter(mb=>mb.ieee_address===this.ieee_address()).length > 0
        })
  })

  removeDeviceFromGroup(groupid:number) {
    
  }
}
