export interface Bridge {
    commit:                     string;
    config:                     Config;
    config_schema:              ConfigSchema;
    coordinator:                Coordinator;
    log_level:                  string;
    mqtt:                       BridgeMqtt;
    network:                    Network;
    os:                         OS;
    permit_join:                boolean;
    restart_required:           boolean;
    version:                    string;
    zigbee_herdsman:            ZigbeeHerdsman;
    zigbee_herdsman_converters: ZigbeeHerdsman;
}

export interface Config {
    advanced:       Advanced;
    availability:   Availability;
    blocklist:      any[];
    device_options: ConfigSchema;
    devices:        ConfigSchema;
    frontend:       Frontend;
    groups:         ConfigSchema;
    health:         Health;
    homeassistant:  Homeassistant;
    map_options:    MapOptions;
    mqtt:           ConfigMqtt;
    ota:            Ota;
    passlist:       any[];
    serial:         Serial;
    version:        number;
}

export interface Advanced {
    cache_state:                 boolean;
    cache_state_persistent:      boolean;
    cache_state_send_on_startup: boolean;
    channel:                     number;
    elapsed:                     boolean;
    ext_pan_id:                  number[];
    last_seen:                   string;
    log_console_json:            boolean;
    log_debug_namespace_ignore:  string;
    log_debug_to_mqtt_frontend:  boolean;
    log_directories_to_keep:     number;
    log_directory:               string;
    log_file:                    string;
    log_level:                   string;
    log_namespaced_levels:       ConfigSchema;
    log_output:                  string[];
    log_rotation:                boolean;
    log_symlink_current:         boolean;
    log_syslog:                  ConfigSchema;
    output:                      string;
    pan_id:                      number;
    timestamp_format:            string;
}

export interface ConfigSchema {
      [key: string]: any;
}

export interface Availability {
    active:  Active;
    enabled: boolean;
    passive: Passive;
}

export interface Active {
    backoff:             boolean;
    max_jitter:          number;
    pause_on_backoff_gt: number;
    timeout:             number;
}

export interface Passive {
    timeout: number;
}

export interface Frontend {
    base_url: string;
    enabled:  boolean;
    package:  string;
    port:     number;
}

export interface Health {
    interval:       number;
    reset_on_check: boolean;
}

export interface Homeassistant {
    discovery_topic:             string;
    enabled:                     boolean;
    experimental_event_entities: boolean;
    legacy_action_sensor:        boolean;
    status_topic:                string;
}

export interface MapOptions {
    graphviz: Graphviz;
}

export interface Graphviz {
    colors: Colors;
}

export interface Colors {
    fill: Fill;
    font: Fill;
    line: Line;
}

export interface Fill {
    coordinator: string;
    enddevice:   string;
    router:      string;
}

export interface Line {
    active:   string;
    inactive: string;
}

export interface ConfigMqtt {
    base_topic:                 string;
    force_disable_retain:       boolean;
    include_device_information: boolean;
    keepalive:                  number;
    maximum_packet_size:        number;
    reject_unauthorized:        boolean;
    server:                     string;
    user:                       string;
    version:                    number;
}

export interface Ota {
    default_maximum_data_size:      number;
    disable_automatic_update_check: boolean;
    image_block_response_delay:     number;
    update_check_interval:          number;
}

export interface Serial {
    adapter:     string;
    baudrate:    number;
    disable_led: boolean;
    port:        string;
}

export interface Coordinator {
    ieee_address: string;
    meta:         Meta;
    type:         string;
}

export interface Meta {
    maintrel:     number;
    majorrel:     number;
    minorrel:     number;
    product:      number;
    revision:     number;
    transportrev: number;
}

export interface BridgeMqtt {
    server:  string;
    version: number;
}

export interface Network {
    channel:         number;
    extended_pan_id: string;
    pan_id:          number;
}

export interface OS {
    cpus:         string;
    memory_mb:    number;
    node_version: string;
    version:      string;
}

export interface ZigbeeHerdsman {
    version: string;
}
