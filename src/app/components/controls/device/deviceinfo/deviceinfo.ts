import { Component, computed, inject, input, Signal, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Dialog } from '@angular/cdk/dialog';
import { HexPipe } from '@/app/pipes/hex.pipe';
import { HumanReadablePipe } from '@/app/pipes/human.pipe';
import { RemoveDeviceDialog } from '@/app/components/dialogs/removedevicedialog/removedevicedialog';
import { RenamedeviceDialog } from '@/app/components/dialogs/renamedevicedialog/renamedevicedialog';
import { DeviceStore } from '@/app/datastore/device.store';
import { createStoreView } from '@/app/datastore/generic-store-view';
import { SearchOperator } from '@/app/datastore/generic.store';
import { Device } from '@/app/models/device';
import { RemoveDeviceOptions, RenameDeviceOptions } from '@/app/models/types';
import { SecondsToTimePipe } from '@/app/pipes/seconds-to-time.pipe';
import { DeviceService } from '@/app/services/device.service';
import { ProgessBar } from '../../progess-bar/progess-bar';
import { VendorLink } from '../../vendorlink/vendorlink';
import { DeviceAvailability } from '../device-availability/device-availability';
import { ModelLink } from '../../modellink/modellink';
import { DeviceImage } from '../device-image/device-image';
import { ApplicationService } from '@/app/services/app.service';

@Component({
  selector: 'DeviceInfoComponent',
  imports: [TranslateModule, HexPipe, HumanReadablePipe, SecondsToTimePipe, ModelLink, VendorLink, DeviceImage, DeviceAvailability,ProgessBar],
  templateUrl: './deviceinfo.html',
  styleUrl: './deviceinfo.scss'
})
export class DeviceInfoComponent {
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly deviceService = inject(DeviceService);
  protected readonly dialog = inject(Dialog)
  private readonly translate = inject(TranslateService);
  private readonly applicationService = inject(ApplicationService)

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
        this.applicationService.inspector = null;
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

  performUpdate() {
    if (this.device()) {
      this.deviceService.performUpdate(this.device()!);
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
