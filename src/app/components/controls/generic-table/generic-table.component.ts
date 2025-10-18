import { Component, input, output, signal, computed, ContentChildren, QueryList, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, effect } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ColumnDef, GenericTableConfig } from '../../../models/types';
import { CDKDataSource } from '../../../datastore/generic-store-ui';
import { TableSortDirective, SortEvent, SortDirection } from '../../../directives/table-sort.directive';
import { TableCellDirective } from '../../../directives/table-cell.directive';

@Component({
  selector: 'app-generic-table',
  templateUrl: './generic-table.component.html',
  styleUrl: './generic-table.component.scss',
  standalone: true,
  imports: [CdkTableModule, CommonModule, TranslateModule, TableSortDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenericTableComponent<T> implements AfterViewInit {
  /** Data source for the table */
  dataSource = input<CDKDataSource<T>>(undefined, { alias: 'dataSource' });

  /** Table configuration */
  config = input<GenericTableConfig<T>>(undefined, { alias: 'config' });

  /** Sort change event */
  sortChange = output<SortEvent>();

  /** Row click event */
  rowClick = output<T>();

  /** Query for all cell templates */
  @ContentChildren(TableCellDirective) cellTemplates!: QueryList<TableCellDirective>;

  /** Current sort column */
  sortColumn = signal<string>('');

  /** Current sort direction */
  sortDirection = signal<SortDirection>('');

  /** Visible columns computed from config */
  visibleColumns = computed(() => {
    const config = this.config();
    return config ? config.columns.filter((col: ColumnDef<T>) => !col.hidden) : [];
  });

  /** Display column IDs for CDK table */
  displayedColumnIds = computed(() => {
    return this.visibleColumns().map((col: ColumnDef<T>) => col.id);
  });

  constructor(private cdr: ChangeDetectorRef) {
    // Watch for config changes and trigger change detection
    effect(() => {
      const cfg = this.config();
      if (cfg?.initialSort) {
        this.sortColumn.set(cfg.initialSort.column);
        this.sortDirection.set(cfg.initialSort.direction);
      }
      // Access displayedColumnIds to trigger the computed dependency chain
      this.displayedColumnIds();
      // Trigger change detection when config changes
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    // Subscribe to datasource changes and mark for check
    // This ensures the table updates when the datasource emits new data
    const ds = this.dataSource();
    if (ds) {
      (ds as any).connect().subscribe(() => {
        this.cdr.markForCheck();
      });
    }
  }

  /**
   * Check if a column is the last visible column
   */
  isLastColumn(columnId: string): boolean {
    const visible = this.visibleColumns();
    return visible.length > 0 && visible[visible.length - 1].id === columnId;
  }

  /**
   * Get column definition by ID
   */
  getColumn(columnId: string): ColumnDef<T> | undefined {
    const config = this.config();
    return config ? config.columns.find((col: ColumnDef<T>) => col.id === columnId) : undefined;
  }

  /**
   * Handle sort events from table headers
   */
  onSort(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.sortChange.emit(event);
  }

  /**
   * Handle row click events
   */
  onRowClick(item: T): void {
    const config = this.config();
    if (config && config.onRowClick) {
      config.onRowClick(item);
    }
    this.rowClick.emit(item);
  }

  /**
   * Check if an item is currently selected
   */
  isSelected(item: T): boolean {
    const config = this.config();
    return !!(config && config.selectedItem === item);
  }

  /**
   * Track by function for performance
   */
  trackBy(index: number, item: T): any {
    const config = this.config();
    if (config && config.trackByFn) {
      return config.trackByFn(index, item);
    }
    return index;
  }

  /**
   * Get the display value for a cell (for default rendering)
   */
  getDefaultCellValue(item: T, columnId: string): any {
    return (item as any)[columnId];
  }

  /**
   * Get cell template for a specific column
   */
  getCellTemplate(columnId: string) {
    return this.cellTemplates.find(t => t.appTableCell === columnId)?.template || null;
  }

  /**
   * Track by function for columns
   */
  trackByColumnId(_index: number, column: ColumnDef<T>): string {
    return column.id;
  }
}
