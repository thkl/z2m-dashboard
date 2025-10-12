import { Component, computed, inject, input, Signal, signal } from '@angular/core';
import { DeviceStore } from '../../datastore/device.store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DeviceService } from '../../services/device.service';
import { HexPipe } from '../../pipes/hex.pipe';
import { HumanReadablePipe } from '../../pipes/human.pipe';
import { Device } from '../../models/device';
import { createStoreView } from '../../datastore/generic-store-view';
import { SearchOperator } from '../../datastore/generic.store';
import { Dialog } from '@angular/cdk/dialog';
import { RemoveDeviceOptions, RenameDeviceOptions } from '../../models/types';
import { RemoveDeviceDialog } from '../dialogs/removedevicedialog/removedevicedialog';
import { RenamedeviceDialog } from '../dialogs/renamedevicedialog/renamedevicedialog';
import { ModelLink } from '../controls/modellink/modellink';
import { VendorLink } from '../controls/vendorlink/vendorlink';

@Component({
  selector: 'DeviceInfoComponent',
  imports: [TranslateModule, HexPipe, HumanReadablePipe,ModelLink,VendorLink],
  templateUrl: './deviceinfo.html',
  styleUrl: './deviceinfo.scss'
})
export class DeviceInfoComponent {
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly deviceService = inject(DeviceService);
  protected readonly dialog = inject(Dialog)
  private readonly translate = inject(TranslateService);

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

  deleteDevice() {


    const dialogRef = this.dialog.open(RemoveDeviceDialog, {
      height: '400px',
      width: '600px',
      data: { device: this.device() }
    });

    dialogRef.closed.subscribe(result => {
      if (result !== undefined && this.device() !== null) {
        this.deviceService.removeDevice(result as RemoveDeviceOptions);
        this.deviceStore.setSelectedEntity(null);
      }
    });
  }

  changeDescriptions(event: any) {
    const description = event.target.value;
    if (this.device() !== null) {
      const changedDevice = { ...this.device()!, description };
      this.deviceService.changeDeviceDescription(changedDevice);
    }
  }

  renameDevice() {
    if (this.device()) {

      const data: RenameDeviceOptions = {
        device: this.device()!,
        newName: this.device()!.friendly_name,
        renameHomeAssiatant: false
      }

      const dialogRef = this.dialog.open(RenamedeviceDialog, {
        height: '400px',
        width: '600px',
        data
      });

      dialogRef.closed.subscribe(result => {
        if (result !== undefined && this.device() !== null) {
          this.deviceService.renameDevice(data);
        }
      });
    }
  }
}
