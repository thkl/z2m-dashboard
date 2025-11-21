import { DropdownComponent } from '@/app/components/controls/dropdown/dropdown';
import { DeviceStore } from '@/app/datastore/device.store';
import { ClusterName, DeviceConfigSchema } from '@/app/models/bridge';
import { Device, Endpoint, Reporting, ReportingExt } from '@/app/models/device';
import { SelectOption } from '@/app/models/types';
import { BridgeService } from '@/app/services/bridge.service';
import { SignalBusService } from '@/app/services/sigbalbus.service';
import { createSelect, updateSelect } from '@/app/utils/sort.utils';
import { Component, computed, effect, inject, Injector, input, runInInjectionContext, signal, Signal, ChangeDetectionStrategy } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

const emptyReporting = {
  index: 0,
  endpoint: '',
  attribute: '',
  cluster: '',
  maximum_report_interval: 3600,
  minimum_report_interval: 60,
  reportable_change: 1,
  clusters: [],
  visualClusterList: []
};

/**
 * Device Reporting Configuration Component
 *
 * Manages the configuration of device reporting intervals and attributes for Zigbee devices.
 * Allows users to create, update, and deactivate reporting configurations for device endpoints.
 *
 * @example
 * <DeviceReportingComponent [device]="selectedDevice" />
 */
