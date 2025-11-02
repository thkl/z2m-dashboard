import { DropdownComponent } from '@/app/components/controls/dropdown/dropdown';
import { OptionPanelComponent } from '@/app/components/controls/optionpanel/optionpanel';
import { DeviceStore } from '@/app/datastore/device.store';
import { GroupStore } from '@/app/datastore/group.store';
import { Device, DeviceBindingRequest, Endpoint } from '@/app/models/device';
import { SelectOption } from '@/app/models/types';
import { DeviceService } from '@/app/services/device.service';
import { SignalBusService } from '@/app/services/sigbalbus.service';
import { Component, computed, effect, inject, Injector, input, runInInjectionContext, signal, Signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface VisualCluster {
  label: string;
  isSelected: boolean;
}

interface VisualBinding {
  endpoint: string,
  target: string,
  targetEndpoint: string,
  targetName: string,
  cluster: VisualCluster[],
  isNew: boolean
}

interface TemporaryBindingState {
  [endpoint: string]: VisualBinding[]
}

interface CachedClusterState {
  [bindingKey: string]: string[]; // Array of selected cluster labels
}

@Component({
  selector: 'DeviceBindingsComponent',
  imports: [OptionPanelComponent, TranslateModule, DropdownComponent],
  templateUrl: './devicebindings.html',
  styleUrl: './devicebindings.scss',
})
export class DeviceBindingsComponent {
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly deviceService = inject(DeviceService);
  protected readonly signalBusService = inject(SignalBusService);
  protected readonly groupStore = inject(GroupStore);

  device = input.required<Device | null>()
  entities = this.deviceStore.entities();
  tmpNewEndpoint = signal<string | undefined>(undefined);

  deviceEndpointSelections = computed(() => {
    const result: SelectOption[] = Object.keys(this.device()?.endpoints!).map(e => { return { label: e, value: e, isSelected: false } });
    return result;
  })

  /** Cache for user changes to cluster selections */
  private clusterStateCache = signal<CachedClusterState>({});
  private temporaryBindings = signal<TemporaryBindingState>({});
  protected readonly translate = inject(TranslateService);

  /** Cache for tracking which bindings have been modified */
  private dirtyBindings = signal<Set<string>>(new Set());
  private injector = inject(Injector);

  /** Helper function to create a unique key for a binding */
  private getBindingKey(endpoint: string, target: string, targetEndpoint: string): string {
    return `${endpoint}:${target}:${targetEndpoint}`;
  }

  /** Check if a binding has been modified */
  isBindingDirty(binding: VisualBinding): boolean {
    const key = this.getBindingKey(binding.endpoint, binding.target, binding.targetEndpoint);
    return this.dirtyBindings().has(key);
  }

  /** Clear the dirty flag for a specific binding after successful update */
  clearBindingDirty(binding: VisualBinding): void {
    const key = this.getBindingKey(binding.endpoint, binding.target, binding.targetEndpoint);
    const newDirty = new Set(this.dirtyBindings());
    newDirty.delete(key);
    this.dirtyBindings.set(newDirty);
  }

  /** Helper function to create a deep copy of cluster objects */
  private copyClusterArray(clusters: VisualCluster[]): VisualCluster[] {
    return clusters.map(c => ({ ...c }));
  }

  /** Helper function to merge cached cluster states into bindings */
  private mergeCachedStates(bindings: { [key: string]: VisualBinding[] }): void {
    const cache = this.clusterStateCache();

    Object.keys(bindings).forEach(epId => {
      bindings[epId].forEach(binding => {
        const key = this.getBindingKey(binding.endpoint, binding.target, binding.targetEndpoint);
        const cachedClusters = cache[key];

        if (cachedClusters) {
          // Restore the cached selected state for clusters
          binding.cluster.forEach(cluster => {
            cluster.isSelected = cachedClusters.includes(cluster.label);
          });
        }
      });
    });
  }

  /** this will buidl a object for better visualization of the binding */
  bindings = computed(() => {
    const strg: { [key: string]: VisualBinding[] } = {};
    const tmpEP = this.tmpNewEndpoint();

    if (this.device()) {
      Object.keys(this.device()!.endpoints).forEach(epid => {
        const epbinding: VisualBinding[] = []; // create an empty list
        const endpoint = this.device()!.endpoints[epid]; // get the source endpoint
        //loop thru the endpoint bindint list
        endpoint.bindings.forEach(binding => {
          // get the index of the binding if we have set it before
          const ebid = epbinding.findIndex(b => b.target === binding.target.ieee_address && b.endpoint === epid && b.targetEndpoint === binding.target.endpoint);
          // get the target device from the all list
          
          const targetDevice = this.entities.find(e => e.ieee_address === binding.target.ieee_address);
          // get the target endpoint object
          const targetEndpoint = targetDevice?.endpoints[binding.target.endpoint];
          let targetName = 'unknown';
          let target = '';
          if (binding.target.type === 'group') {
            const grp = this.groupStore.entities().find(g=>g.id === parseInt(binding.target.id!));
            targetName = grp ? grp.friendly_name : 'unknown group';
            target = binding.target.id!;
          } else {
            targetName = targetDevice?.friendly_name ?? 'unknown device';
            target = binding.target.ieee_address!
          }

         const validClusters = this.collectClusters(targetDevice, epid, targetEndpoint,binding.target.type);
          //create get the binding visual or create a new one
          const b: VisualBinding = (ebid > -1) ? epbinding[ebid] : { endpoint: epid, targetEndpoint: binding.target.endpoint, target: target, cluster: this.copyClusterArray(validClusters), targetName: targetName??'unknown', isNew: false };
          // set the cluster to inuse
          b.cluster.some(c => { if (c.label === binding.cluster) { c.isSelected = true } }); // set the selected attribute
          if (ebid > -1) {
            // if we have this binding update it in the list
            epbinding[ebid] = b;
          } else { // or add a the new one
            epbinding.push(b);
          }
        });
        // if we have any clusters set .. add them to the visual binding list
        if (epbinding.length > 0) {
          strg[epid] = epbinding;
        }
      });
    }
    //merge in temp bindings 
    const tmp = this.temporaryBindings();
    Object.keys(tmp).forEach(endpoint => {
      if (strg[endpoint]) {
        strg[endpoint] = [...strg[endpoint], ...tmp[endpoint]];
      } else {
        strg[endpoint] = tmp[endpoint];
      }
    })


    // Merge cached cluster states into the rebuilt bindings
    this.mergeCachedStates(strg);
    return strg;
  })

  bindingGroups = computed(() => {
    return Object.keys(this.bindings());
  })

  selectedNewTargetDevice = signal<Device | null>(null);
  selectedNewTargetEndpointId = signal<string | null>(null);

  deviceSelectorTitle = computed(() => {
    const d = this.selectedNewTargetDevice();
    return d !== null ? d.friendly_name : this.translate.instant("SELECT_DEVICE")
  });

  selectedNewTargetDeviceEndPoints = computed(() => {
    const d = this.selectedNewTargetDevice();
    return (d !== null) ? Object.keys(d.endpoints).map((e: string) => {
      return { label: e, value: e, isSelected: false }
    }) : [];
  })


  endPointSelectorTitle = computed(() => {
    const epd = this.selectedNewTargetEndpointId();
    return epd !== null ? this.translate.instant("ENDPOINT_", { id: epd }) : this.translate.instant("ENDPOINT")
  });


  availabelDevices = computed(() => { return this.deviceStore.entities().filter(d => d.ieee_address !== this.device()?.ieee_address); })

  deviceNameList = computed(() => {
    const dv = this.availabelDevices();
    return dv.map((d: Device) => {
      return {
        isSelected: false,
        label: d.friendly_name,
        value: d.ieee_address
      } as SelectOption
    }
    ).sort((a: SelectOption, b: SelectOption) => {
      if (a.label > b.label) return 1;
      if (a.label < b.label) return -1;
      return 0;
    });
  });

  collectClusters(targetDevice: Device | undefined, sourceEndpoint: string, targetEndpoint: Endpoint | undefined, bindingType:string) {
    const endpoint = this.device()!.endpoints[sourceEndpoint]; // get the source endpoint
    // get the source clusters and transform them into a list of vistual clusters
    const clusters: VisualCluster[] = [...endpoint.clusters.input, ...endpoint.clusters.output].map(c => { return { label: c, isSelected: false } });
              // if its the coordinator all clusters are our friend

    const allValid = targetDevice?.type === 'Coordinator' || bindingType === 'group';
    //
    let validClusters: VisualCluster[] = [];
    if (allValid) { // if all valid just go
      validClusters = this.copyClusterArray(clusters);
    } else {
      for (const cluster of clusters) { // loop thru the clusters
        //check if its a input to output cluster and its not allready there
        if (endpoint.clusters.input.includes(cluster.label) && targetEndpoint?.clusters.output.includes(cluster.label) && (validClusters.find(c => c.label === cluster.label) === undefined)) {
          validClusters.push({ ...cluster });
        }
        //check if its a output to input cluster and its not allready there
        if (endpoint.clusters.output.includes(cluster.label) && targetEndpoint?.clusters.input.includes(cluster.label) && (validClusters.find(c => c.label === cluster.label) === undefined)) {
          validClusters.push({ ...cluster });
        }
      }
    }
    return validClusters;
  }

  selectNewDevice(event: any, binding: VisualBinding) {
    // grab the device from the store and save it so we can pull the endpoints
    const td = this.deviceStore.entities().find(d => d.ieee_address === event.value);
    if (td) {
      binding.target = event.value;
      binding.targetName = event.label;
      this.selectedNewTargetDevice.set(td);
    }
  }

  selectNewEndPoint(event: any, binding: VisualBinding) {
    binding.targetEndpoint = event.value;
    const targetDevice = this.selectedNewTargetDevice();
    if (targetDevice) {
      const targetEndpoint = targetDevice?.endpoints[event.value];
      binding.cluster = this.collectClusters(targetDevice, binding.endpoint, targetEndpoint,targetDevice.type);
    }
  }


changeBinding(event: any, binding: VisualBinding) {
  if (event && binding) {
    // Get the currently selected clusters for this binding
    const selectedClusters = binding.cluster
      .filter(c => c.isSelected === true)
      .map(c => c.label);

    // Create a unique key for this binding
    const bindingKey = this.getBindingKey(binding.endpoint, binding.target, binding.targetEndpoint);

    // Update the cache with the current selections
    const newCache = { ...this.clusterStateCache() };
    newCache[bindingKey] = selectedClusters;  // Keep even if empty array

    this.clusterStateCache.set(newCache);

    // Mark the binding as dirty in the cache
    const newDirty = new Set(this.dirtyBindings());
    newDirty.add(bindingKey);
    this.dirtyBindings.set(newDirty);
  }
}

  add(event: any): void {
    this.tmpNewEndpoint.set(event.value);
  }

  createTemporaryBinding(endpoint?: string) {
    if (!endpoint) {
      return
    }
    const tmpb = this.temporaryBindings();
    const vb: VisualBinding = {
      endpoint: endpoint,
      target: '',
      targetEndpoint: '',
      targetName: '',
      cluster: [],
      isNew: true
    };
    const tmp = tmpb[endpoint] ?? [];
    tmp.push(vb);
    tmpb[endpoint] = tmp;
    this.temporaryBindings.set(tmpb);
    this.tmpNewEndpoint.set(undefined);
    return vb;
  }


  removeBinding(binding: VisualBinding) {
    const clusters = binding.cluster.filter(c => c.isSelected === true);
    const request: DeviceBindingRequest = {
      clusters: clusters.map(c => c.label),
      from: this.device()?.friendly_name!,
      to: binding.targetName,
      from_endpoint: binding.endpoint,
      to_endpoint: binding.targetEndpoint
    }
    this.deviceService.removeBinding(request);

    // Clean up the cache for this binding
    const bindingKey = this.getBindingKey(binding.endpoint, binding.target, binding.targetEndpoint);
    const newCache = { ...this.clusterStateCache() };
    delete newCache[bindingKey];
    this.clusterStateCache.set(newCache);

    // Remove from dirty bindings
    const newDirty = new Set(this.dirtyBindings());
    newDirty.delete(bindingKey);
    this.dirtyBindings.set(newDirty);
  }

  updateBinding(binding: VisualBinding) {
    const clusters = binding.cluster.filter(c => c.isSelected === true);
    const request: DeviceBindingRequest = {
      clusters: clusters.map(c => c.label),
      from: this.device()?.friendly_name!,
      to: binding.targetName,
      from_endpoint: binding.endpoint,
      to_endpoint: binding.targetEndpoint
    }
    this.clearBindingDirty(binding);
    const transactionId = this.deviceService.updateBinding(request);
    const response$ = this.signalBusService.onState<any>(`bridge-response-${transactionId}`);
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const result = response$();
        if (result) {
          // Handle response
          this.clearBindingDirty(binding);
          this.temporaryBindings.set({});
          console.log(result);
          this.signalBusService.reset(`bridge-response-${transactionId}`);
        }
      });
    });
  }
}
