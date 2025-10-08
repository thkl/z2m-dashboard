import { Component, computed, effect, input, output, signal } from '@angular/core';
import { ExpansionPanelComponent } from '../expansionpanel/expansionpanel';
import { SearchInput } from '../searchinput/searchinput';

export interface SelectOption {
  isSelected:boolean;
  label:string;
  value?:string
}

@Component({
  selector: 'OptionPanelComponent',
  imports: [ExpansionPanelComponent, SearchInput],
  templateUrl: './optionpanel.html',
  styleUrl: './optionpanel.scss'
})
export class OptionPanelComponent {
  title = input.required<string>();
  maxShown = input<number>(5);
  entities = input.required<SelectOption[]>();

  internalEntites: SelectOption[] = [];

  searchText = signal<string>('');
  optionsChanged = output<SelectOption[]>();
  
  length = computed(() => {
    const entities = this.entities();
    return Array.isArray(entities) ? entities.length : 0;
  })

  constructor() {
    effect(()=>{
      this.internalEntites = [... this.entities().filter(e=> (this.searchText()===null && this.searchText()==='') ||  e.label.toLocaleLowerCase().indexOf(this.searchText().toLocaleLowerCase())>-1)];
    })
  }


  toggle(entity:SelectOption):void {
    entity.isSelected = !entity.isSelected
    this.optionsChanged.emit(this.internalEntites);
  }

  applySearch(event:any):void {
    this.searchText.set(event);
  }
}
