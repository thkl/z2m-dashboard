import { InterviewState, SubFeatureType, UpdateState } from "./constants";


export interface DeviceOption {
    access: number;
    description: string;
    label: string;
    name: string;
    property: string;
    type: string;
    value_step?: number;
    value_on?:string;
    value_off?:string;
    value:any;
    enum?:any[];
}

export interface DeviceFeatureVisual {
    property:DeviceFeature;
    value:any
    subtype?:any
    helper:any
    validForScenes:boolean
    validForDashboard:boolean
}

export interface FeaturePreset {
    description: string;
    name:string;
    value:any;
}

export enum AccessMode {
    /**
     * Bit 0: The property can be found in the published state of this device
     */
    STATE = 0b001,
    /**
     * Bit 1: The property can be set with a /set command
     */
    SET = 0b010,
    /**
     * Bit 2: The property can be retrieved with a /get command
     */
    GET = 0b100,
    /**
     * Bitwise inclusive OR of STATE and SET : 0b001 | 0b010
     */
    STATE_SET = 0b011,
    /**
     * Bitwise inclusive OR of STATE and GET : 0b001 | 0b100
     */
    STATE_GET = 0b101,
    /**
     * Bitwise inclusive OR of STATE and GET and SET : 0b001 | 0b100 | 0b010
     */
    ALL = 0b111,
}


export interface DeviceFeature {
    features?:DeviceFeature[]
    access: number;
    category: string;
    description: string;
    label: string;
    name: string;
    property: string;
    type: "binary" | "list" | "numeric" | "enum" | "text" | SubFeatureType;
    subtype: SubFeatureType;
    unit: string;
    value_max?: number;
    value_min?: number;
    value_on?:string;
    value_off?:string;
    value_toggle?:string;
    values?:any[];
    endpoint?:string;
    presets?:FeaturePreset[];
    hidden:boolean;
}

export interface DeviceDefinition {
    description: string;
    exposes: DeviceFeature[];
    model: string;
    image: string;
    icon?:string;
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

export interface DeviceTargetState {
        [key: string]: any;
}


export interface DeviceUpdate {
    installed_version: number;
    latest_version:    number;
    state:             UpdateState;
    progress?:         number;
    remaining?:        number;
}


export interface Device {
    date_code: string;
    definition: DeviceDefinition;
    description:string;
    disabled: boolean;
    endpoints: { [key: string]: Endpoint };
    friendly_name: string;
    ieee_address: string;
    interview_completed: boolean;
    interview_state: InterviewState;
    interviewing: boolean;
    manufacturer: string;
    model_id: string;
    network_address: number;
    power_source: string;
    software_build_id: string;
    supported: boolean;
    type: string;
    state:DeviceState;
    options: {[key: string]: any};
    update?:DeviceUpdate;
}

export interface BindingTarget {
    endpoint:string;
    ieee_address:string;
    type:string;
}

export interface Binding {
    cluster:string;
    target:BindingTarget
}

export interface Endpoint {
    bindings:              Binding[];
    clusters:              Clusters;
    configured_reportings: any[];
    scenes:                any[];
}

export interface Clusters {
    input:  string[];
    output: string[];
}

