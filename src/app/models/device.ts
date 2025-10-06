export interface DeviceOption {
    access: number;
    description: string;
    label: string;
    name: string;
    property: string;
    type: string;
    value_step: number;
}

export interface DeviceExposeVisual {
    property:DeviceExpose;
    value:any
}

export interface ExposurePreset {
    description: string;
    name:string;
    value:any;
}

export interface DeviceExpose {
    features?:DeviceExpose[]
    access: number;
    category: string;
    description: string;
    label: string;
    name: string;
    property: string;
    type: "binary" | "enum" | "numeric" 
    unit: string;
    value_max: number;
    value_min: number;
    values?:any[];
    presets?:ExposurePreset[];
}

export interface DeviceDefinition {
    description: string;
    exposes: DeviceExpose[];
    model: string;
    image: string;
    options: DeviceOption[];
    source: string;
    supports_ota: boolean;
    vendor: string;
}

export interface DeviceState {
    availability:string;   
    lastseenhuman:string;
    last_seen:string;
    linkquality:number;
    battery:number;
    [key: string]: any;
}


export interface Device {
    date_code: string;
    definition: DeviceDefinition;
    description:string;
    disabled: boolean;
    endpoints: any
    friendly_name: string;
    ieee_address: string;
    interview_completed: boolean;
    interview_state: string;
    interviewing: boolean;
    manufacturer: string;
    model_id: string;
    network_address: number;
    power_source: string;
    software_build_id: string;
    supported: boolean;
    type: string;
    state:DeviceState;
}

