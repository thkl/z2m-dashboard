export interface DeviceOption {
    access: number;
    description: string;
    label: string;
    name: string;
    property: string;
    type: string;
    value_step: number;
}


export interface DeviceExpose {
    access: number;
    category: string;
    description: string;
    label: string;
    name: string;
    property: string;
    type: string;
    unit: string;
    value_max: number;
    value_min: number;
}

export interface DeviceDefinition {
    description: string;
    exposes: DeviceExpose[];
    model: string;
    options: DeviceOption[];
    source: string;
    supports_ota: boolean;
    vendor: string;
}


export interface Device {
    date_code: string;
    definition: DeviceDefinition;
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
    state:any;
    availability:string;   
}

