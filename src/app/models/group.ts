export interface Group {
    friendly_name: string;
    id:            number;
    members:       Member[];
    scenes:        Scene[];
}

export interface Member {
    endpoint:     string;
    ieee_address: string;
}

export interface Scene {
    id:   number;
    name: string;
}
