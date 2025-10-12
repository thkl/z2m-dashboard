import { Component, computed, input, output, signal } from '@angular/core';

export interface RadioElement {
  label:string;
  value?:string;
  isActive:boolean;
  _id?:number;
}

@Component({
  selector: 'RadiolistComponent',
  imports: [],
  templateUrl: './radiolist.html',
})
export class RadiolistComponent {
  items = input.required<RadioElement[]>();
  active = input<boolean>(false);
  selected = output<RadioElement>();

  controlItems = computed(() => {
    return this.items().map((item, idx) => ({...item, _id: idx}));
  });

  private clickedIndex = signal<number | null>(null);
  private clickTimeout?: ReturnType<typeof setTimeout>;

  isItemActive(item: RadioElement, index: number): boolean {
    return item.isActive || this.clickedIndex() === index;
  }

  click(index: number):void {
    if (this.active()===true) {
      if (this.clickTimeout) {
        clearTimeout(this.clickTimeout);
      }

      this.clickedIndex.set(index);
      this.selected.emit(this.controlItems()[index]);

      this.clickTimeout = setTimeout(() => {
        this.clickedIndex.set(null);
      }, 500);
    }
  }
}
