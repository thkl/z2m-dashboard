import { inject, Injectable } from "@angular/core";
import { Websocket } from "./websocket";

export interface AppSettings {
    host: string;
    secure:boolean;
}


@Injectable({
    providedIn: 'root'
})
export class ApplicationService {

    public settings?: AppSettings;
    private ws = inject (Websocket);

    constructor() {
        this.loadSettings();
    }

    public loadSettings() {
        const saved = localStorage.getItem('nextui-settings');
        if (saved) {
            if (saved) {
                try {
                    this.settings = JSON.parse(saved) as AppSettings;

                    if (this.settings.host) {
                          this.ws.connect(`${this.settings.secure?'wss':'ws'}://${this.settings.host}/api`);

                    }

                } catch (e) {
                    console.error(e)
                }
            }
        }
    }


    setHostName(host: string) {
        if (this.settings === undefined) {
            this.settings = { host: '',secure:false }
        }
        this.settings.host = host.replace('https://','').replace('http://','')
        this.settings.secure = (host.startsWith("https://"));
        this.saveSettings();
    }

    saveSettings() {
        try {
            localStorage.setItem('nextui-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }
}