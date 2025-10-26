import { Component, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'SettingsBarComponent',
  imports: [TranslateModule],
  templateUrl: './settingsbar.html',
  styleUrl: './settingsbar.scss',
})
export class SettingsBarComponent {
  settingsActive = signal<boolean>(false);


  toggleSettingsBar():void {
    this.settingsActive.set(!this.settingsActive());
  }
}
