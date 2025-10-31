import { Z2MServer } from "@/app/models/types";
import { SettingsService } from "@/app/services/settings.service";
import { SignalBusService } from "@/app/services/sigbalbus.service";
import { TokenService } from "@/app/services/token.service";
import { Connection, Websocket } from "@/app/services/websocket";
import { inject, Injectable, Signal, signal } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class ConnectionManagerService {

    protected readonly signalBusService = inject(SignalBusService);
    protected readonly settingsService = inject(SettingsService);
    protected readonly tokenService = inject(TokenService);
    protected readonly ws = inject(Websocket);
        
    constructor() {
        const connection = this.selectedConnection();
        if (connection) {
            this.connect(connection);
        } else {
            // send a signal to the Main Page to open the Settings
            this.signalBusService.emit("connection_error", "NO_LASTSAVED_CONNECTION");
        }

    }

    selectedConnection(): Connection | undefined {
        const last = this.settingsService.getPreference("last_connection");
        const saved = this.settingsService.getPreference("saved_hosts");
        if (last && saved && saved[last]) {
            return saved[last];
        }
        return undefined;
    }


    saveAndConnect(z2m: Z2MServer) {

        //check if we have this setting and replace or add
        let saved: any = {};
        try {
            saved = this.settingsService.getPreference("saved_hosts");
        } catch (e) {
            console.log("Unable to read saved hosts");
            console.error(e);
        }
        if (saved === undefined) {
            saved = {};
        }
        const { id } = z2m;
        saved[id] = z2m;

        this.settingsService.setPreference("saved_hosts", saved);
        this.settingsService.setPreference("last_connection", id);
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

    private connectedHostSignal = signal<string | null>(null);

    get connectedHost(): Signal<string | null> {
        return this.connectedHostSignal;
    }


}