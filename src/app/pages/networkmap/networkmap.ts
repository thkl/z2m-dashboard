import { Component, effect, inject, signal } from '@angular/core';
import { NetworkGraphComponent } from '../../components/network-graph/network-graph.component';
import { NetworkNodeData } from '../../models/bridge';
import { BridgeService } from '../../services/bridge.service';


@Component({
  selector: 'NetworkMapPage',
  imports: [NetworkGraphComponent],
  templateUrl: './networkmap.html',
  styleUrl: './networkmap.scss'
})
export class NetworkMapPage {
  networkData = signal<NetworkNodeData | null>(null);
  private bridgeService = inject(BridgeService);

  constructor() {

    effect(() => {
      const bridge = this.bridgeService.bridgeInfo();
      const networkMap = bridge?.networkMap;
      console.log("NMChange")
      if (networkMap) {
        console.log(networkMap);
        const data = networkMap.value as NetworkNodeData;
        console.log(data);
        this.networkData.set(data);
      }
    })
  }


  scan() {
    console.log("Start network scan");
    this.bridgeService.requestMap();
  }
}
