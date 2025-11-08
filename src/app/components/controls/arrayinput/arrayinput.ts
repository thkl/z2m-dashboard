import { ExpansionPanelComponent } from '@/app/components/controls/expansionpanel/expansionpanel';
import { Component, computed, input, model, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'ArrayInputComponent',
  imports: [ExpansionPanelComponent,TranslateModule],
  templateUrl: './arrayinput.html',
  styleUrl: './arrayinput.scss',
})
export class ArrayInputComponent {
  items = model<string[]>([]);
  panelIsOpen = model<boolean | null>(null);
  inputText = signal<string>('');

  title = computed(() => {
    return this.items() ? this.items().join("|") : ""
  })


  applyInput(event: any): void {
    if (event !== null) {
      this.inputText.set(event.target.value)
      const old = this.items() ?? [];
      old.push(event.target.value)
      this.items.set([...old]);
      setTimeout(()=>{
        this.inputText.set("");
      },1)
    }
  }

}
