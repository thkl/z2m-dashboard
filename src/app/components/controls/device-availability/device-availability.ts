import { Component, computed, input } from '@angular/core';
import { Device } from '../../../models/device';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'DeviceAvailability',
  imports: [TranslateModule],
  templateUrl: './device-availability.html',
  styleUrl: './device-availability.scss'
})
export class DeviceAvailability {
  device = input.required<Device>();

  available = computed(()=>{
    return this.device()?.state.availability === 'online';
  })
}
