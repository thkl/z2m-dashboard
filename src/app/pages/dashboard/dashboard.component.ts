import { Component, computed, effect, inject, signal } from '@angular/core';
import { DeviceStore } from '../../datastore/device.store';
import { TranslateModule } from '@ngx-translate/core';
import { BridgeService } from '../../services/bridge.service';
import { GroupStore } from '../../datastore/group.store';
import { Router } from "@angular/router";
import { DeviceFeaturesComponent } from '@/app/components/controls/device/devicefeatures/devicefeatures';
import { flattenExposures } from '@/app/utils/filter.utils';

@Component({
  selector: 'app-dashboard',
  imports: [TranslateModule,DeviceFeaturesComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  protected readonly deviceStore = inject(DeviceStore);
  protected readonly bridgeService = inject(BridgeService);
  protected readonly groupStore = inject(GroupStore);
  protected readonly router = inject(Router);

  info = computed(() => {
    const bi = this.bridgeService.bridgeInfo;
    return bi();
  })

  devicesView = computed(()=>{
    const devices = this.deviceStore.entities().filter(d=>d.type !== 'Coordinator');
    //filter devices with 0 dashboard features;
    return devices.filter(device => {
      const expos = device.definition.exposes;
      const states = device.state;
      const result = flattenExposures(expos || [], states || []);
      return result.filter(exp=>exp.validForDashboard).length>0
    })
  });

  goToDevices(): void {
    this.router.navigate(["devices"]);
  }

  goToGroups(): void {
    this.router.navigate(["groups"]);
  }
}
