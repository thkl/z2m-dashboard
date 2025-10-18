import { Component, computed, inject, output, signal } from '@angular/core';
import { GroupStore } from '../../datastore/group.store';
import { GroupInfoComponent } from '../../components/groupinfo/groupinfo';

@Component({
  selector: 'GroupInspectorComponent',
  imports: [GroupInfoComponent],
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
