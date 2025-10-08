import { Component, input, signal } from '@angular/core';
import { SearchInput } from '../searchinput/searchinput';

@Component({
  selector: 'ExpansionPanelComponent',
  imports: [SearchInput],
  templateUrl: './expansionpanel.html',
  styleUrl: './expansionpanel.scss'
})
export class ExpansionPanelComponent {
  title = input.required<string>();
  hasSearch = input<boolean>();
  isOpen = signal(false);

   toggle():void {
    this.isOpen.set(!this.isOpen());
   }
}
