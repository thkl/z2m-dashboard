import { Component, input, model, output, signal } from '@angular/core';
import { ColorOption } from '../../models/types';

@Component({
  selector: 'ColorSelectorComponent',
  imports: [],
  templateUrl: './colorselector.html',
  styleUrl: './colorselector.scss'
})
export class ColorSelectorComponent {

  selectedColor = model<string>('#007bff');
  buttonText = input<string>('Color');
  size = input<'sm' | 'md' | 'lg'>('sm');
  colorChange = output<string>();

  isOpen = signal(false);

  private debounceTimer: any = null;

  presetColors: ColorOption[] = [
    { name: 'Blue', value: '#007bff' },
    { name: 'Green', value: '#28a745' },
    { name: 'Red', value: '#dc3545' },
    { name: 'Orange', value: '#fd7e14' },
    { name: 'Purple', value: '#6f42c1' },
    { name: 'Teal', value: '#20c997' },
    { name: 'Pink', value: '#e83e8c' },
    { name: 'Yellow', value: '#ffc107' },
    { name: 'Indigo', value: '#6610f2' },
    { name: 'Cyan', value: '#17a2b8' },
    { name: 'Gray', value: '#6c757d' },
    { name: 'Dark', value: '#343a40' }
  ];

  toggleDropdown() {
    this.isOpen.update(value => !value);
  }

  selectColor(color: string) {
    this.selectedColor.set(color);
    this.colorChange.emit(color);
    this.isOpen.set(false);
  }

  onCustomColorChange(color: string) {
    this.selectedColor.set(color);

    // Debounce the color change event
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.colorChange.emit(color);
    }, 500);
  }

  closeDropdown() {
    this.isOpen.set(false);
  }
  
}
