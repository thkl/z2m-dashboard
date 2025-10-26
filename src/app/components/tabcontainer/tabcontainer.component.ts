import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyTabManagerService } from '@/app/services/propertytab.service';
 
@Component({
  selector: 'TabContainerComponent',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabcontainer.component.html',
  styleUrl: './tabcontainer.component.scss'
})
export class TabContainerComponent {
  tabManager = inject(PropertyTabManagerService);


constructor() {
    effect(()=>{
        const activeTab = this.tabManager.activeTab();
        console.log(activeTab);
    })
}

  closeTab(event: Event, tabId: string) {
    event.stopPropagation();
    this.tabManager.closeTab(tabId);
  }
}