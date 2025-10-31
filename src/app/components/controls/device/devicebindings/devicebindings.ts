import { DeviceStore } from '@/app/datastore/device.store';
import { Device } from '@/app/models/device';
import { Component, computed, inject, input, Signal } from '@angular/core';

interface VisualBinding {
  endpoint:string,
  target:string,
  targetName:string,
  cluster:string[]
}

@Component({
  selector: 'DeviceBindingsComponent',
  imports: [],
  templateUrl: './devicebindings.html',
  styleUrl: './devicebindings.scss',
})
export class DeviceBindingsComponent {
  protected readonly deviceStore = inject(DeviceStore);

  device = input.required<Device | null>()

  /** this will buidl a object for better visualization of the binding */
  bindings = computed(()=>{
    const strg : { [key: string]: VisualBinding[] } = {};
    const device = this.device();
    const entities = this.deviceStore.entities();
    if (device) {
      Object.keys(device.endpoints).forEach(epid=>{
        const epbinding:VisualBinding[] = [];
        const endpoint = device.endpoints[epid];
        endpoint.bindings.forEach(binding=>{
            const ebid = epbinding.findIndex(b=>b.target===binding.target.ieee_address && b.endpoint===binding.target.endpoint);
            const targetDevice = entities.find(e=>e.ieee_address===binding.target.ieee_address);

            const b:VisualBinding = (ebid>-1) ? epbinding[ebid] : {endpoint:binding.target.endpoint,target:binding.target.ieee_address,cluster:[],targetName:targetDevice?.friendly_name??'unknown'};
            b.cluster.push(binding.cluster);
            if (ebid>-1) {
              epbinding[ebid]=b;
            } else {
              epbinding.push(b);
            }
        });
        strg[epid] = epbinding;
      });
    }
    return strg;
  })

  bindingGroups = computed(()=>{
    return Object.keys(this.bindings());
  }) 

}
