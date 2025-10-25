import { Component, computed, effect, input, model, output, signal } from '@angular/core';
import { ExpansionPanelComponent } from '../expansionpanel/expansionpanel';
import { SearchInput } from '../searchinput/searchinput';
import { SelectOption } from '../../../models/types';
import { TranslateModule } from '@ngx-translate/core';

export interface PanelOptions {
  useSearch?: boolean,
  showSelection?: boolean,
  multi?: boolean,
  maxShown?: number,
}

@Component({
  selector: 'OptionPanelComponent',
  imports: [ExpansionPanelComponent, SearchInput, TranslateModule],
  templateUrl: './optionpanel.html',
  styleUrl: './optionpanel.scss'
})
export class OptionPanelComponent {
  title = input.required<string>();
  entities = input.required<SelectOption[]>();
  options = input<Partial<PanelOptions>>({});

  resolvedOptions = computed(() => ({
    useSearch: this.options()?.useSearch ?? true,
    showSelection: this.options()?.showSelection ?? true,
    multi: this.options()?.multi ?? true,
    maxShown: this.options()?.maxShown ?? 5,
  }));

  internalEntites: SelectOption[] = [];
  panelIsOpen = model<boolean|null>(null);
  searchText = signal<string>('');
  optionsChanged = output<SelectOption | SelectOption[]>();

  length = computed(() => {
    const entities = this.entities();
    return Array.isArray(entities) ? entities.length : 0;
  })

  constructor() {
    effect(() => {
      this.internalEntites = [... this.entities().filter(e => (this.searchText() === null && this.searchText() === '') || e.label.toLocaleLowerCase().indexOf(this.searchText().toLocaleLowerCase()) > -1)];
    })
  }


  toggle(entity: SelectOption): void {
    if (this.resolvedOptions().multi===true) {
    entity.isSelected = !entity.isSelected
    this.optionsChanged.emit(this.internalEntites);
    } else {
      this.optionsChanged.emit(entity);
      this.panelIsOpen.set(false);
    }
  }

  applySearch(event: any): void {
    this.searchText.set(event);
  }
}
