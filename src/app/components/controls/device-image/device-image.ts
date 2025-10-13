import { Component, input, signal } from '@angular/core';
import { Device } from '../../../models/device';
import { InterviewState } from '../../../models/constants';

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
  /**
   * Handle image load error by setting imageError flag
   * This will trigger the fallback to default image
   */
  onImageError(): void {
    this.imageError.set(true);
  }
}
