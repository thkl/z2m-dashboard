import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DeviceStore } from '../datastore/device.store';
import { TranslateModule } from '@ngx-translate/core';
import { ApplicationService } from '../services/app.service';
import { BridgeService } from '../services/bridge.service';

import { LogView } from '../components/logview/logview';
import { ResizableContainerComponent } from '../components/controls/resizable-container/resizable-container';
import { Dialog } from '@angular/cdk/dialog';
import { ChooseServerDialog, ChooseServerDialogData } from '../components/dialogs/chooseserver/chooseserver';
import { Z2MServer } from '../models/types';
import { TabContainerComponent } from '@/app/components/tabcontainer/tabcontainer.component';
import { PropertyTabManagerService } from '@/app/services/propertytab.service';
import { SignalBusService } from '@/app/services/sigbalbus.service';
import { ConnectionManagerService } from '@/app/services/connectionmanager.service';
import { SettingsService } from '@/app/services/settings.service';
import { VersionDisplayComponent } from '../components/version-display/version-display.component';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  imports: [RouterModule, TranslateModule, LogView, ResizableContainerComponent, TabContainerComponent, VersionDisplayComponent]
})
export class LayoutComponent {
  sidebarOpen = true;
  logViewOpen = true;
  host = 'localhost';
  connectionDialogOpen = false;

  leftSidebarWidth = signal<number>(256);
  rightSidebarWidth = signal<number>(450);

  protected readonly deviceStore = inject(DeviceStore);
  protected readonly applicationService = inject(ApplicationService);
  protected readonly bs = inject(BridgeService);
  protected readonly dialog = inject(Dialog);
  protected readonly tabManager = inject(PropertyTabManagerService);
  protected readonly signalBusService = inject(SignalBusService);
  protected readonly connectionManager = inject(ConnectionManagerService);
  protected readonly settingsService = inject(SettingsService);

  mainTitle = computed(() => {
    return this.applicationService.mainTitle();
  })

  inspector = computed(() => {
    return this.applicationService.inspector();
  })

  connectedHost = computed(() => {
    return this.connectionManager.connectedHost();
  })

  info = computed(() => {
    const bi = this.bs.bridgeInfo;
    return bi();
  })

  rightSidebarOpen = computed(() => {
    return this.tabManager.numberOfTabs() > 0;
  })

  noSavedConnectionSignal = this.signalBusService.onEvent<string>('connection_error');

  constructor() {

    effect(() => {
      const sgn = this.noSavedConnectionSignal();
      if (sgn !== null && (sgn.data === "NO_LASTSAVED_CONNECTION" || sgn.data === "error_connecting")) {
        this.openServerDialog(sgn.data)
        this.signalBusService.reset("connection_error");
      }
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleLogView() {
    this.logViewOpen = !this.logViewOpen;
  }

  closeRightSidebar() {
    this.deviceStore.setSelectedEntity(null);
    this.applicationService.inspector = null;
  }


  openServerDialog(message: string) {
    if (this.connectionDialogOpen) {
      return;
    }
    this.connectionDialogOpen = true;
    let knownServerList: Z2MServer[] = [];
    try {
      const ks = this.settingsService.getPreference("saved_hosts");
      if (ks) {
        Object.keys(ks).forEach(sn => {
          knownServerList.push(ks[sn])
        })
      }
    } catch (e) { console.error(e); }

    const data: ChooseServerDialogData = {
      knownServer: knownServerList,
      message
    }

    const dialogRef = this.dialog.open(ChooseServerDialog, {
      height: '400px',
      width: '600px',
      data
    });

    dialogRef.closed.subscribe((result: unknown) => {
      this.connectionDialogOpen = false;
      if (result !== undefined) {
        const dr = result as ChooseServerDialogData
        console.log("Try connecting", dr.newServer)
        setTimeout(() => {
          this.connectionManager.saveAndConnect(dr.newServer!)
        }, 500);
      }
    });
  }

}