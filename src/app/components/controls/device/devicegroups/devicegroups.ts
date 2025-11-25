import { DropdownComponent } from '@/app/components/controls/dropdown/dropdown';
import { DeviceStore } from '@/app/datastore/device.store';
import { createStoreView } from '@/app/datastore/generic-store-view';
import { SearchOperator } from '@/app/datastore/generic.store';
import { GroupStore } from '@/app/datastore/group.store';
import { Device } from '@/app/models/device';
import { AddRemoveDeviceFromGroupOptions } from '@/app/models/types';
import { DeviceService } from '@/app/services/device.service';
import { Component, computed, inject, input, signal, Signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'DeviceGroupsComponent',
  imports: [TranslateModule, DropdownComponent],
  templateUrl: './devicegroups.html',
  styleUrl: './devicegroups.scss',
})
export class DeviceGroupsComponent {
  protected readonly groupStore = inject(GroupStore);
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly deviceService = inject(DeviceService);

  newGroupId = signal<number | null>(null);
  newEndPointId = signal<string | null>(null);

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

  knownGroups = computed(() => {
    const glist = this.groupStore.entities();
    return glist.map(g => { return { isSelected: g.id === this.newGroupId(), label: g.friendly_name, value: String(g.id) } })
  })

  knownEndpoints = computed(() => {
    return Object.keys(this.device()?.endpoints!).map(ep => { return { isSelected: this.newEndPointId() === ep, label: ep, value: ep } })
  })

  groups = computed(() => {
    const groups = this.groupStore.entities();
    return groups.filter(group => {
      return group.members.filter(mb => mb.ieee_address === this.ieee_address()).length > 0
    })
  })

  selectGroup(event: any) {
    this.newGroupId.set(parseInt(event));
  }

  selectEndpoint(event: any) {
    this.newEndPointId.set(event);
  }

  addToGroup() {
    if ((this.newGroupId() !== null) && (this.newEndPointId() !== null)) {
      const selGroup = this.groupStore.entities().find(g => g.id === this.newGroupId());
      if (selGroup) {
        const options: AddRemoveDeviceFromGroupOptions = {
          device: this.device()!.friendly_name,
          group: selGroup.friendly_name,
          endpoint: this.newEndPointId()!
        }
        this.deviceService.addDeviceToGroup(options);
        this.newGroupId.set(null);
        this.newEndPointId.set(null);
      }
    }
  }

  removeDeviceFromGroup(groupid: number) {
    const selGroup = this.groupStore.entities().find(g => g.id === groupid);
    if ((selGroup) && (this.device())) {
      const device = this.device();
      const endpoints = selGroup.members.filter(m => m.ieee_address === device?.ieee_address).map(fg => fg.endpoint);

      endpoints.forEach(endpoint => {
        const options: AddRemoveDeviceFromGroupOptions = {
          device: this.device()!.friendly_name,
          group: selGroup.friendly_name,
          endpoint
        }
        this.deviceService.removeDeviceFromGroup(options);
      })
    }
  }
}
