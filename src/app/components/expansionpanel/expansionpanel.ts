import { Component, input, signal } from '@angular/core';
import { SearchInput } from '../searchinput/searchinput';

@Component({
  selector: 'app-expansionpanel',
  imports: [SearchInput],
  templateUrl: './expansionpanel.html',
  styleUrl: './expansionpanel.scss'
})
export class Expansionpanel {
  title = input.required<string>();
  hasSearch = input<boolean>();
  isOpen = signal(false);

   toggle():void {
    this.isOpen.set(!this.isOpen());
   }
}
