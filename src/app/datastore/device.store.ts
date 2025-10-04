import { Device } from "../models/device";
import { createEntitySignalStore, StoreConfig } from "./generic.store";

const DeviceStoreConfig: StoreConfig<Device> = {
}

export const DeviceStore = createEntitySignalStore<Device>(DeviceStoreConfig);