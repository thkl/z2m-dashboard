import { Component, computed, inject, output, signal } from '@angular/core';
import { GroupSceneComponent } from '@/app/components/controls/groups/groupscenes/groupscenes';
import { GroupInfoComponent } from '@/app/components/controls/groups/groupinfo/groupinfo';
import { GroupStore } from '@/app/datastore/group.store';

@Component({
  selector: 'GroupInspectorComponent',
  imports: [GroupInfoComponent,GroupSceneComponent],
  templateUrl: './groupinspector.component.html',
  styleUrl: './groupinspector.component.scss'
})
export class GroupInspectorComponent {

  protected readonly groupStore = inject(GroupStore);
  closed = output<void>();

  panel = signal<number>(1);


  group = computed(() => {
    return this.groupStore.selectedEntity();
  })


  closeSidebar(): void {
    this.closed.emit();
  }
}
