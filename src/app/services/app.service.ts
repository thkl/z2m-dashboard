import { inject, Injectable, Signal, signal } from "@angular/core";
import { Connection, Websocket } from "./websocket";
import { Z2MServer } from "../models/types";
import { Z } from "@angular/cdk/keycodes";
import { TokenService } from "@/app/services/token.service";
import { SignalBusService } from "@/app/services/sigbalbus.service";
import { DeviceStore } from "@/app/datastore/device.store";
import { BridgeService } from "@/app/services/bridge.service";
import { GroupStore } from "@/app/datastore/group.store";
import { ConnectionManagerService } from "@/app/services/connectionmanager.service";

export interface AppSettings {
    [key: string]: any;
}


@Injectable({
    providedIn: 'root'
})
export class ApplicationService {


    protected readonly ws = inject(Websocket);
    protected readonly signalBusService = inject(SignalBusService);
    protected readonly mainTitleSignal = signal<string>('');
    protected readonly deviceStore = inject(DeviceStore);
    protected readonly groupStore = inject(GroupStore);
    protected readonly connectionManager = inject(ConnectionManagerService);
    
    get mainTitle(): Signal<string> {
        return this.mainTitleSignal;
    }

    set mainTitle(item: string) {
        this.mainTitleSignal.set(item);
    }


    private inspectorSignal = signal<string | null>(null);

    get inspector(): Signal<string | null> {
        return this.inspectorSignal;
    }

    set inspector(item: string | null) {
        this.inspectorSignal.set(item);
    }

    sendBridgeRequest(topic: string, payload: any, useTransaction: boolean = true) {
        if (payload && payload.transaction === undefined && useTransaction === true) {
            payload.transaction = crypto.randomUUID();
        }
        const message: any = {
            payload,
            topic
        }
        this.ws.sendMessage(JSON.stringify(message));
    }


}