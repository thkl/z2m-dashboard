import { inject, Injectable, Signal, signal } from "@angular/core";
import { Websocket } from "./websocket";
import { ApplicationService } from "./app.service";
import { Bridge, Networkmap } from "../models/bridge";
import { BridgeEventStore } from "../datastore/logging.store";
import * as dummy from '../pages/networkmap/dummy';

@Injectable({
  providedIn: 'root'
})
export class BridgeService {
  private ws = inject(Websocket);
  protected readonly appService = inject(ApplicationService);
  protected readonly eventStore = inject(BridgeEventStore);
  public bridgeInfo = signal<Bridge | null>(null);


  constructor() {

    this.ws.subscribeTopicCallback('bridge/info', (message) => {
      if (message) {
        const { payload } = message;
        if (payload !== null) {
          this.bridgeInfo.set(payload);
        }
      }
    });

    this.ws.subscribeTopicCallback('bridge/logging', (message) => {
      if (message) {
        const { payload } = message;
        if (payload !== null) {
          const record = { date: new Date(), level: payload.level, message: payload.message };
          this.eventStore.addLocal(record, crypto.randomUUID());
        }
      }
    });


    this.ws.subscribeTopicCallback('bridge/response/networkmap', (message) => {
      const bridgeInfo = this.bridgeInfo();
      if (bridgeInfo) {
        console.log("set new bridgeinfo")
        this.bridgeInfo.set({ ...bridgeInfo, networkMap: message.payload.data });
      }
    });
  }

  permitJoin(time?: number): void {
    this.appService.sendBridgeRequest("bridge/request/permit_join", { device: null, time: time ?? 254 });
  }

  updateOptions(options: any): void {
    this.appService.sendBridgeRequest("bridge/request/options", options);
  }

  startTouchlinkScan(): void {
    this.appService.sendBridgeRequest("bridge/request/touchlink/scan", { value: true });
  }

  requestMap(): void {
    this.appService.sendBridgeRequest("bridge/request/networkmap", { routes: false, type: "raw" });
  }

}
