import { Component, computed, effect, inject, signal } from '@angular/core';
import { DeviceStore } from '../../datastore/device.store';
import { TranslateModule } from '@ngx-translate/core';
import { BridgeService } from '../../services/bridge.service';

@Component({
  selector: 'app-dashboard',
  imports: [TranslateModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

    protected readonly deviceStore = inject(DeviceStore);
    protected readonly bridgeService = inject(BridgeService);


    info = computed(()=>{
      const bi = this.bridgeService.getBridgeInfo();
      return bi();
    })

}
