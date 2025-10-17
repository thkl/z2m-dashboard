import { Component, computed, effect, input, model, output, Signal, signal } from '@angular/core';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { SelectOption } from '../../../models/types';


@Component({
  selector: 'DropdownComponent',
  imports: [OverlayModule],
  templateUrl: './dropdown.html',
})
export class DropdownComponent {
  isOpen = signal(false);
  items = model.required<SelectOption[]>();
  selected = output<SelectOption>();
  isInitialized = false;
  title=input<string>();

  controlItems = signal<SelectOption[]>([]);

  constructor() {

    effect(() => {
      if (!this.isInitialized && this.items() && this.items().length>0) {
        this.controlItems.set(this.items());
        this.isInitialized = true;
      }
    });
  }

  selectedLabel = computed(() => {
    const items = this.controlItems();
    const sel = items.find(i => i.isSelected === true);
    console.log(sel)
    return sel ? sel.label : '---';
  })

  positions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetX: 0
    },
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetX: 0
    }
  ];

  selectOne(event: any): void {
    const items = this.controlItems().map(item => {
      item.isSelected = (item.label === event.label);
      return item;
    })
    this.controlItems.set(items);

    this.selected.emit(event);
    this.isOpen.set(false);
    setTimeout(()=>{
      this.isInitialized = false;
    },2000);
  }
}
