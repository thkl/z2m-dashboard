import { ChangeDetectorRef, Component, effect, input, output, signal } from '@angular/core';
import { SwitchElement } from '../../../models/types';

@Component({
  selector: 'OptionComponent',
  imports: [],
  templateUrl: './option.html',
  styleUrl: './option.scss'
})
export class OptionComponent {
  item = input.required<SwitchElement>();
  active = input<boolean>(false);
  clicked = output<SwitchElement>();

  controlItem = signal<SwitchElement>({ label: "ON", isActive: false });

  constructor(private cdr: ChangeDetectorRef) {
    effect(() => {
      this.controlItem.set(this.item());
    })
  }

  event(): void {
    if ((this.active() === true) && (this.controlItem())) {
      const isActive = !this.controlItem()?.isActive;
      const newItem = { ... this.controlItem(), isActive };
      this.controlItem.set(newItem);
      this.cdr.detectChanges();
      this.clicked.emit(this.controlItem());
    }
  }
}
