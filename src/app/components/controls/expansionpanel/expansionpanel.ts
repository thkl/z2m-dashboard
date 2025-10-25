import { Component, input, output, effect, signal } from '@angular/core';
import { SearchInput } from '../searchinput/searchinput';

@Component({
  selector: 'ExpansionPanelComponent',
  imports: [SearchInput],
  templateUrl: './expansionpanel.html',
  styleUrl: './expansionpanel.scss'
})
export class ExpansionPanelComponent {
  label = input.required<string>();
  hasSearch = input<boolean>();
  setOpen = input<boolean|null>(null);
  setOpenChange = output<boolean>();

  isOpen = signal(false);  // Internal state - works in both controlled and uncontrolled modes

  colorTrigger = input<boolean>(true);
  contentClass = input<string>();
  titleClass = input<string>();

  constructor() {
    effect(() => {
      const value = this.setOpen();
      if (value !== null) {
        this.isOpen.set(value);  // Sync when parent sets it
      }
    });
  }

  toggle(): void {
    const newState = !this.isOpen();
    this.isOpen.set(newState);  // Always update internal state
    this.setOpenChange.emit(newState);  // Notify parent if listening
  }
}
