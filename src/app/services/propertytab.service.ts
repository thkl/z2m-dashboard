import { Injectable, signal, computed, Type } from '@angular/core';



export interface DynamicTab {
    id: string;
    label: string;
    component: Type<any>;
    data?: any;
    iconComponent?: Type<any>;   
    iconData?: any;
}

@Injectable({
    providedIn: 'root'
})
export class PropertyTabManagerService {
    private tabs = signal<DynamicTab[]>([]);
    private activeTabId = signal<string | null>(null);
    private maxTabs = 10;
    readonly allTabs = this.tabs.asReadonly();
    readonly activeId = this.activeTabId.asReadonly();

    readonly activeTab = computed(() => {
        const id = this.activeTabId();
        return this.tabs().find(tab => tab.id === id) ?? null;
    });

    readonly numberOfTabs = computed(() => {
        return this.tabs().length;
    })

    openTab(tab: DynamicTab) {
        const existingTab = this.tabs().find(t => t.id === tab.id);

        if (existingTab) {
            // Tab already exists, just switch to it
            this.activeTabId.set(tab.id);
        } else {
            if (this.tabs().length > this.maxTabs) {
                // remove the first
                this.tabs.update(tabs => tabs.slice(1));

            }
            // Add new tab and make it active
            this.tabs.update(tabs => [...tabs, tab]);
            this.activeTabId.set(tab.id);
        }
    }

    closeTab(tabId: string) {
        const currentTabs = this.tabs();
        const index = currentTabs.findIndex(t => t.id === tabId);

        if (index === -1) return;

        // Remove the tab
        this.tabs.update(tabs => tabs.filter(t => t.id !== tabId));

        // If we closed the active tab, switch to another one
        if (this.activeTabId() === tabId) {
            const newTabs = this.tabs();
            if (newTabs.length > 0) {
                // Switch to the previous tab, or the first one if we closed the first tab
                const newIndex = Math.max(0, index - 1);
                this.activeTabId.set(newTabs[newIndex].id);
            } else {
                this.activeTabId.set(null);
            }
        }
    }

    switchToTab(tabId: string) {
        if (this.tabs().some(t => t.id === tabId)) {
            console.log("Switch to tab ", tabId);
            this.activeTabId.set(tabId);
        }
    }

    closeAllTabs() {
        this.tabs.set([]);
        this.activeTabId.set(null);
    }
}