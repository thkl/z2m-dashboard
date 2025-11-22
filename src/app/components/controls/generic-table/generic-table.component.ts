import { Component, input, output, signal, computed, ContentChildren, QueryList, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, effect } from '@angular/core';
import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SortDirection, SortEvent, TableSortDirective } from '@/app/directives/table-sort.directive';
import { CDKDataSource } from '@/app/datastore/generic-store-ui';
import { ColumnDef, TableConfig } from '@/app/models/types';
import { TableCellDirective } from '@/app/directives/table-cell.directive';

@Component({
  selector: 'TableComponent',
  templateUrl: './generic-table.component.html',
  styleUrl: './generic-table.component.scss',
  standalone: true,
  imports: [CdkTableModule, CommonModule, TranslateModule, TableSortDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent<T> implements AfterViewInit {
  /** Data source for the table */
  dataSource = input<CDKDataSource<T>>(undefined, { alias: 'dataSource' });

  /** Table configuration */
  config = input<TableConfig<T>>(undefined, { alias: 'config' });

  /** Column order signal for dynamic column ordering */
  columnOrderSignal = input<string[]>([], { alias: 'columnOrder' });

  /** Sort change event */
  sortChange = output<SortEvent>();

  /** Row click event */
  rowClick = output<T>();

  /** Column order change event */
  columnOrderChange = output<string[]>();

  /** Query for all cell templates */
  @ContentChildren(TableCellDirective) cellTemplates!: QueryList<TableCellDirective>;

  /** Current sort column */
  sortColumn = signal<string>('');

  /** Current sort direction */
  sortDirection = signal<SortDirection>('');

  /** Column order state */
  columnOrder = signal<string[]>([]);

  /** Currently dragging column ID */
  draggedColumnId = signal<string | null>(null);

  /** Drop target column ID */
  dropTargetColumnId = signal<string | null>(null);

  /** Sorted columns based on columnOrderSignal input */
  sortedColumns = computed(() => {
    const config = this.config();
    const order = this.columnOrderSignal();

    if (!config) return [];

    // If no order provided, return config columns as-is
    if (order.length === 0) {
      return config.columns;
    }

    return this.sortColumnsByOrder(config.columns, order);
  });

  /** Visible columns computed from sorted columns */
  visibleColumns = computed(() => {
    const sorted = this.sortedColumns();
    return sorted.filter((col: ColumnDef<T>) => !col.hidden);
  });

  /** Display column IDs for CDK table */
  displayedColumnIds = computed(() => {
    const visible = this.visibleColumns();
    const order = this.columnOrder();

    // If no custom order set, use default order from config
    if (order.length === 0) {
      return visible.map((col: ColumnDef<T>) => col.id);
    }

    // Return columns in custom order, filtering out hidden ones
    return order.filter(id => visible.some(col => col.id === id));
  });

  /** Total width of all visible columns */
  totalTableWidth = computed(() => {
    const visible = this.visibleColumns();
    return visible.reduce((sum, col) => sum + (col.maxWidth || 0), 0);
  });

  constructor(private cdr: ChangeDetectorRef) {
    // Sync internal columnOrder signal with input columnOrderSignal
    effect(() => {
      const inputOrder = this.columnOrderSignal();
      if (inputOrder.length > 0) {
        this.columnOrder.set(inputOrder);
      }
    });

    // Watch for config changes and trigger change detection
    effect(() => {
      const cfg = this.config();
      if (cfg?.initialSort) {
        this.sortColumn.set(cfg.initialSort.column);
        this.sortDirection.set(cfg.initialSort.direction);
      }

      if (cfg && cfg.settingsControl) {
        cfg.settingsControl.setAllColumns(cfg.columns);
        if (this.columnOrder().length>0) {
          cfg.settingsControl.setDisplayedColumns(this.columnOrder())
        }
      }

      // Access displayedColumnIds to trigger the computed dependency chain
      this.displayedColumnIds();
      // Trigger change detection when config changes
      this.cdr.markForCheck();
    });

    effect(() => {
      const newCo = this.columnOrder();
      const cfg = this.config();
      if (cfg && cfg.settingsControl && this.columnOrder().length>0) {
        cfg.settingsControl.setDisplayedColumns(this.columnOrder())
      }
    });


    effect(() => {
      const cfg = this.config();
      if (cfg && cfg.settingsControl) {
        // Subscribe to column changes
        cfg.settingsControl.columnListChanged.subscribe((newColumnIds: string[]) => {
          // Handle the column list change
          this.columnOrder.set(newColumnIds);
          this.columnOrderChange.emit(newColumnIds);
        });
      }
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
   * Sort columns by the specified order and mark hidden columns.
   * This utility minimizes boilerplate in components managing column visibility and order.
   */
  private sortColumnsByOrder(
    allColumns: ColumnDef<T>[],
    columnOrder: string[]
  ): ColumnDef<T>[] {
    // Map through columnOrder and find matching definitions
    const sortedColumns = columnOrder
      .map(columnId => allColumns.find(col => col.id === columnId))
      .filter((col): col is ColumnDef<T> => col !== undefined);

    // Add any remaining columns that weren't in columnOrder (for safety)
    allColumns.forEach(col => {
      if (!sortedColumns.find(sc => sc.id === col.id)) {
        sortedColumns.push(col);
      }
    });

    // Mark columns as hidden if they're not in the columnOrder list
    sortedColumns.forEach(col => {
      col.hidden = !columnOrder.includes(col.id);
    });

    return sortedColumns;
  }

  /**
   * Check if a column is the last visible column (in display order)
   */
  isLastColumn(columnId: string): boolean {
    const displayIds = this.displayedColumnIds();
    return displayIds.length > 0 && displayIds[displayIds.length - 1] === columnId;
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

  /**
   * Handle column header drag start
   */
  onColumnDragStart(event: DragEvent, columnId: string): void {
    this.draggedColumnId.set(columnId);

    // Create a ghost image from the header cell
    const headerCell = (event.target as HTMLElement).closest('th');
    if (headerCell) {
      const text = headerCell.textContent || '';
      this.createGhostImage(text, event);
    }

    event.dataTransfer!.effectAllowed = 'move';
  }

  /**
   * Create a ghost image element from a header cell
   */
  private createGhostImage(text: string, event: DragEvent): void {
    // Create a DOM element for the drag image
    const ghostElement = document.createElement('div');
    ghostElement.className = 'column-drag-ghost';
    ghostElement.textContent = text;

    document.body.appendChild(ghostElement);

    // Use the element as the drag image
    event.dataTransfer!.setDragImage(ghostElement, 75, 20);

    // Clean up after drag starts
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 0);
  }

  /**
   * Handle column header drag over
   */
  onColumnDragOver(event: DragEvent, columnId: string): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';

    const draggedId = this.draggedColumnId();
    if (draggedId && draggedId !== columnId) {
      this.dropTargetColumnId.set(columnId);
    }
  }

  /**
   * Handle column header drag leave
   */
  onColumnDragLeave(): void {
    this.dropTargetColumnId.set(null);
  }

  /**
   * Handle column header drop
   */
  onColumnDrop(event: DragEvent, targetColumnId: string): void {
    event.preventDefault();

    const draggedId = this.draggedColumnId();
    if (!draggedId || draggedId === targetColumnId) {
      this.cleanup();
      return;
    }

    // Get current order
    let order = this.columnOrder().length > 0
      ? this.columnOrder()
      : this.displayedColumnIds();

    // Find indices
    const draggedIndex = order.indexOf(draggedId);
    const targetIndex = order.indexOf(targetColumnId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Reorder the array
      const newOrder = [...order];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedId);

      this.columnOrder.set(newOrder);
      this.columnOrderChange.emit(newOrder);
    }

    this.cleanup();
  }

  /**
   * Handle column header drag end
   */
  onColumnDragEnd(): void {
    this.cleanup();
  }

  /**
   * Clean up drag state
   */
  private cleanup(): void {
    this.draggedColumnId.set(null);
    this.dropTargetColumnId.set(null);
    this.cdr.markForCheck();
  }
}
