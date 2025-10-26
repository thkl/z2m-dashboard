export const SUPPORT_NEW_DEVICES_URL = "https://www.zigbee2mqtt.io/advanced/support-new-devices/01_support_new_devices.html";
export const DEVICES_ROOT_URL = "https://www.zigbee2mqtt.io/devices/{id}";
export const VENDOR_ROOT_URL="https://www.zigbee2mqtt.io/supported-devices/#v={id}"


export enum InterviewState {
    Pending = "PENDING",
    InProgress = "IN_PROGRESS",
    Successful = "SUCCESSFUL",
    Failed = "FAILED",
}

export enum UpdateState {
    idle = "idle",
    available = "available",
    updating = "updating"
}

export const LogLevels = [ { value:"info", label: "Info", isSelected: false },
    { value:"debug", label: "Debug", isSelected: false },
    { value:"warning", label: "Warning", isSelected: false },
    { value:"error", label: "Error", isSelected: false }]



export const BLACKLISTED_PARTIAL_FEATURE_NAMES = ["schedule_", "_mode", "_options", "_startup", "_type", "inching_", 
    "cyclic_", "_scene","learning","countdown","_memory","_calibration",
"led_indication","_timeout","_disturb","child_lock"];

export const BLACKLISTED_FEATURE_NAMES = ["effect", "power_on_behavior", "gradient","action"];

export const WHITELIST_FEATURE_NAMES = ["state", "color_temp", "color", "transition", "brightness"];
export type SubFeatureType =  "switch" | "lock" | "composite" | "light" | "cover" | "fan" | "climate"
export type BasicFeatureType = "binary" | "list" | "numeric" | "enum" | "text";
export type FeatureDisplayMode = "settings" | "dashboard" | "scene"