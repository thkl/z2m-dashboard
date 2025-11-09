import { BridgeService } from '@/app/services/bridge.service';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, Signal, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

interface MenuItem {
  link: string,
  icon: string,
  label: string,
  func?: string,
}

const links = [
  { link: '/dashboard', icon: 'dashboard', label: 'DASHBOARD' },
  { link: '/devices', icon: 'router', label: 'DEVICES' },
  { link: '/groups', icon: 'group_work', label: 'GROUPS' },
  { link: '/network', icon: 'network_node', label: 'NETWORK' },

];

const restartLink = { link: '#', func:'restart', icon: 'reset_settings', label: 'RESTART' }

@Component({
  selector: 'AppMenuComponent',
  imports: [TranslateModule, RouterModule],
  templateUrl: './appmenu.html',
  styleUrl: './appmenu.scss',
})
export class AppMenuComponent {



  open = input.required<boolean>();

  menuItems: Signal<MenuItem[]> = computed(() => {
    const needsRestart = this.bs.bridgeInfo() && this.bs.bridgeInfo()?.restart_required === true;

    return needsRestart ? [...links, restartLink] : links;
  })

  protected readonly bs = inject(BridgeService);


  run(item: string): void {
    if (item === 'restart') {
      this.bs.requestRestart();
    }
  }

}
