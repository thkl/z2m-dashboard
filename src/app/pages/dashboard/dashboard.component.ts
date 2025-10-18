import { Component, computed, effect, inject, signal } from '@angular/core';
import { DeviceStore } from '../../datastore/device.store';
import { TranslateModule } from '@ngx-translate/core';
import { BridgeService } from '../../services/bridge.service';
import { GroupStore } from '../../datastore/group.store';
import { Router } from "@angular/router";

@Component({
  selector: 'app-dashboard',
  imports: [TranslateModule],
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

  goToDevices(): void {
    this.router.navigate(["devices"]);
  }

  goToGroups(): void {
    this.router.navigate(["groups"]);
  }
}
