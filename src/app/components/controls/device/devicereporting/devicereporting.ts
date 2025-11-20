import { DropdownComponent } from '@/app/components/controls/dropdown/dropdown';
import { OptionPanelComponent } from '@/app/components/controls/optionpanel/optionpanel';
import { DeviceStore } from '@/app/datastore/device.store';
import { ClusterName, DeviceConfigSchema } from '@/app/models/bridge';
import { Device, ReportingExt } from '@/app/models/device';
import { SelectOption } from '@/app/models/types';
import { BridgeService } from '@/app/services/bridge.service';
import { createSelect } from '@/app/utils/sort.utils';
import { Component, computed, effect, inject, input, signal, Signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'DeviceReportingComponent',
  imports: [TranslateModule, DropdownComponent],
  templateUrl: './devicereporting.html',
  styleUrl: './devicereporting.scss',
})

export class DeviceReportingComponent {
  device = input.required<Device | null>()
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly bridgeService = inject(BridgeService);
  firstChange = false;

  intDevice = signal<Device | null>(null);
  reportings = signal<ReportingExt[]>([]);

  clusters = computed(() => {
    const bi = this.bridgeService.bridgeInfo;
    return bi()?.definitions?.clusters;
  })

  constructor() {
    effect(() => {
      if (!this.firstChange) {
        this.intDevice.set(this.device());
      }
    })

    effect(() => {
      if (!this.firstChange) {
        const device = this.intDevice();
        const reps: ReportingExt[] = [];
        let index = 0;
        if (device) {
          // Iterate thru the endpoints
          Object.keys(device.endpoints).forEach(epid => {
            const endpoint = device.endpoints[epid];
            const configured_reportings = endpoint.configured_reportings;
            if (Array.isArray(configured_reportings)) {
              configured_reportings.forEach(rep => {

                const possibleClusters = new Set<string>();
                const availableClusters = new Set<string>();

                for (const outputCluster of endpoint.clusters.output) {
                  availableClusters.add(outputCluster);
                }

                for (const inputCluster of endpoint.clusters.input) {
                  if (!availableClusters.has(inputCluster)) {
                    possibleClusters.add(inputCluster);
                  }
                }

                const merged = new Set([...possibleClusters, ...availableClusters]);

                reps.push({
                  index,
                  endpoint: epid,
                  attribute: rep.attribute,
                  cluster: rep.cluster,
                  maximum_report_interval: rep.maximum_report_interval,
                  minimum_report_interval: rep.minimum_report_interval,
                  reportable_change: rep.reportable_change,
                  clusters:Array.from(merged),
                  availableClusters: createSelect(Array.from(merged), [rep.cluster])
                });
                index = index + 1;
              })
            }
          });
        }
        this.reportings.set(reps);
      }
    })
  }

  bridgeDeviceOptions: Signal<DeviceConfigSchema | undefined> = computed(() => {
    const bi = this.bridgeService.bridgeInfo;
    return bi()?.config_schema.definitions.device;
  });

  attributesForCluster(cluster: string, selected: string): SelectOption[] {
    const bi = this.bridgeService.bridgeInfo()
    if (bi && bi.definitions) {
      const cn: ClusterName = cluster as ClusterName;
      const clusterdef = bi.definitions.clusters[cn];
      if (clusterdef) {
        return Object.keys(clusterdef.attributes).map(attrName => { return { label: attrName, value: attrName, isSelected: (attrName === selected) } });
      }
    }
    return [];
  }

  changeCluster(index: number, change: SelectOption) {
    const cluster = change.value!;
    this.firstChange = true;
    const rep = this.reportings();
    if (rep) {
      const selRep = rep.find(r=>r.index===index);
      if (selRep) {
        selRep.cluster = cluster;
        selRep.availableClusters = createSelect(selRep.clusters, [cluster])
      }
    }
    this.reportings.set(rep);
  }

}
