import { Device } from '@/app/models/device';
import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'DeviceAvailability',
  imports: [TranslateModule],
  templateUrl: './device-availability.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './device-availability.scss',
})
export class DeviceAvailability {
  device = input.required<Device>();

  available = computed(() => {
    return this.device()?.state.availability === 'online';
  });
}
