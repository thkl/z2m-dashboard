import { Component, computed, inject, signal } from '@angular/core';
import { DeviceStore } from '../../datastore/device.store';
import { DeviceService } from '../../services/device.service';
import { TranslateModule } from '@ngx-translate/core';
import { DeviceProperties } from '../../components/deviceproperties/deviceproperties';
import { DeviceExposes } from '../../components/deviceexposes/deviceexposes';

@Component({
  selector: 'app-deviceinspector',
  imports: [TranslateModule,DeviceProperties,DeviceExposes],
  templateUrl: './deviceinspector.component.html',
  styleUrl: './deviceinspector.component.scss'
})
export class DeviceInspectorComponent {
    protected readonly deviceStore = inject(DeviceStore);
    protected readonly deviceService = inject(DeviceService);
    panel = signal<number>(1);
    
    device = computed(()=>{
      return this.deviceStore.selectedEntity();
    })

    
  }
