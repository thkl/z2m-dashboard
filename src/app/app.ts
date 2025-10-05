import { Component, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DeviceService } from './services/device.service';
import { ApplicationService } from './services/app.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TranslateModule],
  providers:[DeviceService,ApplicationService],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('sigbee2mqtt-dashboard');
  protected readonly ds = inject(DeviceService);
  protected readonly as = inject(ApplicationService);
  private readonly translate = inject(TranslateService);


  constructor() {
    this.as.setHostName("https://zigbee.th-kl.de");

    // Setup translations
    this.translate.setFallbackLang('en');

    // Use browser language
    const browserLang = this.translate.getBrowserLang();
    this.translate.use(browserLang?.match(/en|de/) ? browserLang : 'en');
  }

}
