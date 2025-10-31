import { AppSettings } from "@/app/services/app.service";
import { Injectable, signal } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class SettingsService {

    private settings = signal<AppSettings|null>(null);

    constructor() {
        this.loadSettings();
    }

    loadSettings(): void {
        const saved = localStorage.getItem('ui-settings');
        if (saved) {
            try {
                this.settings.set(JSON.parse(saved) as AppSettings);
            } catch (e) {
                console.error(e)
            }
        }
    }

    getPreference(key: string): any {
        return this.settings()!==null ? this.settings()![key] : undefined;
    }

    setPreference(key: string, value: any) {
        const tmp = this.settings()??{};
        tmp[key] = value;
        this.settings.set(tmp);
        this.saveSettings();
    }

    saveSettings() {
        try {
            localStorage.setItem('ui-settings', JSON.stringify(this.settings()));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }
}