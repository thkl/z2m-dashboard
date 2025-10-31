import { InterviewState } from '@/app/models/constants';
import { Device } from '@/app/models/device';
import { ConnectionManagerService } from '@/app/services/connectionmanager.service';
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
  protected readonly connectionManager = inject(ConnectionManagerService);
  /**
   * Handle image load error by setting imageError flag
   * This will trigger the fallback to default image
   */
  onImageError(): void {
    this.imageError.set(true);
  }

  imageurl = signal('');

  constructor() {

    const selectedConnection = this.connectionManager.selectedConnection();

    const host = selectedConnection ? selectedConnection.host.replace(/^(https?:\/\/)/, "") : undefined;
    const port = selectedConnection ? selectedConnection.port : undefined;
    const secure = selectedConnection ? selectedConnection.secure : undefined;
 
    effect(() => {
      const device = this.device();

      if (device && device.definition?.icon && host) {
        this.setImage(`${secure ? 'https' : 'http'}://${host}${port ? ':'+port :''}/${device.definition?.icon}`)
      } else {
        // set the image to the model if no local icon
        if (device.definition && device.definition.model) {
          const image = device.definition.model.replaceAll("/", "-")
          this.setImage(`https://www.zigbee2mqtt.io/images/devices/${image}.png`);
        }
      }
    });

  }

  setImage(imageUrl: string): void {
    this.imageurl.set(imageUrl);
  }
}
