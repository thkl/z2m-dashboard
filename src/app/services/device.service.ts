import { effect, inject, Injectable, signal } from "@angular/core";
import { Websocket, WebSocketMessage } from "./websocket";
import { DeviceStore } from "../datastore/device.store";
import { Device } from "../models/device";

@Injectable({
    providedIn: 'root'
})
export class DeviceService {
    private ws = inject(Websocket);
    private devicesTopic = this.ws.subscribeTopic('bridge/devices');
    protected readonly deviceStore = inject(DeviceStore);

    constructor() {
        effect(() => {
            const message: WebSocketMessage = this.devicesTopic();
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
            this.updateState(topic, payload);

        });
    }

    updateAvailability(topic: string, status: string) {
        // the device is the first in the topci
        const deviceName = topic.split("/")[0];
        this.deviceStore.updateBySearch("availability", status, "friendly_name", deviceName);
    }

    updateState(topic: string, status: any) {
        // the device is the first in the topci
        const deviceName = topic.split("/")[0];
        this.deviceStore.mergeBySearch("state", status, "friendly_name", deviceName);
    }


    addDevices(deviceList: Device[]): void {
        this.deviceStore.reset();
        this.deviceStore.addAll(deviceList);
        //this.deviceStore.addLocal(device,device.ieee_address)
    }


}
