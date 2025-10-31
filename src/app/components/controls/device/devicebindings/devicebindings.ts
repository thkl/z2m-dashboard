import { OptionPanelComponent } from '@/app/components/controls/optionpanel/optionpanel';
import { DeviceStore } from '@/app/datastore/device.store';
import { Device, DeviceBindingRequest } from '@/app/models/device';
import { DeviceService } from '@/app/services/device.service';
import { Component, computed, inject, input, Signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { bin } from 'd3';

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

@Component({
  selector: 'DeviceBindingsComponent',
  imports: [OptionPanelComponent, TranslateModule],
  templateUrl: './devicebindings.html',
  styleUrl: './devicebindings.scss',
})
export class DeviceBindingsComponent {
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly deviceService = inject (DeviceService);

  device = input.required<Device | null>()

  /** this will buidl a object for better visualization of the binding */
  bindings = computed(() => {
    const strg: { [key: string]: VisualBinding[] } = {};
    const device = this.device();
    const entities = this.deviceStore.entities();
    if (device) {
      Object.keys(device.endpoints).forEach(epid => {
        const epbinding: VisualBinding[] = []; // create an empty list
        const endpoint = device.endpoints[epid]; // get the source endpoint
        // get the source clusters and transform them into a list of vistual clusters
        const clusters: VisualCluster[] = [...endpoint.clusters.input, ...endpoint.clusters.output].map(c => { return { label: c, isSelected: false } });
        //loop thru the endpoint bindint list
        endpoint.bindings.forEach(binding => {
          // get the index of the binding if we have set it before
          const ebid = epbinding.findIndex(b => b.target === binding.target.ieee_address && b.endpoint === epid && b.targetEndpoint === binding.target.endpoint);
          // get the target device from the all list
          const targetDevice = entities.find(e => e.ieee_address === binding.target.ieee_address);
          // get the target endpoint object
          const targetEndpoint = targetDevice?.endpoints[binding.target.endpoint];
          // if its the coordinator all clusters are our friend
          const allValid = targetDevice?.type === 'Coordinator';
          // 
          let validClusters: VisualCluster[] = [];
          if (allValid) { // if all valid just go
            validClusters = [...clusters];
          } else {
            for (const cluster of clusters) { // loop thru the clusters
              //check if its a input to output cluster and its not allready there
              if (endpoint.clusters.input.includes(cluster.label) && targetEndpoint?.clusters.output.includes(cluster.label) && (validClusters.find(c => c.label === cluster.label) === undefined)) {
                validClusters.push(cluster);
              }
              //check if its a output to input cluster and its not allready there
              if (endpoint.clusters.output.includes(cluster.label) && targetEndpoint?.clusters.input.includes(cluster.label) && (validClusters.find(c => c.label === cluster.label) === undefined)) {
                validClusters.push(cluster);
              }
            }
          }
          //create get the binding visual or create a new one 
          const b: VisualBinding = (ebid > -1) ? epbinding[ebid] : { endpoint: epid, targetEndpoint: binding.target.endpoint, target: binding.target.ieee_address, cluster: validClusters, targetName: targetDevice?.friendly_name ?? 'unknown' };
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
    return strg;
  })

  bindingGroups = computed(() => {
    return Object.keys(this.bindings());
  })

  removeBinding(binding:VisualBinding) {
    const clusters = binding.cluster.filter(c=>c.isSelected===true);
    const request:DeviceBindingRequest = {
      clusters: clusters.map(c=>c.label),
      from: this.device()?.friendly_name!,
      to: binding.targetName,
      from_endpoint:binding.endpoint,
      to_endpoint:binding.targetEndpoint
    }
    this.deviceService.removeBinding(request);
  }
}
