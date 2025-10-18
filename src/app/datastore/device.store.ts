import { TranslateService } from "@ngx-translate/core";
import { Device } from "../models/device";
import { timeAgo } from "../utils/time.utils";
import { createEntitySignalStore, StoreConfig } from "./generic.store";
import { last, Subject, throttleTime } from "rxjs";

const DeviceStoreConfig: StoreConfig<Device> = {
    idField: "ieee_address"
}

export const DeviceStore = createEntitySignalStore<Device>(DeviceStoreConfig);

export const createDeviceStoreExtensions = (deviceStore: any, translate: TranslateService) => {
    const updateSubject = new Subject<void>();

    // Set up the throttled subscription
    updateSubject.pipe(
        throttleTime(3000) // 1 second
    ).subscribe(() => {
        const entities = deviceStore.entities();

        for (const device of entities) {
            if (device.state?.last_seen) {
                const lastseenhuman = timeAgo(device.state?.last_seen, translate);
                const newState = { ...device.state, lastseenhuman };
                deviceStore.mergeBySearch("state", newState, "ieee_address", device.ieee_address);
            }
        }
    });

    return {
        updateDeviceLastSeenTime: () => {
            updateSubject.next();
        }
    };
};