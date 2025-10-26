import { Component, computed, inject, input, output, signal } from '@angular/core';
import { GroupSceneComponent } from '@/app/components/controls/groups/groupscenes/groupscenes';
import { GroupInfoComponent } from '@/app/components/controls/groups/groupinfo/groupinfo';
import { GroupStore } from '@/app/datastore/group.store';
import { PropertyTabManagerService } from '@/app/services/propertytab.service';

@Component({
  selector: 'GroupInspectorComponent',
  imports: [GroupInfoComponent, GroupSceneComponent],
  templateUrl: './groupinspector.component.html',
  styleUrl: './groupinspector.component.scss'
})
export class GroupInspectorComponent {

  protected readonly groupStore = inject(GroupStore);
    protected readonly tabManager = inject(PropertyTabManagerService);
  groupid = input.required<string | undefined>();
  panel = signal<number>(1);


  group = computed(() => {
    if (this.groupid()) {
      return this.groupStore.entities().find(g => String(g.id) === this.groupid()!)
    } else {
      return null;
    }
  })


  closeSidebar(): void {
    this.tabManager.closeTab(this.groupid()!);
  }
}
