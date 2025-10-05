import { Component, computed, input } from '@angular/core';
import { Expansionpanel } from '../expansionpanel/expansionpanel';
import { SearchInput } from '../searchinput/searchinput';

@Component({
  selector: 'app-optionpanel',
  imports: [Expansionpanel, SearchInput],
  templateUrl: './optionpanel.html',
  styleUrl: './optionpanel.scss'
})
export class Optionpanel {
  title = input.required<string>();
  maxShown = input<number>(5);
  entities = input.required<string[] | Set<string | undefined>>();

  length = computed(() => {
    const entities = this.entities();
    if (entities instanceof Set) {
      return entities.size;
    }
    return Array.isArray(entities) ? entities.length : 0;
  })
}
