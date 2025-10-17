import { inject, Injectable } from "@angular/core";
import { Websocket } from "./websocket";

export interface AppSettings {
    [key: string]: any;
}


@Injectable({
    providedIn: 'root'
})
export class ApplicationService {

    public settings?: AppSettings;
    private ws = inject(Websocket);

    constructor() {
        this.loadSettings();
    }

    public loadSettings() {
        const saved = localStorage.getItem('ui-settings');
            if (saved) {
                try {
                    this.settings = JSON.parse(saved) as AppSettings;
                    if (this.settings["host"]) {
                        this.ws.connect(`${this.settings["secure"] ? 'wss' : 'ws'}://${this.settings["host"]}/api`);
                    }
                } catch (e) {
                    console.error(e)
                }
            }
    }

    getPreference(key:string):any {
        return this.settings ? this.settings[key] : undefined;
    }

    setPreference(key:string,value:any) {
        if (!this.settings) {
            this.settings = {}
        }
        this.settings[key] = value;
        this.saveSettings();
    }

    setHostName(host: string) {
        this.setPreference("host",host.replace('https://', '').replace('http://', ''));
        this.setPreference("secure",(host.startsWith("https://")));
    }

    saveSettings() {
        try {
            localStorage.setItem('ui-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }

    sendBridgeRequest(topic: string, payload: any) {
        const message: any = {
            payload,
            topic
        }
        this.ws.sendMessage(JSON.stringify(message));
    }
}