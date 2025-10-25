import { inject, Injectable, Signal, signal } from "@angular/core";
import { Websocket } from "./websocket";
import { Z2MServer } from "../models/types";
import { Z } from "@angular/cdk/keycodes";

export interface AppSettings {
    [key: string]: any;
}


@Injectable({
    providedIn: 'root'
})
export class ApplicationService {

    public settings?: AppSettings;
    private ws = inject(Websocket);

    private mainTitleSignal = signal<string>('');

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
        this.connect()
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
            saved = JSON.parse(this.getPreference("saved_hosts"));
        } catch (e) {

        }
        const host = z2m.host;
        const secure = z2m.secure;
        const port = z2m.port;
        const name = z2m.name;
        saved[host] = { name, host, port, secure };
        this.setPreference("saved_hosts", saved);
        this.setPreference("host", host.replace('https://', '').replace('http://', ''));
        this.setPreference("secure", secure);
        this.setPreference("port", port);
        this.connect();
    }

    connect() {
        const host = this.getPreference("host");
        const secure = this.getPreference("secure");
        if (host) {
            this.ws.connect(`${secure ? 'wss' : 'ws'}://${host}/api`);
            this.connectedHostSignal.set(`${host}`);
        }
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