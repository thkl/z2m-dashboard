import { convertColorToHtml, hsvToHtmlRgb, xyToHtmlRgb } from "@/app/utils/color.util";
import { BasicFeatureType, BLACKLISTED_FEATURE_NAMES, BLACKLISTED_PARTIAL_FEATURE_NAMES, SubFeatureType, WHITELIST_FEATURE_NAMES } from "../models/constants";
import { AccessMode, DeviceFeature, DeviceFeatureVisual } from "../models/device";

export function filterData<T>(
    data: T[],
    searchText: string,
    searchableFields: (item: T) => any[]
): T[] {
    if (!searchText || searchText.trim() === '') return data;

    const lowerSearchText = searchText.toLowerCase().trim();

    return data.filter(item => {
        const fields = searchableFields(item);
        return fields.some(field => {
            if (field == null) return false;
            return String(field).toLowerCase().includes(lowerSearchText);
        });
    });
}


export const normalizeDeviceModel = (model: string): string => {
    const find = "[/| |:]";
    const re = new RegExp(find, "g");
    return model.replace(re, "_");
};


export const isValidForScenes = (feature: DeviceFeature): boolean => {
    if (feature.name) {
        if (WHITELIST_FEATURE_NAMES.includes(feature.name)) {
            return true;
        }

        for (const bName of BLACKLISTED_PARTIAL_FEATURE_NAMES) {
            if (feature.name.includes(bName)) {
                return false;
            }
        }

        if (BLACKLISTED_FEATURE_NAMES.includes(feature.name)) {
            return false;
        }
    }

    return (
        !feature.access ||
        feature.access === AccessMode.ALL ||
        feature.access === AccessMode.SET ||
        feature.access === AccessMode.STATE_SET
    );
};


export const isValidForDashboard = (feature: DeviceFeature): boolean => {


    if (feature.category === "config" || feature.type === "list") {
        return false;
    }

    if (WHITELIST_FEATURE_NAMES.includes(feature.name)) {
        return true;
    }

    for (const bName of BLACKLISTED_PARTIAL_FEATURE_NAMES) {
        if (feature.name.includes(bName)) {
            return false;
        }
    }

    if (BLACKLISTED_FEATURE_NAMES.includes(feature.name)) {
        return false;
    }


    return true;
};




export function flattenExposures(exposures: DeviceFeature[], states: any): DeviceFeatureVisual[] {
    const result: DeviceFeatureVisual[] = [];

    const flatten = (exp: DeviceFeature, parentValue?: any, parentIsComposite: boolean = false, parentType?: any) => {
        const value = parentValue?.[exp.property] ?? states?.[exp.property];

        // Set hidden property for features that don't have it defined
        if (exp.hidden === undefined) {
            // Only hide nested features that are inside a composite type
            exp.hidden = parentIsComposite;
        }

        // Skip hidden features
        if (exp.hidden === true) {
            return;
        }

        if (!exp.features || exp.features.length === 0) {
            result.push({
                property: exp,
                value: value ?? null,
                helper: null,
                subtype: parentType,
                validForScenes: isValidForScenes(exp),
                validForDashboard: isValidForDashboard(exp)
            });
        } else {
            // Only add parent feature if it's a composite type or light type
            // For composite types, we show both the parent and children
            // For light types, we only show the children
            const isComposite = exp.type === 'composite';

            if (isComposite) {
                let helperValue = null;

                // Check if this is a color composite
                if (exp.property === 'color' && value) {
                    helperValue = convertColorToHtml(exp, value);
                }

                result.push({
                    property: exp,
                    value: value ?? null,
                    helper: helperValue,
                    subtype: parentType,
                    validForScenes: isValidForScenes(exp),
                    validForDashboard: isValidForDashboard(exp)
                });
            }

            // Recursively flatten sub-features
            exp.features.forEach(f => flatten(f, value, isComposite, exp.type));
        }
    };

    exposures.forEach(exp => flatten(exp));
    return result;
}