import { OptionPanelComponent } from '@/app/components/controls/optionpanel/optionpanel';
import { DeviceStore } from '@/app/datastore/device.store';
import { Device, DeviceBindingRequest } from '@/app/models/device';
import { DeviceService } from '@/app/services/device.service';
import { Component, computed, inject, input, signal, Signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

interface VisualCluster {
  label: string;
  isSelected: boolean;
}

interface VisualBinding {
  endpoint: string,
  target: string,
  targetEndpoint: string,
  targetName: string,
  cluster: VisualCluster[]
}

interface CachedClusterState {
  [bindingKey: string]: string[]; // Array of selected cluster labels
}

@Component({
  selector: 'DeviceBindingsComponent',
  imports: [OptionPanelComponent, TranslateModule],
  templateUrl: './devicebindings.html',
  styleUrl: './devicebindings.scss',
})
export class DeviceBindingsComponent {
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly deviceService = inject(DeviceService);

  device = input.required<Device | null>()
  entities = this.deviceStore.entities();

  /** Cache for user changes to cluster selections */
  private clusterStateCache = signal<CachedClusterState>({});

  /** Cache for tracking which bindings have been modified */
  private dirtyBindings = signal<Set<string>>(new Set());

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
    if (this.device()) {
      Object.keys(this.device()!.endpoints).forEach(epid => {
        const epbinding: VisualBinding[] = []; // create an empty list
        const endpoint = this.device()!.endpoints[epid]; // get the source endpoint
        // get the source clusters and transform them into a list of vistual clusters
        const clusters: VisualCluster[] = [...endpoint.clusters.input, ...endpoint.clusters.output].map(c => { return { label: c, isSelected: false } });
        //loop thru the endpoint bindint list
        endpoint.bindings.forEach(binding => {
          // get the index of the binding if we have set it before
          const ebid = epbinding.findIndex(b => b.target === binding.target.ieee_address && b.endpoint === epid && b.targetEndpoint === binding.target.endpoint);
          // get the target device from the all list
          const targetDevice = this.entities.find(e => e.ieee_address === binding.target.ieee_address);
          // get the target endpoint object
          const targetEndpoint = targetDevice?.endpoints[binding.target.endpoint];
          // if its the coordinator all clusters are our friend
          const allValid = targetDevice?.type === 'Coordinator';
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
          //create get the binding visual or create a new one
          const b: VisualBinding = (ebid > -1) ? epbinding[ebid] : { endpoint: epid, targetEndpoint: binding.target.endpoint, target: binding.target.ieee_address, cluster: this.copyClusterArray(validClusters), targetName: targetDevice?.friendly_name ?? 'unknown' };
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

    // Merge cached cluster states into the rebuilt bindings
    this.mergeCachedStates(strg);

    console.log(strg);
    return strg;
  })

  bindingGroups = computed(() => {
    return Object.keys(this.bindings());
  })


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
      if (selectedClusters.length > 0) {
        newCache[bindingKey] = selectedClusters;
      } else {
        // If no clusters are selected, remove the binding from the cache
        delete newCache[bindingKey];
      }
      this.clusterStateCache.set(newCache);

      // Mark the binding as dirty in the cache
      const newDirty = new Set(this.dirtyBindings());
      newDirty.add(bindingKey);
      this.dirtyBindings.set(newDirty);
    }
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
    this.deviceService.updateBinding(request);
  }
}