@Component({
  selector: 'DeviceReportingComponent',
  imports: [TranslateModule, DropdownComponent, NgTemplateOutlet],
  templateUrl: './devicereporting.html',
  styleUrl: './devicereporting.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceReportingComponent {
  /** The device for which to configure reporting */
  device = input.required<Device | null>()
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly bridgeService = inject(BridgeService);
  /** Tracks if this is the first change to prevent processing initial state */
  private readonly firstChange = signal(false);
  protected readonly signalBusService = inject(SignalBusService);
  private injector = inject(Injector);

  /** List of configured reportings for the device */
  reportings = signal<ReportingExt[]>([]);
  /** Internal copy of the device for change detection */
  intDevice = signal<Device | null>(null);
  /** New reporting configuration being created */
  newReporting = signal<ReportingExt>(emptyReporting);
  /** Transaction ID of the pending response from the bridge */
  private responseTransactionId = signal<string | null>(null);
  /** Callback handler to execute when response is received */
  private responseHandler = signal<((result: any) => void) | null>(null);
  /** Indicates whether a request is currently running (derived from responseTransactionId) */
  protected readonly requestRunning = computed(() => this.responseTransactionId() !== null);

  /**
   * Computed list of available device endpoints for dropdown selection.
   * Updates based on current device and selected new reporting endpoint.
   */
  deviceEndpointSelections = computed(() => {
    const nRep = this.newReporting();
    const result: SelectOption[] = Object.keys(this.device()?.endpoints!).map(e => { return { label: e, value: e, isSelected: nRep !== null ? nRep.endpoint === e : false } });
    return result;
  })

  /**
   * Computed list of available clusters from the bridge info.
   * Provides cluster definitions for attribute selection.
   */
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
                const vr: ReportingExt = this.createReportingExt(rep, epid, endpoint, index);
                reps.push(vr);
                index++;
              });
            }
          });
        }
        this.reportings.set(reps);
      }
    })

    effect(() => {
      const transactionId = this.responseTransactionId();
      const handler = this.responseHandler();
      if (transactionId && handler) {
        const response$ = this.signalBusService.onState<any>(`bridge-response-${transactionId}`);
        runInInjectionContext(this.injector, () => {
          effect(() => {
            const result = response$();
            if (result) {
              this.responseTransactionId.set(null);
              this.responseHandler.set(null);
              handler(result);
              this.signalBusService.reset(`bridge-response-${transactionId}`);
            }
          });
        });
      }
    })
  }

  /**
   * Creates an extended reporting configuration object with cluster and attribute information.
   * Separates available clusters (output) from possible clusters (input not in output).
   *
   * @param rep - The base reporting configuration
   * @param epid - The endpoint ID
   * @param endpoint - The endpoint object containing cluster information
   * @param index - The index for this reporting configuration
   * @returns Extended reporting configuration with visual cluster list for UI
   */
  createReportingExt(rep: Reporting, epid: string, endpoint: Endpoint, index: number): ReportingExt {

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

    return {
      index,
      endpoint: epid,
      attribute: rep.attribute,
      cluster: rep.cluster,
      maximum_report_interval: rep.maximum_report_interval,
      minimum_report_interval: rep.minimum_report_interval,
      reportable_change: rep.reportable_change,
      clusters: Array.from(new Set([...possibleClusters, ...availableClusters])),
      visualClusterList: clusterList
    }
  }


  /**
   * Computed bridge device configuration schema.
   * Provides device configuration options from the bridge info.
   */
  bridgeDeviceOptions: Signal<DeviceConfigSchema | undefined> = computed(() => {
    const bi = this.bridgeService.bridgeInfo;
    return bi()?.config_schema.definitions.device;
  });

  /**
   * Gets the list of available attributes for a given cluster.
   *
   * @param cluster - The cluster name to get attributes for
   * @param selected - The currently selected attribute name
   * @returns Array of SelectOption items representing attributes for the cluster
   */
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

  /**
   * Updates a reporting configuration (existing or new) using a provided updater function.
   * Marks firstChange as true to enable effects for state management.
   *
   * @param index - The index of the reporting to update
   * @param updater - Function that modifies the reporting object
   */
  private updateReporting(index: number, updater: (rep: ReportingExt) => void): void {
    this.firstChange.set(true);
    const rep = this.reportings() ?? [];
    const selRep = rep.find(r => r.index === index);
    if (selRep) {
      updater(selRep);
      this.reportings.set(rep);
    } else {
      if (this.newReporting().index === index) {
        const rep = this.newReporting();
        updater(rep);
        this.newReporting.set(rep);
      }
    }
  }

  /**
   * Updates the cluster selection for a reporting configuration.
   *
   * @param index - The reporting index to update
   * @param change - The selected cluster option
   */
  changeCluster(index: number, change: SelectOption) {
    this.updateReporting(index, (rep) => {
      rep.cluster = change.value!;
      rep.visualClusterList = updateSelect(rep.visualClusterList, [change.value!]);
    });
  }

  /**
   * Updates the attribute selection for a reporting configuration.
   *
   * @param index - The reporting index to update
   * @param change - The selected attribute option
   */
  changeAttribute(index: number, change: SelectOption) {
    this.updateReporting(index, (rep) => {
      rep.attribute = change.value!;
    });
  }

  /**
   * Updates the minimum report interval for a reporting configuration.
   *
   * @param index - The reporting index to update
   * @param minRep - The minimum report interval in seconds (as string)
   */
  changeMinRep(index: number, minRep: string) {
    this.updateReporting(index, (rep) => {
      rep.minimum_report_interval = parseInt(minRep);
    });
  }

  /**
   * Updates the maximum report interval for a reporting configuration.
   *
   * @param index - The reporting index to update
   * @param maxRep - The maximum report interval in seconds (as string)
   */
  changeMaxRep(index: number, maxRep: string) {
    this.updateReporting(index, (rep) => {
      rep.maximum_report_interval = parseInt(maxRep);
    });
  }

  /**
   * Updates the reportable change value for a reporting configuration.
   *
   * @param index - The reporting index to update
   * @param rchange - The reportable change value (as string)
   */
  changeMinRepChange(index: number, rchange: string) {
    this.updateReporting(index, (rep) => {
      rep.reportable_change = parseInt(rchange);
    });
  }

  /**
   * Sends a request to configure reporting for the specified reporting configuration.
   * Can be used to create a new reporting or update an existing one.
   *
   * @param index - The index of the reporting to configure
   *
   * @remarks
   * Initiates a bridge request and sets up a response handler. If this is a new reporting,
   * it will be reset to empty after successful configuration.
   * The request status is tracked via the requestRunning computed signal.
   */
  configureReporting(index: number) {
    if (this.device()) {
      let transactionId: string = '';
      const rep = this.reportings();
      let addNew = false;
      const selected = rep.find(r => r.index === index);

      if (selected) {
        this.firstChange.set(false);
        transactionId = this.bridgeService.configureReporting(this.device()!.friendly_name, selected);
      } else if (index === this.newReporting().index) {
        this.firstChange.set(false);
        addNew = true;
        transactionId = this.bridgeService.configureReporting(this.device()!.friendly_name, this.newReporting());
      }

      if (transactionId) {
        this.responseHandler.set((result: any) => {
          console.log(result)
          if (result && result.payload && result.payload.status === "error") {
            // Handle error
          } else {
            if (addNew === true) {
              this.newReporting.set(emptyReporting);
            }
          }
        });
        this.responseTransactionId.set(transactionId);
      }
    }
  }

  /**
   * Deactivates reporting for the specified reporting configuration.
   * Sets the maximum_report_interval to 65535 to disable reporting.
   *
   * @param index - The index of the reporting to deactivate
   *
   * @remarks
   * The request status is tracked via the requestRunning computed signal.
   */
  deactivateReporting(index: number) {
    if (this.device()) {
      const rep = this.reportings();
      const selected = rep.find(r => r.index === index);
      if (selected) {
        this.firstChange.set(false);
        const transactionId = this.bridgeService.configureReporting(this.device()!.friendly_name, { ...selected, maximum_report_interval: 65535 });
        this.responseHandler.set((result: any) => {
          console.log(result)
          if (result && result.payload && result.payload.status === "error") {
            // Handle error
          }
        });
        this.responseTransactionId.set(transactionId);
      }
    }
  }

  /**
   * Initializes a new reporting configuration for the selected endpoint.
   * Called when a user selects an endpoint from the dropdown.
   *
   * @param event - The dropdown event containing the selected endpoint value
   */
  add(event: any) {
    if (event && event.value) {
      const newReporting = this.createReportingExt({
        attribute: '',
        cluster: '',
        maximum_report_interval: 3600,
        minimum_report_interval: 60,
        reportable_change: 1,
      }, event.value, this.device()!.endpoints[event.value], this.reportings().length);
      this.newReporting.set(newReporting);
    }
  }
}
