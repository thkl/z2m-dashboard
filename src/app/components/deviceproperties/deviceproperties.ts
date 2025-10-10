import { Component, computed, inject, input, Signal, signal } from '@angular/core';
import { DeviceStore } from '../../datastore/device.store';
import { TranslateModule } from '@ngx-translate/core';
import { DeviceService } from '../../services/device.service';
import { HexPipe } from '../../pipes/hex.pipe';
import { HumanReadablePipe } from '../../pipes/human.pipe';
import { Device } from '../../models/device';
import { createStoreView } from '../../datastore/generic-store-view';
import { SearchOperator } from '../../datastore/generic.store';

@Component({
  selector: 'app-deviceproperties',
  imports: [TranslateModule, HexPipe, HumanReadablePipe],
  templateUrl: './deviceproperties.html',
  styleUrl: './deviceproperties.scss'
})
export class DeviceProperties {
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly deviceService = inject(DeviceService);

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


  startInterview() {
    if (this.device() !== null) {
      this.deviceService.startInterview(this.device()!);
    }
  }

  startReconfig() {
    if (this.device() !== null) {
      this.deviceService.startReconfig(this.device()!);
    }
  }

  changeDescriptions(event: any) {
    const description = event.target.value;
    if (this.device() !== null) {
      const changedDevice = { ...this.device()!, description };
      this.deviceService.changeDeviceDescription(changedDevice);
    }
  }
}
