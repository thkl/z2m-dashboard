import { computed, Signal } from "@angular/core";
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

export interface BaseEntity {
    ieee_address: string;
    [key: string]: any;
}

export type CreateRequest<T extends BaseEntity> = Omit<T, 'ieee_address'>;

export type UpdateRequest<T extends BaseEntity> = Partial<Omit<T, 'ieee_address'>> & {
    ieee_address: string;
};

export type NewRequest<T extends BaseEntity> = Omit<T, 'ieee_address'> & { ieee_address: 'new' | ''; };


// Search criteria types
export enum SearchOperator {
    AND = 'AND',
    OR = 'OR'
}

export interface SearchCriteria<T extends BaseEntity> {
    property: keyof T;
    value: any;
    operator?:
        | 'equals'
        | 'contains'
        | 'startsWith'
        | 'endsWith'
        | 'greaterThan'
        | 'lessThan'
        | 'greaterThanOrEqual'
        | 'lessThanOrEqual'
        | 'not';
    caseSensitive?: boolean;
}

export interface SearchByPropertiesOptions<T extends BaseEntity> {
    criteria: SearchCriteria<T>[];
    logicalOperator: SearchOperator;
}


export interface EntityState<T extends BaseEntity> {
    entities: T[];
    error: string | null;
    totalCount?: number; // Total count from API (for pagination)
    selectedEntity: T | null;
    lastUpdated: T | null;
}


export interface StoreConfig<T extends BaseEntity> {
    initialState?: Partial<EntityState<T>>;
    searchableFields?: (keyof T)[];
    entityName?: string;
    readonly?: boolean;
}



export interface SignalStoreType<T> {
    entities(): Signal<T[]>;
    searchTerm(): Signal<T[]>;
    totalCount(): Signal<T[]>;
    advancedSearchCriteria(): Signal<T[]>;
}




