import { Component, computed, inject, input, signal, Signal } from '@angular/core';

import { OptionPanelComponent } from '@/app/components/controls/optionpanel/optionpanel';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DeviceFeaturesComponent } from '@/app/components/controls/device/devicefeatures/devicefeatures';
import { GroupStore } from '@/app/datastore/group.store';
import { DeviceStore } from '@/app/datastore/device.store';
import { DeviceService } from '@/app/services/device.service';
import { createStoreView } from '@/app/datastore/generic-store-view';

import { SearchOperator } from '@/app/datastore/generic.store';
import { Group } from '@/app/models/group';
import { Device } from '@/app/models/device';
import { AddRemoveDeviceFromGroupOptions, SelectOption } from '@/app/models/types';
import { ExpansionPanelDeviceComponent } from '@/app/components/controls/expansionpanel-device/expansionpanel-device';


@Component({
  selector: 'GroupInfoComponent',
  imports: [TranslateModule,ExpansionPanelDeviceComponent, DeviceFeaturesComponent, OptionPanelComponent],
  templateUrl: './groupinfo.html',
  styleUrl: './groupinfo.scss'
})
export class GroupInfoComponent {

  protected readonly groupStore = inject(GroupStore);
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly deviceService = inject(DeviceService);
  protected readonly translate = inject(TranslateService);

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

  selectedDevice = signal<Device | null>(null);
  selectedEndpointId = signal<string | null>(null);

  deviceSelectorTitle = computed(() => {
    const d = this.selectedDevice();
    return d !== null ? d.friendly_name : this.translate.instant("SELECT_DEVICE")
  });

  selectedDeviceEndPoints = computed(() => {
    const d = this.selectedDevice();
    return (d !== null) ? Object.keys(d.endpoints).map((e: string) => {
      return { label: e, value: e, isSelected: false }
    }) : [];
  })


  endPointSelectorTitle = computed(() => {
    const epd = this.selectedEndpointId();
    return epd !== null ? this.translate.instant("ENDPOINT_",{id:epd}) : this.translate.instant("ENDPOINT")
  });


  availabelDevices = createStoreView(this.deviceStore, {
    criteria: [
      { property: "type", value: "Coordinator", operator: "not" }
    ],
    logicalOperator: SearchOperator.AND
  }, false, undefined);

  deviceNameList = computed(() => {
    const dv = this.availabelDevices();
    return dv.map((d: Device) => {
      return {
        isSelected: false,
        label: d.friendly_name,
        value: d.ieee_address
      } as SelectOption
    }
    ).sort((a:SelectOption,b:SelectOption)=>{
      if (a.label > b.label) return 1;
      if (a.label < b.label) return -1;
      return 0;
    });
  })

  renameGroup() {
    console.log(this.group());
  }

  deleteGroup() {
    console.log(this.group());
  }

  removeDeviceFromGroup(device: Device, endpoint: string) {
    if (this.group()) {
      const options: AddRemoveDeviceFromGroupOptions = {
        device: device.friendly_name,
        group: this.group()!.friendly_name,
        endpoint
      }
      this.deviceService.removeDeviceFromGroup(options);
    }
  }

  addDevice(): void {
    const device = this.selectedDevice();
    const endpoint = this.selectedEndpointId();
    const group = this.group();
    if (device && endpoint && group) {

      const options: AddRemoveDeviceFromGroupOptions = {
        device: device.friendly_name,
        group: group.friendly_name,
        endpoint: endpoint
      }

      this.deviceService.addDeviceToGroup(options);
      this.selectedDevice.set(null);
      this.selectedEndpointId.set(null);
    }
  }

  selectNewDevice(selected: any) {
    const device = this.availabelDevices().find((d: Device) => d.ieee_address === selected.value);
    if (device) {
      this.selectedDevice.set(device);
      // if there is just one EP in the device select it
      const eps = device.endpoints;
      if (eps) {
        if (Object.keys(eps).length === 1) {
          const firstEP = Object.keys(eps)[0];
          this.selectedEndpointId.set(firstEP);
        }
      } else {
        this.selectedEndpointId.set(null);
      }
    }
  }

  selectNewEndPoint(selected: any) {
    const device = this.selectedDevice();
    if (device) {
      const epid = selected.value;
      this.selectedEndpointId.set(epid);
    }
  }
}
