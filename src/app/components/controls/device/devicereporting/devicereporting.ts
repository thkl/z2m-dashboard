import { DropdownComponent } from '@/app/components/controls/dropdown/dropdown';
import { DeviceStore } from '@/app/datastore/device.store';
import { ClusterName, DeviceConfigSchema } from '@/app/models/bridge';
import { Device, ReportingExt } from '@/app/models/device';
import { SelectOption } from '@/app/models/types';
import { BridgeService } from '@/app/services/bridge.service';
import { createSelect, updateSelect } from '@/app/utils/sort.utils';
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
  private readonly firstChange = signal(false);

  intDevice = signal<Device | null>(null);
  reportings = signal<ReportingExt[]>([]);

  clusters = computed(() => {
    const bi = this.bridgeService.bridgeInfo;
    return bi()?.definitions?.clusters;
  })

  constructor() {
    effect(() => {
      if (!this.firstChange()) {
        this.intDevice.set(this.device());
      }
    })

    effect(() => {
      if (!this.firstChange()) {
        const device = this.intDevice();
        const reps: ReportingExt[] = [];
        let index = 0;
        if (device) {
          // Iterate thru the endpoints
          Object.entries(device.endpoints).forEach(([epid, endpoint]) => {
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

                const clusterList = [
                  ...[{ label: ' --- Available Cluster ---', value: '--sep-- avail', isSelected: false }],
                  ...createSelect(Array.from(availableClusters), [rep.cluster]),
                  ...[{ label: ' --- Possible Cluster ---', value: '--sep-- possible', isSelected: false }],
                  ...createSelect(Array.from(possibleClusters), [rep.cluster])]

                reps.push({
                  index,
                  endpoint: epid,
                  attribute: rep.attribute,
                  cluster: rep.cluster,
                  maximum_report_interval: rep.maximum_report_interval,
                  minimum_report_interval: rep.minimum_report_interval,
                  reportable_change: rep.reportable_change,
                  clusters: Array.from(new Set([...possibleClusters, ...availableClusters])),
                  visualClusterList: clusterList
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

  private updateReporting(index: number, updater: (rep: ReportingExt) => void): void {
    this.firstChange.set(true);
    const rep = this.reportings();
    if (rep) {
      const selRep = rep.find(r => r.index === index);
      if (selRep) {
        updater(selRep);
      }
    }
    this.reportings.set(rep);
  }

  changeCluster(index: number, change: SelectOption) {
    this.updateReporting(index, (rep) => {
      rep.cluster = change.value!;
      rep.visualClusterList = updateSelect(rep.visualClusterList, [change.value!]);
    });
  }

  changeAttribute(index: number, change: SelectOption) {
    this.updateReporting(index, (rep) => {
      rep.attribute = change.value!;
    });
  }

  changeMinRep(index: number, minRep: string) {
    this.updateReporting(index, (rep) => {
      rep.minimum_report_interval = parseInt(minRep);
    });
  }

  changeMaxRep(index: number, maxRep: string) {
    this.updateReporting(index, (rep) => {
      rep.maximum_report_interval = parseInt(maxRep);
    });
  }

  changeMinRepChange(index: number, rchange: string) {
    this.updateReporting(index, (rep) => {
      rep.reportable_change = parseInt(rchange);
    });
  }

  configureReporting(index: number) {
    if (this.device()) {
      const rep = this.reportings();
      const selected = rep.find(r => r.index === index);
      if (selected) {
        this.firstChange.set(false);
        this.bridgeService.configureReporting(this.device()!.friendly_name, selected);
      }
    }
  }

  
  deactivateReporting(index: number) {
    if (this.device()) {
      const rep = this.reportings();
      const selected = rep.find(r => r.index === index);
      if (selected) {
        this.firstChange.set(false);
        this.bridgeService.configureReporting(this.device()!.friendly_name, {...selected,maximum_report_interval:65535});
      }
    }
  }
}
