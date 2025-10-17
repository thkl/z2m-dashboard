import { Component, effect, inject, input, signal } from '@angular/core';
import { Device } from '../../../models/device';
import { InterviewState } from '../../../models/constants';
import { BridgeService } from '../../../services/bridge.service';
import { ApplicationService } from '../../../services/app.service';

@Component({
  selector: 'DeviceImage',
  imports: [],
  templateUrl: './device-image.html',
  styleUrl: './device-image.scss'
})
export class DeviceImage {
  device = input.required<Device>();
  width = input<string>("150px");
  imageError = signal(false);
  InterviewState = InterviewState;
  protected readonly appService = inject(ApplicationService);
  
  
  /**
   * Handle image load error by setting imageError flag
   * This will trigger the fallback to default image
   */
  onImageError(): void {
    this.imageError.set(true);
  }

  imageurl=signal('');

  constructor() {

    const host = this.appService.getPreference("host");
    const secure = this.appService.getPreference("secure")

    effect(()=>{
      if (this.device() && this.device().definition?.icon) {
        this.imageurl.set(`${secure?'https':'http'}://${host}/${this.device().definition?.icon}`); 
      } else {
        const image = this.device().definition.image;
        this.imageurl.set(`https://www.zigbee2mqtt.io/images/devices/${image}.png`);
      }
    })
  }
}
