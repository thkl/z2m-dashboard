import { computed } from '@angular/core';
import { BaseEntity, SearchByPropertiesOptions, SearchCriteria, SearchOperator } from './generic.store';

// Create independent view of store entities - SOLVES THE OVERRIDE PROBLEM
export function createStoreView<T extends BaseEntity>(
    store: any, // The store instance
    searchCriteria: SearchByPropertiesOptions<T>,
    findUnique = false,
    defaultValue: any,
    autoParseJson?: string
) {
    // Helper function to evaluate search criteria (same as in store)
    const evaluateSearchCriteria = (entity: T, criteria: SearchCriteria<T>): boolean => {
        const entityValue = entity[criteria.property];
        const searchValue = criteria.value;
        const operator = criteria.operator || 'equals';
        const caseSensitive = criteria.caseSensitive ?? false;

        if (entityValue == null) return false;

        const entityStr = caseSensitive ? entityValue.toString() : entityValue.toString().toLowerCase();
        const searchStr = caseSensitive ? searchValue.toString() : searchValue.toString().toLowerCase();

        switch (operator) {
            case 'equals':
                return entityValue === searchValue;

            case 'not':
                return entityValue !== searchValue;
            case 'contains':
                return entityStr.includes(searchStr);
            case 'startsWith':
                return entityStr.startsWith(searchStr);
            case 'endsWith':
                return entityStr.endsWith(searchStr);
            case 'greaterThan':
                return Number(entityValue) > Number(searchValue);
            case 'lessThan':
                return Number(entityValue) < Number(searchValue);
            case 'greaterThanOrEqual':
                return Number(entityValue) >= Number(searchValue);
            case 'lessThanOrEqual':
                return Number(entityValue) <= Number(searchValue);
            default:
                return entityStr.includes(searchStr);
        }
    };

    // Return computed signal that creates independent view
    return computed(() => {
        const currentEntities = store.entities() || [];

        if (!searchCriteria.criteria?.length) {
            return currentEntities;
        }

        const filteredEntities = currentEntities.filter((entity: T) => {
            if (searchCriteria.logicalOperator === SearchOperator.AND) {
                const result = searchCriteria.criteria.every((criterion: any) =>
                    evaluateSearchCriteria(entity, criterion)
                );
                return result;
            } else {
                return searchCriteria.criteria.some((criterion: any) => evaluateSearchCriteria(entity, criterion));
            }
        });

        if (autoParseJson !== undefined) {
            if (filteredEntities.length > 0) {
                const result = filteredEntities[0];
                try {
                    return JSON.parse(result[autoParseJson]);
                } catch (e) {
                    return defaultValue;
                }
            } else {
                return defaultValue || [];
            }
        } else if (defaultValue && filteredEntities.length === 0) {
            return findUnique === true ? defaultValue : [defaultValue];
        } else {
            return findUnique === true ? filteredEntities[0] || null : filteredEntities;
        }
    });
}

// Convenience functions for creating common views
export function createEqualsView<T extends BaseEntity>(
    store: any,
    property: keyof T,
    value: any,
    findUnique?: false,
    defaultValue?: any
) {
    return createStoreView(
        store,
        {
            criteria: [{ property, value, operator: 'equals' }],
            logicalOperator: SearchOperator.AND
        },
        findUnique,
        defaultValue
    );
}

export function createContainsView<T extends BaseEntity>(
    store: any,
    property: keyof T,
    value: any,
    caseSensitive?: boolean,
    findUnique?: false,
    defaultValue?: any
) {
    return createStoreView(
        store,
        {
            criteria: [{ property, value, operator: 'contains', caseSensitive }],
            logicalOperator: SearchOperator.AND
        },
        findUnique,
        defaultValue
    );
}

export function createRangeView<T extends BaseEntity>(
    store: any,
    property: keyof T,
    min: number,
    max: number,
    defaultValue?: any
) {
    return createStoreView(
        store,
        {
            criteria: [
                { property, value: min, operator: 'greaterThanOrEqual' },
                { property, value: max, operator: 'lessThanOrEqual' }
            ],
            logicalOperator: SearchOperator.AND
        },
        false,
        defaultValue
    );
}

export function createMultiCriteriaView<T extends BaseEntity>(
    store: any,
    criteria: SearchCriteria<T>[],
    logicalOperator: SearchOperator = SearchOperator.AND,
    findUnique: boolean = false,
    defaultValue?: any,
    autoParseJson?: string
) {
    return createStoreView(
        store,
        {
            criteria,
            logicalOperator
        },
        findUnique,
        defaultValue,
        autoParseJson
    );
}

export function createMultiCriteriaViewWithOptions<T extends BaseEntity>(
    store: any,
    options: {
        criteria: SearchCriteria<T>[];
        logicalOperator?: SearchOperator;
        findUnique?: boolean;
        defaultValue?: any;
        autoParseJson?: string;
    }
) {
    const {
        criteria,
        logicalOperator = SearchOperator.AND,
        findUnique = false,
        defaultValue = false,
        autoParseJson
    } = options;
    return createStoreView(
        store,
        {
            criteria,
            logicalOperator
        },
        findUnique,
        defaultValue,
        autoParseJson
    );
}

/**
 * this will create a View on a store with the search parameters to find items
 * kind of a Selector in NGRX Stores
 * @param store the store
 * @param options the search options:
 *        options.serach : a key value list for properties to search
 *        options.logicalOperator : how the properties are combined (Defaults to AND)
 *        options.findUnique: true if only return the first result
 * @returns a signal
 */
export function createView<T extends BaseEntity>(
    store: any,
    options: {
        search: { [key: string]: any };
        logicalOperator?: SearchOperator;
        findUnique?: boolean;
        defaultValue?: any;
        autoParseJson?: string;
    }
) {
    const { search, logicalOperator = SearchOperator.AND, findUnique = false, defaultValue, autoParseJson } = options;
    const criteria: SearchCriteria<T>[] = [];

    Object.keys(search).forEach((key) => {
        criteria.push({ property: key, value: search[key] });
    });
    return createMultiCriteriaView(store, criteria, logicalOperator, findUnique, defaultValue, autoParseJson);
}
