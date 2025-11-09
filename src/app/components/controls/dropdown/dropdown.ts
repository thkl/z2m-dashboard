import { Component, computed, effect, input, model, output, Signal, signal, HostListener, ElementRef } from '@angular/core';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { SelectOption } from '../../../models/types';


@Component({
  selector: 'DropdownComponent',
  imports: [OverlayModule],
  styleUrl:'./dropdown.scss',
  templateUrl: './dropdown.html',
})
export class DropdownComponent {
  isOpen = signal(false);
  items = model.required<SelectOption[]>();
  selected = output<SelectOption>();
  isInitialized = false;
  title=input<string>();
  changed = output<any>();

  controlItems = signal<SelectOption[]>([]);

  height=computed(()=>{
    return `${this.items().length*32}px`;
  })

  selectedTitle = computed(()=>{
    const hasSelectedItems = this.items().filter(item=>item.isSelected);
    return (hasSelectedItems.length>0) ? hasSelectedItems.map(item=>item.label).join("|") : this.title();
  });

  constructor(private elementRef: ElementRef) {

    effect(() => {
      if (!this.isInitialized && this.items() && this.items().length>0) {
        this.controlItems.set(this.items());
        this.isInitialized = true;
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
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

  toggle():void {
    this.isOpen.set(!this.isOpen())
  }

  selectOne(event: any): void {
    const item: SelectOption = event;
    const items = this.controlItems().map(item => {
      item.isSelected = (item.label === event.label);
      return item;
    })
    this.controlItems.set(items);

    this.selected.emit(event);
    this.changed.emit(item.value);
    this.isOpen.set(false);
    setTimeout(()=>{
      this.isInitialized = false;
    },2000);
  }
}
