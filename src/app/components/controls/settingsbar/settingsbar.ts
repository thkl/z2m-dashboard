import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'SettingsBarComponent',
  imports: [TranslateModule],
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
