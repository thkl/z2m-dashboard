import { Component, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DeviceService } from './services/device.service';
import { ApplicationService } from './services/app.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BridgeService } from './services/bridge.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TranslateModule],
  providers: [],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('sigbee2mqtt-dashboard');
  protected readonly bs = inject(BridgeService);
  protected readonly ds = inject(DeviceService);
  protected readonly as = inject(ApplicationService);
  private readonly translate = inject(TranslateService);
  private readonly darkClass = 'dark-theme';
  private readonly storageKey = 'theme';

  constructor() {
    this.as.setHostName("https://zigbee.th-kl.de");

    // Setup translations
    this.translate.setFallbackLang('en');

    // Use browser language
    const browserLang = this.translate.getBrowserLang();
    this.translate.use(browserLang?.match(/en|de/) ? browserLang : 'en');


    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    if (prefersDark.matches) {
      this.enableDarkMode();
    }
  }


  enableDarkMode(): void {
    document.body.classList.add(this.darkClass);
    localStorage.setItem(this.storageKey, 'dark');
  }
}
