import { BasicFeatureType, BLACKLISTED_FEATURE_NAMES, BLACKLISTED_PARTIAL_FEATURE_NAMES, SubFeatureType, WHITELIST_FEATURE_NAMES } from "../models/constants";
import { AccessMode, DeviceFeature } from "../models/device";

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
