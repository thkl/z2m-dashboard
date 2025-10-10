import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { Websocket, WebSocketMessage } from "./websocket";
import { DeviceStore } from "../datastore/device.store";
import { Device, DeviceTargetState, DeviceFeature } from "../models/device";
import { timeAgo } from "../utils/time.utils";
import { TranslateService } from "@ngx-translate/core";
import { ApplicationService } from "./app.service";
import { BridgeService } from "./bridge.service";

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private ws = inject(Websocket);
  protected readonly deviceStore = inject(DeviceStore);
  protected readonly appService = inject(ApplicationService);
  protected readonly bridgeService = inject(BridgeService);

  private translate = inject(TranslateService);

  constructor() {

    this.ws.subscribeTopicCallback('bridge/devices', (message) => {
      if (message) {
        const { payload } = message;
        if ((payload !== null) && (Array.isArray(payload))) {
          this.addDevices(payload);
        }
      }
    });

    this.ws.subscribeTopicCallback('*/availability', (message) => {
      const { topic, payload } = message;
      this.updateAvailability(topic, payload.state);
    });

    this.ws.subscribeCatchAllCallback((message) => {
      const { topic, payload } = message;
      this.doupdateState(topic, payload);

    });


  }

  updateAvailability(topic: string, status: string) {
    // the device is the first in the topci
    const deviceName = topic.split("/")[0];
    this.deviceStore.mergeBySearch("state/availability", status, "friendly_name", deviceName);

  }

  private doupdateState(topic: string, status: any) {
    const splits = topic.split("/");
    if (splits.length === 1) {
      // the device is the first in the topic
      const deviceName = splits[0];
      this.deviceStore.mergeBySearch("state", status, "friendly_name", deviceName);
      this.setupUpdateInterval();
    }
  }

  public updateDeviceState(device: string, data: DeviceTargetState): void {
    const topic = `${device}/set`;
    this.appService.sendBridgeRequest(topic, data);
  }

  private setupUpdateInterval() {
    for (const device of this.deviceStore.entities()) {
      if (device.state?.last_seen) {
        const lastseenhuman = timeAgo(device.state?.last_seen, this.translate);
        const newState = { ...device.state, lastseenhuman };
        this.deviceStore.mergeBySearch("state", newState, "ieee_address", device.ieee_address);
      }
    }
  }

  addDevices(deviceList: Device[]): void {
    console.log("Set All Devices")
    const devicelist = this.deviceStore.entities();
    const bridgeInfo = this.bridgeService.getBridgeInfo();
    // copy the old state or create an empty one
    deviceList.forEach(device => {
      // set the device option values from the bridge info devices 
      const bridgeDevice = bridgeInfo()?.config.devices[device.ieee_address];
      if (bridgeDevice) {
        device.options = bridgeDevice;
      } else {
        console.log("NF",device.ieee_address)
      }
      const oldDevice = devicelist.find(d => d.ieee_address === device.ieee_address);
      if (oldDevice) {
        device.state = oldDevice.state;
      } else {
        device.state = {
          availability: "",
          lastseenhuman: "",
          last_seen: "", linkquality: 0, battery: 0
        };
      }
    })

    this.deviceStore.addAll(deviceList);

    setTimeout(() => {
      this.setupUpdateInterval();

    }, 1000);
  }

  private sendBridgeDeviceRequest(topic: string, device: Device, options: any) {
    const payload: any = {
      id: device.friendly_name,
      transaction: crypto.randomUUID()
    }

    if (options) {
      payload.options = options;
    }

    this.appService.sendBridgeRequest(topic, payload);
  }

  startInterview(device: Device): void {
    this.sendBridgeDeviceRequest("bridge/request/device/interview", device, undefined);
  }

  startReconfig(device: Device): void {
    this.sendBridgeDeviceRequest("bridge/request/device/configure", device, undefined);
  }

  changeDeviceDescription(device: Device): void {
    this.sendBridgeDeviceRequest("bridge/request/device/options", device, {
      description: device.description
    });
  }

}
