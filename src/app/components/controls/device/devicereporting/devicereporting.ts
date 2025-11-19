import { DeviceStore } from '@/app/datastore/device.store';
import { DeviceConfigSchema } from '@/app/models/bridge';
import { Device, ReportingExt } from '@/app/models/device';
import { BridgeService } from '@/app/services/bridge.service';
import { Component, computed, inject, input, Signal } from '@angular/core';

@Component({
  selector: 'DeviceReportingComponent',
  imports: [],
  templateUrl: './devicereporting.html',
  styleUrl: './devicereporting.scss',
})

export class DeviceReportingComponent {
  device = input.required<Device | null>()
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly bridgeService = inject(BridgeService);

  bridgeDeviceOptions: Signal<DeviceConfigSchema | undefined> = computed(() => {
    const bi = this.bridgeService.bridgeInfo;
    return bi()?.config_schema.definitions.device;
  });


  reportings = computed(() => {
    const device = this.device();
    const reps: ReportingExt[] = [];
    if (device) {
      // Iterate thru the endpoints
      Object.keys(device.endpoints).forEach(epid => {
        const endpoint = device.endpoints[epid];
        const configured_reportings = endpoint.configured_reportings;
        if (Array.isArray(configured_reportings)) {
          configured_reportings.forEach(rep => {
            reps.push({
              endpoint: epid,
              attribute: rep.attribute,
              cluster: rep.cluster,
              maximum_report_interval: rep.maximum_report_interval,
              minimum_report_interval: rep.minimum_report_interval,
              reportable_change: rep.reportable_change
            });
          })
        }
      });
    }
    return reps;
  })
}
