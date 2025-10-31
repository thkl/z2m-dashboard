import { inject, Injectable, Signal, signal } from "@angular/core";
import { Connection, Websocket } from "./websocket";
import { Z2MServer } from "../models/types";
import { Z } from "@angular/cdk/keycodes";
import { TokenService } from "@/app/services/token.service";
import { SignalBusService } from "@/app/services/sigbalbus.service";
import { DeviceStore } from "@/app/datastore/device.store";
import { BridgeService } from "@/app/services/bridge.service";
import { GroupStore } from "@/app/datastore/group.store";

export interface AppSettings {
    [key: string]: any;
}


@Injectable({
    providedIn: 'root'
})
export class ApplicationService {

    public settings?: AppSettings;
    protected readonly ws = inject(Websocket);
    protected readonly tokenService = inject(TokenService);
    protected readonly signalBusService = inject(SignalBusService);
    protected readonly mainTitleSignal = signal<string>('');
    protected readonly deviceStore = inject(DeviceStore);
    protected readonly groupStore = inject(GroupStore);

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

    private connectedHostSignal = signal<string | null>(null);

    get connectedHost(): Signal<string | null> {
        return this.connectedHostSignal;
    }

    constructor() {
        this.loadSettings();
        const connection = this.selectedConnection();
        if (connection) {
            this.connect(connection);
        } else {
            // send a signal to the Main Page to open the Settings
            this.signalBusService.emit("connection_error", "NO_LASTSAVED_CONNECTION");
        }
    }

    selectedConnection() : Connection | undefined{
        const last = this.getPreference("last_connection");
        const saved = this.getPreference("saved_hosts");
        if (last && saved && saved[last]) {
            return saved[last];
        }
        return undefined;
    }


    loadSettings(): void {
        const saved = localStorage.getItem('ui-settings');
        if (saved) {
            try {
                this.settings = JSON.parse(saved) as AppSettings;
            } catch (e) {
                console.error(e)
            }
        }
    }

    getPreference(key: string): any {
        return this.settings ? this.settings[key] : undefined;
    }

    setPreference(key: string, value: any) {
        if (!this.settings) {
            this.settings = {}
        }
        this.settings[key] = value;
        this.saveSettings();
    }


    saveAndConnect(z2m: Z2MServer) {

        //check if we have this setting and replace or add
        let saved: any = {};
        try {
            saved = this.getPreference("saved_hosts");
        } catch (e) {
            console.log("Unable to read saved hosts");
            console.error(e);
        }
        const { id } = z2m;
        saved[id] = z2m;

        this.setPreference("saved_hosts", saved);
        this.setPreference("last_connection", id);
        const connection: Connection = { ...z2m };
        this.connect(connection);
    }

    async connect(connection: Connection) {
        if (connection.token) {
            const token = await this.tokenService.decryptToken(connection.token);
            if (token) {
                connection.token = token; // decrypt it
            }
        }
        this.signalBusService.emit("clear_stores", {});
        this.ws.connect(connection);
        this.connectedHostSignal.set(`${connection.name}`);
    }

    saveSettings() {
        try {
            localStorage.setItem('ui-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
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