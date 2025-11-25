export interface Group {
    friendly_name: string;
    id: number;
    members: Member[];
    scenes: Scene[];
    off_state?: ['last_member_state'];
    optimistic?: boolean;
    qos?: number;
    retain?: boolean;
}

export interface Member {
    endpoint: string;
    ieee_address: string;
}

export interface Scene {
    id: number;
    name: string;
}
