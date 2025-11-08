import { ExpansionPanelComponent } from '@/app/components/controls/expansionpanel/expansionpanel';
import { Component, computed, effect, input, model, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'ArrayInputComponent',
  imports: [ExpansionPanelComponent, TranslateModule],
  templateUrl: './arrayinput.html',
  styleUrl: './arrayinput.scss',
})
export class ArrayInputComponent {
  items = model<string[]>([]);
  panelIsOpen = model<boolean | null>(null);
  inputText = signal<string>('');
  changed = output<string[]>();
  title = computed(() => {
    return Array.isArray(this.items()) ? this.items().join("|") : ""
  })


  constructor() {
     
  }

  applyInput(event: any): void {
    if (event !== null) {
      const text:string = event.target.value
      const newItems:string[] = Array.isArray(this.items()) ? this.items() : [];
      newItems.push(text);
      this.items.set([...newItems]);
      this.inputText.set("");
      this.changed.emit(newItems);
    }
  }


  remove(item: string) {
    if (this.items()) {
      const newitems = this.items().filter(i => i !== item);
      this.items.set([...newitems]);
      this.changed.emit(newitems);
    }
  }


}