export function createEntitySignalStore<T extends BaseEntity>(config: StoreConfig<T>) {
    const defaultState: EntityState<T> = {
        entities: [],
        error: null,
        selectedEntity: null,
        lastUpdated: null,
        totalCount: 0,
    };

    const searchableFields = config.searchableFields || (Object.keys({} as T) as (keyof T)[]);

    const store = signalStore(
        { providedIn: 'root' },
        withState(defaultState),
        withComputed(({ entities, totalCount }) => {
            // Helper function to evaluate search criteria

            return {
                first: computed(() => {
                    const currentEntities = entities() || [];
                    return currentEntities.length > 0 ? currentEntities[0] : null;
                }),
                // Entity counts
                entitiesCount: computed(() => (entities() || []).length),
                hasEntities: computed(() => (entities() || []).length > 0),
            }
        }),
        withMethods((store) => {
            const methods = {

                // Reset store
                reset: () => {
                    patchState(store, defaultState);
                },

                fields: () => {
                    if (store.hasEntities()) {
                        const keys = Object.keys(store.entities()[0]);
                        return keys;
                    } else {
                        return searchableFields;
                    }
                },

                addAll: (entities: T[]) => {
                    patchState(store, {
                        entities: entities,
                        totalCount: entities.length,
                    });
                },

                addLocal: (createdEntity: CreateRequest<T>, ieee_address: string) => {
                    const newEntity = { ...createdEntity, ieee_address } as T;
                    patchState(store, {
                        entities: [...(store.entities() || []), newEntity],
                        totalCount: (store.totalCount?.() || 0) + 1,
                    });
                },

                setSelectedEntity: (entity: T | null) => {
                    patchState(store, { selectedEntity: entity });
                },

                setSelectedEntityById: (ieee_address:string) => {
                    const entities = store.entities() || [];
                    patchState(store, { selectedEntity: entities.find((e) => e.ieee_address === ieee_address)});
                },


                updatebyId: (updatedEntity: UpdateRequest<T>) => {
                    const entities = store.entities() || [];
                    const existingEntity = entities.find((e) => e.ieee_address === updatedEntity["ieee_address"]);
                    if (!existingEntity) {
                        return;
                    }
                    const mergedEntity = { ...existingEntity, ...updatedEntity } as T;
                    patchState(store, {
                        entities: entities.map((e) => (e.ieee_address === updatedEntity.ieee_address ? mergedEntity : e)),
                        lastUpdated: mergedEntity,
                        selectedEntity:
                            store.selectedEntity()?.ieee_address === updatedEntity.ieee_address ? mergedEntity : store.selectedEntity()
                    });
                },

                update : (updatedEntity: UpdateRequest<T>) => {
                    const entities = store.entities() || [];
                    const existingEntity = entities.find((e) => e.ieee_address === updatedEntity.ieee_address);
                    if (!existingEntity) {
                        return;
                    }
                    const mergedEntity = { ...existingEntity, ...updatedEntity } as T;
                    patchState(store, {
                        entities: entities.map((e) => (e.ieee_address === updatedEntity.ieee_address ? mergedEntity : e)),
                        lastUpdated: mergedEntity,
                    });
                },

                updateBySearch: (property: string, newValue: any, field: string, search: string) => {
                    const entities = store.entities() || [];
                    const existingEntity = entities.find((e) => e[field] === search);
                    if (!existingEntity) {
                        return;
                    }

                    let mergedEntity: T;

                    // Handle nested property paths (e.g., "state/availability")
                    if (property.includes('/')) {
                        const keys = property.split('/');
                        const updatedEntity = { ...existingEntity };
                        let current: any = updatedEntity;

                        // Navigate to the nested property, creating objects as needed
                        for (let i = 0; i < keys.length - 1; i++) {
                            if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
                                current[keys[i]] = {};
                            } else {
                                current[keys[i]] = { ...current[keys[i]] };
                            }
                            current = current[keys[i]];
                        }

                        // Set the final property
                        current[keys[keys.length - 1]] = newValue;
                        mergedEntity = updatedEntity as T;
                    } else {
                        mergedEntity = { ...existingEntity, [property]: newValue } as T;
                    }

                    patchState(store, {
                        entities: entities.map((e) => (e[field] === search ? mergedEntity : e)),
                        lastUpdated: mergedEntity,
                        selectedEntity:
                            store.selectedEntity()?.[field] === search ? mergedEntity : store.selectedEntity()
                    });
                },

                mergeBySearch: (property: string, newValue: any, field: string, search: string) => {
                    const entities = store.entities() || [];
                    const existingEntity = entities.find((e) => e[field] === search);
                    if (!existingEntity) {
                        return;
                    }

                    let mergedEntity: T;

                    // Handle nested property paths (e.g., "state/availability")
                    if (property.includes('/')) {
                        const keys = property.split('/');
                        const updatedEntity = { ...existingEntity };
                        let current: any = updatedEntity;

                        // Navigate to the nested property, creating objects as needed
                        for (let i = 0; i < keys.length - 1; i++) {
                            if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
                                current[keys[i]] = {};
                            } else {
                                current[keys[i]] = { ...current[keys[i]] };
                            }
                            current = current[keys[i]];
                        }

                        // Get the old value and merge if both are objects
                        const lastKey = keys[keys.length - 1];
                        const oldValue = current[lastKey];
                        const mergedValue = typeof newValue === 'object' && newValue !== null && typeof oldValue === 'object' && oldValue !== null
                            ? { ...oldValue, ...newValue }
                            : newValue;
                        current[lastKey] = mergedValue;
                        mergedEntity = updatedEntity as T;
                    } else {
                        const oldValue = existingEntity[property];
                        const mergedValue = typeof newValue === 'object' && newValue !== null && typeof oldValue === 'object' && oldValue !== null
                            ? { ...oldValue, ...newValue }
                            : newValue;
                        mergedEntity = { ...existingEntity, [property]: mergedValue } as T;
                    }

                    patchState(store, {
                        entities: entities.map((e) => (e[field] === search ? mergedEntity : e)),
                        lastUpdated: mergedEntity,
                        selectedEntity:
                            store.selectedEntity()?.[field] === search ? mergedEntity : store.selectedEntity()
                    });
                },

            }

            return methods
        })
    );

    return store;
}
