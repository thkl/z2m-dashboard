import { Endpoint } from '@/app/models/device';
import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'DeviceEndpointComponent',
  imports: [TranslatePipe],
  templateUrl: './endpoints.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './endpoints.scss',
})
export class DeviceEndpointComponent {
  endpoints = input.required<{ [key: string]: Endpoint }>();

  // Make Object available in template
  Object = Object;

  // Or better - create a properly typed computed signal:
  endpointsArray = computed(() =>
    Object.entries(this.endpoints()).map(([key, value]) => ({
      key,
      endpoint: value as Endpoint,
    })),
  );
}
