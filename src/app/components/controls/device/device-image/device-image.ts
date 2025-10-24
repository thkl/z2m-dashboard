import { InterviewState } from '@/app/models/constants';
import { Device } from '@/app/models/device';
import { ApplicationService } from '@/app/services/app.service';
import { Component, effect, inject, input, signal } from '@angular/core';

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

  imageurl = signal('');

  constructor() {

    const host = this.appService.getPreference("host");
    const secure = this.appService.getPreference("secure")

    effect(() => {
      const device = this.device();
      if (device && device.definition?.icon) {
        this.setImage(`${secure ? 'https' : 'http'}://${host}/${device.definition?.icon}`)
      } else {
        const image = this.device().definition.image;
        this.setImage(`https://www.zigbee2mqtt.io/images/devices/${image}.png`);
      }
    });

  }

  setImage(imageUrl: string): void {
    this.imageurl.set(imageUrl);
  }
}
