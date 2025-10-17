import { Component, effect, inject, signal } from '@angular/core';
import { NetworkGraphComponent } from '../../components/network-graph/network-graph.component';
import { NetworkNodeData } from '../../models/bridge';
import { BridgeService } from '../../services/bridge.service';
import * as dummy from './dummy';

@Component({
  selector: 'NetworkMapPage',
  imports: [NetworkGraphComponent],
  templateUrl: './networkmap.html',
  styleUrl: './networkmap.scss'
})
export class NetworkMapPage {
 networkData = signal<NetworkNodeData | null>(null);
 private bridgeService = inject(BridgeService);

 bridge = this.bridgeService.getBridgeInfo();


  constructor() {
  
      const data = dummy.data.value as NetworkNodeData;
      console.log(data);
      this.networkData.set(data);
 
  }


  scan(){
    this.bridgeService.requestMap();
  }
}
