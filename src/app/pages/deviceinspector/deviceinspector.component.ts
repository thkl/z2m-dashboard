import { DeviceFeaturesComponent } from '@/app/components/controls/device/devicefeatures/devicefeatures';
import { DeviceInfoComponent } from '@/app/components/controls/device/deviceinfo/deviceinfo';
import { DevicePropertiesComponent } from '@/app/components/controls/device/deviceproperties/deviceproperties';
import { DeviceStore } from '@/app/datastore/device.store';
import { DeviceService } from '@/app/services/device.service';
import { Component, computed, inject, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'DeviceInspectorComponent',
  imports: [TranslateModule,DeviceInfoComponent,DeviceFeaturesComponent,DevicePropertiesComponent],
  templateUrl: './deviceinspector.component.html',
  styleUrl: './deviceinspector.component.scss'
})
export class DeviceInspectorComponent {
    protected readonly deviceStore = inject(DeviceStore);
    protected readonly deviceService = inject(DeviceService);
    closed = output<void>();
    panel = signal<number>(1);
    
    device = computed(()=>{
      return this.deviceStore.selectedEntity();
    })

    closeSidebar():void {
      this.closed.emit();
    }
    
  }
