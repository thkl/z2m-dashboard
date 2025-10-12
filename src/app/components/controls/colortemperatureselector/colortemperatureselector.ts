import { Component, effect, input, model, output, signal } from '@angular/core';
import { ColorTemperatureOption } from '../../../models/types';
import { miredToHtmlRgb, miredToKelvin } from '../../../utils/color.util';
 
@Component({
  selector: 'ColorTemperatureSelectorComponent',
  imports: [],
  templateUrl: './colortemperatureselector.html',
  styleUrl: './colortemperatureselector.scss'
})
export class ColorTemperatureSelectorComponent {

  selectedMireds = model<number>(250); // Default to ~4000K
  buttonText = model<string>('Temperature');
  size = input<'sm' | 'md' | 'lg'>('sm');
  presetTemperatures = input<ColorTemperatureOption[]>([]);
  temperatureChange = output<number>();

  isOpen = signal(false);

  private debounceTimer: any = null;

  constructor() {
  effect(()=>{
    const matchedPreset = this.presetTemperatures().find(p=>p.value===this.selectedMireds()); 
    if (matchedPreset) {
      this.buttonText.set(matchedPreset.name);
    }
  });
}

  toggleDropdown() {
    this.isOpen.update(value => !value);
  }

  selectTemperature(mireds: number) {
    this.selectedMireds.set(mireds);
    this.temperatureChange.emit(mireds);
    this.isOpen.set(false);
  }

  onCustomTemperatureChange(mireds: number) {
    this.selectedMireds.set(mireds);

    // Debounce the temperature change event
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.temperatureChange.emit(mireds);
    }, 500);
  }

  closeDropdown() {
    this.isOpen.set(false);
  }

  getTemperatureColor(mireds: number): string {
    return miredToHtmlRgb(mireds);
  }

  getTemperatureKelvin(mireds: number): number {
    return miredToKelvin(mireds);
  }

}
