import { Device } from "../models/device";
import { Group } from "../models/group";
import { createEntitySignalStore, StoreConfig } from "./generic.store";

const GroupStoreConfig: StoreConfig<Group> = {
    idField:"id"
}

export const GroupStore = createEntitySignalStore<Group>(GroupStoreConfig);