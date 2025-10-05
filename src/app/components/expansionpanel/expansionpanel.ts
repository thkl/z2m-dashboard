import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-expansionpanel',
  imports: [],
  templateUrl: './expansionpanel.html',
  styleUrl: './expansionpanel.scss'
})
export class Expansionpanel {
  title = input.required<string>();
  isOpen = signal(false);

   toggle():void {
    this.isOpen.set(!this.isOpen());
   }
}
