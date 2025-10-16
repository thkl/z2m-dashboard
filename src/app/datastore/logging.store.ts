import { BridgeEvent } from "../models/bridge";
import { createEntitySignalStore, StoreConfig } from "./generic.store";

const BridgeEventStoreConfig: StoreConfig<BridgeEvent> = {
    idField:"uuid",
    maxNumberOfEntities: 200
}

export const BridgeEventStore = createEntitySignalStore<BridgeEvent>(BridgeEventStoreConfig);