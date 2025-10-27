import { Component, computed, effect, inject, signal } from '@angular/core';
import { DeviceStore } from '../../datastore/device.store';
import { TranslateModule } from '@ngx-translate/core';
import { BridgeService } from '../../services/bridge.service';
import { GroupStore } from '../../datastore/group.store';
import { Router } from "@angular/router";
import { DeviceFeaturesComponent } from '@/app/components/controls/device/devicefeatures/devicefeatures';
import { flattenExposures } from '@/app/utils/filter.utils';
import { SearchInput } from '@/app/components/controls/searchinput/searchinput';

@Component({
  selector: 'app-dashboard',
  imports: [TranslateModule,DeviceFeaturesComponent,SearchInput],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  protected readonly deviceStore = inject(DeviceStore);
  protected readonly bridgeService = inject(BridgeService);
  protected readonly groupStore = inject(GroupStore);
  protected readonly router = inject(Router);
  search = signal('');

  info = computed(() => {
    const bi = this.bridgeService.bridgeInfo;
    return bi();
  })

  filteredDevices = computed(()=>{
    const filter = this.search();
    const fl = filter ? filter.toLocaleLowerCase() : '';
    if (fl!=='') {
      return this.devicesView().filter(d=>(d.ieee_address.toLocaleLowerCase().indexOf(fl)>-1) || (d.friendly_name.toLocaleLowerCase().indexOf(fl)>-1));
    } else return this.devicesView();
  });

  applySearch(event:any):void {
    this.search.set(event    )
  }

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
