import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DeviceStore } from '../datastore/device.store';
import { DeviceInspectorComponent } from '../pages/deviceinspector/deviceinspector.component';
import { TranslateModule } from '@ngx-translate/core';
import { ApplicationService } from '../services/app.service';
import { BridgeService } from '../services/bridge.service';
 
import { LogView } from '../components/logview/logview';
import { ResizableContainerComponent } from '../components/controls/resizable-container/resizable-container';
import { GroupInspectorComponent } from '../pages/groupinspector/groupinspector.component';
import { Dialog } from '@angular/cdk/dialog';
import { ChooseServerDialog, ChooseServerDialogData } from '../components/dialogs/chooseserver/chooseserver';
import { Z2MServer } from '../models/types';
import { TabContainerComponent } from '@/app/components/tabcontainer/tabcontainer.component';
import { PropertyTabManagerService } from '@/app/services/propertytab.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  imports: [RouterModule, TranslateModule, LogView, ResizableContainerComponent, TabContainerComponent]
})
export class LayoutComponent {
  sidebarOpen = true;
  logViewOpen = true;
  host = 'localhost';

  protected readonly deviceStore = inject(DeviceStore);
  protected readonly applicationService = inject(ApplicationService);
  protected readonly bs = inject(BridgeService);
  protected readonly dialog = inject(Dialog);
  protected readonly tabManager = inject(PropertyTabManagerService);

  
  mainTitle = computed(() => {
    return this.applicationService.mainTitle();
  })

  inspector = computed(() => {
    return this.applicationService.inspector();
  })

  connectedHost = computed(()=>{
    return this.applicationService.connectedHost();
  })

  info = computed(() => {
    const bi = this.bs.bridgeInfo;
    return bi();
  })

  rightSidebarOpen = computed(() => {
    return this.tabManager.numberOfTabs() > 0;
  })

  constructor() {
    const host = this.applicationService.getPreference("host");

    this.host = host;
    if (!host) {
      this.openServerDialog()
    }

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


  openServerDialog() {

    let knownServerList: Z2MServer[] = [];
    try {
      const ks =  this.applicationService.getPreference("saved_hosts");
      if (ks) {
        Object.keys(ks).forEach(sn => {
          knownServerList.push(ks[sn])
        })
      }
    } catch (e) { console.error(e);}
    const data: ChooseServerDialogData = {
      knownServer: knownServerList
    }
    console.log(data);
    const dialogRef = this.dialog.open(ChooseServerDialog, {
      height: '400px',
      width: '600px',
      data
    });

    dialogRef.closed.subscribe((result: unknown) => {
      if (result !== undefined) {
        const dr = result as ChooseServerDialogData 
        console.log("Try connecting",dr.newServer)
        this.applicationService.saveAndConnect(dr.newServer!)
      }
    });
  }

}