import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'SettingsBarComponent',
  imports: [TranslatePipe],
  templateUrl: './settingsbar.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './settingsbar.scss',
})
export class SettingsBarComponent {
  settingsActive = signal<boolean>(false);

  toggleSettingsBar(): void {
    this.settingsActive.set(!this.settingsActive());
  }
}
