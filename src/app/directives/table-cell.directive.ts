import { Directive, Input } from '@angular/core';
import { TemplateRef } from '@angular/core';

/**
 * Structural directive for defining table cell templates in generic-table component
 * Usage: <ng-template appTableCell="columnId" let-item>{{ item.property }}</ng-template>
 */
@Directive({
  selector: '[appTableCell]',
  standalone: true
})
export class TableCellDirective {
  @Input() appTableCell!: string;

  constructor(public template: TemplateRef<any>) {}
}
