import { Device } from "../models/device";
import { createEntitySignalStore, StoreConfig } from "./generic.store";

const DeviceStoreConfig: StoreConfig<Device> = {
    idField:"ieee_address"
}

export const DeviceStore = createEntitySignalStore<Device>(DeviceStoreConfig);