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