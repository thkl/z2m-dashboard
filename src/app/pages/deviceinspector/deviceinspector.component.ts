import { Component, computed, inject, output, signal } from '@angular/core';
import { DeviceStore } from '../../datastore/device.store';
import { DeviceService } from '../../services/device.service';
import { TranslateModule } from '@ngx-translate/core';
import { DeviceProperties } from '../../components/deviceproperties/deviceproperties';
import { DeviceFeaturesComponent } from '../../components/devicefeatures/devicefeatures';

@Component({
  selector: 'app-deviceinspector',
  imports: [TranslateModule,DeviceProperties,DeviceFeaturesComponent],
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
