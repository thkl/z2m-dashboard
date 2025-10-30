/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
/*
@Injectable({ providedIn: 'root' })
export class SignalBusService {
    private events = new Map<string, WritableSignal<any>>();

    emit<T>(eventName: string, data: T) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, signal(data));
        } else {
            this.events.get(eventName)!.set(data);
        }
    }

    on<T>(eventName: string): Signal<T> {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, signal(null));
        }
        return this.events.get(eventName)!.asReadonly();
    }
}

/**
 * Usage :
 * this.signalBus.emit('action',{type:'bla',data:1});
 *
 * consume:
 * action = this.signalBus.on<{type:string,data:number}>('action');
 * Beware the current date will be signaled on subscripton
 * 
 * change this via 
 * 
 * this.signalBus.configure({ 
      defaultEventType: 'state',
      autoRegister: true 
    });
 * 
 */

export interface EventConfig {
    type: 'event' | 'state';
    initialValue?: any;
}

export interface SignalBusOptions {
    defaultEventType: 'event' | 'state';
    autoRegister: boolean;
}

export interface EventBusSignalData<T> {
    data: T;
    timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class SignalBusService {
    private events = new Map<string, WritableSignal<any>>();
    private configs = new Map<string, EventConfig>();

    private options: SignalBusOptions = {
        defaultEventType: 'event', // Default to event behavior for backward compatibility
        autoRegister: true
    };

    constructor() {}

    // Configure global options
    configure(options: Partial<SignalBusOptions>) {
        this.options = { ...this.options, ...options };
    }

    // Explicit registration (takes precedence over auto-registration)
    register<T>(eventName: string, config: EventConfig) {
        this.configs.set(eventName, config);

        if (config.type === 'state') {
            this.events.set(eventName, signal(config.initialValue ?? null));
        }
    }

    emit<T>(eventName: string, data: T) {
        let config = this.configs.get(eventName);

        // Auto-register if not explicitly registered and auto-registration is enabled
        if (!config && this.options.autoRegister) {
            config = { type: this.options.defaultEventType };
            this.configs.set(eventName, config);
        }

        if (!config) {
            // Fallback to old behavior if auto-registration is disabled
            if (!this.events.has(eventName)) {
                this.events.set(eventName, signal(data));
            } else {
                this.events.get(eventName)!.set(data);
            }
            return;
        }

        if (config.type === 'event') {
            // For events, wrap with unique identifier
            const eventData: EventBusSignalData<T> = {
                data,
                timestamp: Date.now()
            };

            if (!this.events.has(eventName)) {
                this.events.set(eventName, signal(eventData));
            } else {
                this.events.get(eventName)!.set(eventData);
            }
        } else {
            // For state, just update the value
            if (!this.events.has(eventName)) {
                this.events.set(eventName, signal(data));
            } else {
                this.events.get(eventName)!.set(data);
            }
        }
    }

    on<T>(eventName: string): Signal<T> {
        if (!this.events.has(eventName)) {
            const config = this.configs.get(eventName);
            if (config?.type === 'state') {
                this.events.set(eventName, signal(config.initialValue ?? null));
            } else {
                this.events.set(eventName, signal(null));
            }
        }
        return this.events.get(eventName)!.asReadonly();
    }

    // Convenience methods with auto-registration override
    onEvent<T>(eventName: string): Signal<{ data: T; timestamp: number; id: string } | null> {
        // Auto-register as event if not already registered
        if (!this.configs.has(eventName)) {
            this.register(eventName, { type: 'event' });
        }
        return this.on(eventName);
    }

    onState<T>(eventName: string, initialValue: T | null = null): Signal<T> {
        // Auto-register as state if not already registered
        if (!this.configs.has(eventName)) {
            this.register(eventName, { type: 'state', initialValue });
        }
        return this.on(eventName);
    }

    // Helper methods
    isRegistered(eventName: string): boolean {
        return this.configs.has(eventName);
    }

    getChannelType(eventName: string): 'event' | 'state' | 'unregistered' {
        const config = this.configs.get(eventName);
        return config ? config.type : 'unregistered';
    }

    // Reset the signal's last known value to null without emitting an event
    // This allows the next identical value to trigger the signal
    reset(eventName: string): void {
        if (this.events.has(eventName)) {
            this.events.get(eventName)!.set(null);
        }
    }
}
