import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DeviceStore } from '../datastore/device.store';
import { DeviceInspectorComponent } from '../pages/deviceinspector/deviceinspector.component';
import { TranslateModule } from '@ngx-translate/core';
import { ApplicationService } from '../services/app.service';
import { BridgeService } from '../services/bridge.service';
import { TimeToPipe } from '../pipes/time-togo.pipe';
import { LogView } from '../components/logview/logview';
import { ResizableContainerComponent } from '../components/controls/resizable-container/resizable-container';
import { GroupInspectorComponent } from '../pages/groupinspector/groupinspector.component';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  imports: [RouterModule, DeviceInspectorComponent, TranslateModule, TimeToPipe, LogView, ResizableContainerComponent,GroupInspectorComponent]
})
export class LayoutComponent {
  sidebarOpen = true;
  logViewOpen = true;
  host = 'localhost';

  protected readonly deviceStore = inject(DeviceStore);
  protected readonly as = inject(ApplicationService);
  protected readonly bs = inject(BridgeService);

  inspector = computed(()=>{
    return this.as.inspector();
  })

  info = computed(() => {
    const bi = this.bs.bridgeInfo;
    return bi();
  })

  rightSidebarOpen = computed(() => {
    return this.as.inspector()!==null
  })

  constructor() {
    const host = this.as.getPreference("host");
    this.host = host || 'localhost';
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleLogView() {
    this.logViewOpen = !this.logViewOpen;
  }

  closeRightSidebar() {
    this.deviceStore.setSelectedEntity(null);
  }

  permitJoin() {
    this.bs.permitJoin(this.info()?.permit_join ? 0: 254);
  }

}