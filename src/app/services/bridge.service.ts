import { inject, Injectable, Signal, signal } from "@angular/core";
import { Websocket } from "./websocket";
import { ApplicationService } from "./app.service";
import { Bridge } from "../models/bridge";

@Injectable({
  providedIn: 'root'
})
export class BridgeService {
  private ws = inject(Websocket);
  protected readonly appService = inject(ApplicationService);
  private bridgeInfo = signal<Bridge|null>(null);


  constructor() {

    this.ws.subscribeTopicCallback('bridge/info', (message) => {
      if (message) {
        const { payload } = message;
        if (payload !== null) {
            this.bridgeInfo.set(payload);
        }
      }
    });
  }

  getBridgeInfo(): Signal<Bridge|null>{
    return this.bridgeInfo;
  }

  permitJoin(time?:number):void {
       this.appService.sendBridgeRequest("bridge/request/permit_join", {device: null,time:time??254});
  }
 
}
