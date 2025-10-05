import { Component, computed, inject, signal } from '@angular/core';
import { DeviceStore } from '../../datastore/device.store';
import { DeviceService } from '../../services/device.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-deviceprop',
  imports: [TranslateModule],
  templateUrl: './deviceprop.component.html',
  styleUrl: './deviceprop.component.scss'
})
export class DevicePropertyComponent {
    protected readonly deviceStore = inject(DeviceStore);
    protected readonly deviceService = inject(DeviceService);
    panel = signal<number>(1);
    
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
