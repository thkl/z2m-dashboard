import { Component, computed, inject, signal } from '@angular/core';
import { DeviceStore } from '../../datastore/device.store';
import { TranslateModule } from '@ngx-translate/core';
import { DeviceService } from '../../services/device.service';

@Component({
  selector: 'app-deviceproperties',
  imports: [TranslateModule],
  templateUrl: './deviceproperties.html',
  styleUrl: './deviceproperties.scss'
})
export class DeviceProperties {
    protected readonly deviceStore = inject(DeviceStore);
     protected readonly deviceService = inject(DeviceService);
    
    device = computed(()=>{
      return this.deviceStore.selectedEntity();
    })

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

    changeDescriptions(event:any) {
      const description = event.target.value;
      if (this.device() !== null) {
        const changedDevice = {...this.device()!,description};
        this.deviceService.changeDeviceDescription(changedDevice);
      }
    }
}
