import { Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-searchinput',
  imports: [],
  templateUrl: './searchinput.html',
  styleUrl: './searchinput.scss'
})
export class SearchInput {


  searchText = signal<string>('');
  searchChange = output<string>();


  applySearch(event: any): void {
    if (event !== null) {
      this.searchText.set(event.target.value)
    } else {
      this.searchText.set('');
    }
    this.searchChange.emit(this.searchText());
  }

  alsoApply(event: any): void {
    if (event.key === 'Escape') {
      this.searchText.set('');
      this.searchChange.emit(this.searchText());
    } else {
      this.searchText.set(event.target.value);
      this.searchChange.emit(this.searchText());
    }
  }
}
