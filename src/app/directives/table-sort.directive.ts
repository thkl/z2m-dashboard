import { Directive, Input, Output, EventEmitter, HostListener, HostBinding, effect, signal } from '@angular/core';

export type SortDirection = 'asc' | 'desc' | '';

export interface SortEvent {
  column: string;
  direction: SortDirection;
}

@Directive({
  selector: '[appTableSort]',
  standalone: true
})
export class TableSortDirective {
  @Input('appTableSort') column!: string;
  @Input() active = signal<string>('');
  @Input() direction = signal<SortDirection>('');

  @Output() sortChange = new EventEmitter<SortEvent>();

  @HostBinding('class.sortable') sortable = true;
  @HostBinding('class.sort-asc') get isAsc() {
    return this.active() === this.column && this.direction() === 'asc';
  }
  @HostBinding('class.sort-desc') get isDesc() {
    return this.active() === this.column && this.direction() === 'desc';
  }

  @HostListener('click')
  onClick() {
    let newDirection: SortDirection;

    if (this.active() === this.column) {
      // Cycle through: asc -> desc -> none
      if (this.direction() === 'asc') {
        newDirection = 'desc';
      } else if (this.direction() === 'desc') {
        newDirection = '';
      } else {
        newDirection = 'asc';
      }
    } else {
      // New column, start with ascending
      newDirection = 'asc';
    }

    this.sortChange.emit({
      column: newDirection ? this.column : '',
      direction: newDirection
    });
  }
}
