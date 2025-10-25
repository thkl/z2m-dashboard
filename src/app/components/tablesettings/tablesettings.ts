import { Component, computed, input, output, Signal, signal } from '@angular/core';
import { OptionPanelComponent } from '../controls/optionpanel/optionpanel';
import { TranslateModule } from '@ngx-translate/core';
import { ColumnDef, SelectOption } from '../../models/types';

@Component({
  selector: 'TableSettingsControl',
  imports: [OptionPanelComponent, TranslateModule],
  templateUrl: './tablesettings.html',
  styleUrl: './tablesettings.scss'
})
export class TableSettingsControl {

  columnListChanged = output<string[]>();
  displayedColumns = signal<string[]>([]);
  allColumns = signal<ColumnDef<any>[]>([]);

  initalSettings = false;

  availableColumns: Signal<SelectOption[]> = computed(() => {
    if (this.allColumns) {
      const displayed = this.displayedColumns();
      return this.allColumns()!.map(c => {
        return { label: c.label, value: c.id, isSelected: displayed.includes(c.id) }
      });
    }
    return [];
  })

  constructor() {

  }

  setAllColumns(columns: ColumnDef<any>[]) {
    this.allColumns.set(columns);

    if (!this.initalSettings) {
      const ids = columns.map(c => c.id);
      this.displayedColumns.set([...ids]);
    }
  }

  setDisplayedColumns(ids: string[]) {
    this.initalSettings = true;
    this.displayedColumns.set(ids);
  }

  updateColumns(selected: SelectOption | SelectOption[]): void {
    if (Array.isArray(selected)) {
      const visibleColumns = selected.filter((c) => c.isSelected === true).map(c => c.value!);
      this.displayedColumns.set(visibleColumns);
      this.columnListChanged.emit(visibleColumns);
    }
  }
}
