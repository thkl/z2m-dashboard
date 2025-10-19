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

@Component({
  selector: 'GroupListComponent',
  imports: [TableComponent, TableCellDirective,TableSettingsControl],
  templateUrl: './groupslist.component.html',
  styleUrl: './groupslist.component.scss'
})
export class GroupListComponent {


  protected readonly injector = inject(Injector);
  protected readonly groupStore = inject(GroupStore);
  protected readonly applicationService = inject(ApplicationService);

  tableSettings = viewChild(TableSettingsControl);
  // Displayed columns signal for column visibility management
  displayedColumns = signal<string[]>(['id', 'friendly_name', 'members', 'scenes']);

  // Table configuration with column definitions
  tableConfig = computed<TableConfig<Group>>(() => {
    const allColumns: ColumnDef<Group>[] = [
      { id: 'id', label: 'ID', hideLabel:true, minWidth: 50, maxWidth: 50, sortable: false },
      { id: 'friendly_name', label: 'NAME', minWidth: 250, maxWidth: 450, sortable: true },
      { id: 'members', label: 'MEMBERS', minWidth: 50, maxWidth: 200, sortable: true },
      { id: 'scenes', label: 'SCENES', minWidth: 50, maxWidth: 200, sortable: true },
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
  sortColumn = signal<string>('name');
  sortDirection = signal<SortDirection>('asc');



  selectedGroup = computed(() => {
    return this.groupStore.selectedEntity();
  })

  datasourceSignal = signal<CDKDataSource<Group> | null>(null);

  get datasource(): CDKDataSource<Group> {
    return this.datasourceSignal() || new CDKDataSource(this.groupStore.entities, this.injector);
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
    this.groupStore.setSelectedEntityById(groupId);
    this.applicationService.inspector = "group";
  }
}
