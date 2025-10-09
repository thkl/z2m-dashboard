import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DeviceStore } from '../datastore/device.store';
import { DeviceInspectorComponent } from '../pages/deviceinspector/deviceinspector.component';
import { TranslateModule } from '@ngx-translate/core';
import { ApplicationService } from '../services/app.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  imports: [RouterModule, DeviceInspectorComponent,TranslateModule]
})
export class LayoutComponent {
  sidebarOpen = true;
  host = 'localhost';

  protected readonly deviceStore = inject(DeviceStore);
  protected readonly as = inject(ApplicationService);

  rightSidebarOpen = computed(()=>{
    return this.deviceStore.selectedEntity()!==null;
  })

  constructor() {
    this.host = this.as.settings?.host || 'localhost';
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeRightSidebar(){
    this.deviceStore.setSelectedEntity(null);
  }
 
}