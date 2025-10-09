import { ChangeDetectorRef, Component, computed, effect, input, output, signal } from '@angular/core';

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
  styleUrl: './radiolist.scss'
})
export class RadiolistComponent {
  items = input.required<RadioElement[]>();
  active = input<boolean>(false);
  selected = output<RadioElement>();

  controlItems = signal<RadioElement[]>([]);
  private clicked = false;

    constructor(private cdr: ChangeDetectorRef) {
    effect(()=>{
      const newValues = this.items().map((item, idx) => ({...item, _id: idx}));
      setTimeout(()=>{
        this.controlItems.set(newValues);
        this.clicked = false;
      },(this.clicked) ? 1000:0)
    })
  }

  click(index: number):void {
    if (this.active()===true) {
      const newItems = this.controlItems().map((i, idx) => ({
        ...i,
        isActive: idx === index,
        _id: idx
      }));
      this.controlItems.set(newItems);
      this.clicked = true;
      this.cdr.detectChanges();
      this.selected.emit(this.controlItems()[index]);
    }
  }
}
