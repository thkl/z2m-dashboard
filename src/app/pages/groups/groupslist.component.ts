import { Component, computed, inject, Injector, signal, viewChild } from '@angular/core';
import { ColumnDef, TableConfig } from '../../models/types';
import { Group } from '../../models/group';
import { GroupStore } from '../../datastore/group.store';
import { SortDirection, SortEvent } from '../../directives/table-sort.directive';
import { TableCellDirective } from '../../directives/table-cell.directive';
import { TableComponent } from '../../components/controls/generic-table/generic-table.component';
import { CDKDataSource } from '../../datastore/generic-store-ui';
import { ApplicationService } from '../../services/app.service';
import { TableSettingsControl } from '../../components/tablesettings/tablesettings';
import { sortData } from '../../utils/sort.utils';
import { TranslateModule } from '@ngx-translate/core';
import { PropertyTabManagerService } from '@/app/services/propertytab.service';
import { GroupInspectorComponent } from '@/app/pages/groupinspector/groupinspector.component';
import { GroupImage } from '@/app/components/controls/groups/groupimage/groupimage';
import { SettingsBarComponent } from '@/app/components/controls/settingsbar/settingsbar';

@Component({
  selector: 'GroupListComponent',
  imports: [TableComponent, TableCellDirective, TableSettingsControl,TranslateModule,SettingsBarComponent],
  templateUrl: './groupslist.component.html',
  styleUrl: './groupslist.component.scss'
})
export class GroupListComponent {


  protected readonly injector = inject(Injector);
  protected readonly groupStore = inject(GroupStore);
  protected readonly applicationService = inject(ApplicationService);
  protected readonly tabManager = inject(PropertyTabManagerService);
  
  tableSettings = viewChild(TableSettingsControl);
  // Displayed columns signal for column visibility management
  displayedColumns = signal<string[]>(['id', 'friendly_name', 'members', 'scenes']);

  // Table configuration with column definitions
  tableConfig = computed<TableConfig<Group>>(() => {
    const allColumns: ColumnDef<Group>[] = [
      { id: 'id', label: 'ID', hideLabel: true, minWidth: 50, maxWidth: 50, sortable: true },
      { id: 'friendly_name', label: 'NAME', minWidth: 250, maxWidth: 450, sortable: true },
      { id: 'members', label: 'MEMBERS', minWidth: 50, maxWidth: 200, sortable: false },
      { id: 'scenes', label: 'SCENES', minWidth: 50, maxWidth: 200, sortable: false },
    ];

    // Hide columns that are not in the displayedColumns list
    const displayed = this.displayedColumns();
    allColumns.forEach(col => {
      col.hidden = !displayed.includes(col.id);
    });

    const selected = this.selectedGroup();
    const sortDir = this.sortDirection();
    return {
      columns: allColumns,
      trackByFn: (index: number, group: Group) => group.id || index,
      selectedItem: selected || undefined,
      onRowClick: (group: Group) => this.selectGroup(group.id),
      initialSort: {
        column: this.sortColumn(),
        direction: (sortDir === 'asc' || sortDir === 'desc') ? sortDir : 'asc'
      },
      settingsControl: this.tableSettings()
    };
  });

  // Sorting state
  sortColumn = signal<string>('id');
  sortDirection = signal<SortDirection>('asc');

  selectedGroup = computed(() => {
    return this.groupStore.selectedEntity();
  })

  datasourceSignal = signal<CDKDataSource<Group> | null>(null);

  groups = computed(() => {
    const data = this.groupStore.entities();
    return sortData<Group>(
      data,
      this.sortColumn(),
      this.sortDirection(),
      (group, column) => this.getGroupValue(group, column)
    );
  }
  )
  get datasource(): CDKDataSource<Group> {
    return this.datasourceSignal() || new CDKDataSource(this.groups, this.injector);
  }

  constructor() {
    this.applicationService.mainTitle = "GROUP_VIEW";
  }



  trackByFn(index: number, item: Group): string {
    return item.friendly_name || String(item.id); // Use unique identifier
  }


  onSort(event: SortEvent) {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
  }


  selectGroup(groupId: number) {
    const group = this.groupStore.entities().find(g=>g.id===groupId);
     if (group) {
         this.tabManager.openTab({
          id: String(groupId),
          label: group.friendly_name,
    
          data:{groupid:String(groupId)},
          component: GroupInspectorComponent,
          iconComponent:GroupImage,
          iconData:{group}
        });
      }
  }

  getGroupValue(group: Group, column: string): any {
    switch (column) {
      case 'friendly_name':
        return group.friendly_name?.toLowerCase() || '';
      case 'id':
        return group.id || 0
    }
  }

  createGroup(): void {

  }
}
