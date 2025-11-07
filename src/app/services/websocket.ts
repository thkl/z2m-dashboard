import { SignalBusService } from '@/app/services/sigbalbus.service';
import { Injectable, signal, computed, Signal, inject } from '@angular/core';

export interface Connection {
  name: string;
  host: string;
  port: number;
  secure: boolean;
  token?: string;
}

const ERROR_UNAUTHORIZED = 4401;

/**
 * Message structure for WebSocket communication.
 * Used for MQTT-style topic-based message routing.
 */
export interface WebSocketMessage {
  /** The message topic (e.g., 'bridge/devices' or 'device/status') */
  topic: string;
  /** The message payload containing the actual data */
  payload: any;
}

/**
 * WebSocket service with MQTT-style topic routing and automatic reconnection.
 *
 * Features:
 * - Topic-based message routing with wildcard support (e.g., 'device/*\/status')
 * - Angular Signal integration for reactive updates
 * - Automatic reconnection with watchdog timer
 * - Callback and Signal-based subscriptions
 * - Connection pause/resume support
 *
 * @example
 * ```typescript
 * // Subscribe to a specific topic
 * const deviceSignal = websocket.subscribeTopic('bridge/devices');
 *
 * // Subscribe with a callback
 * const unsubscribe = websocket.subscribeTopicCallback('device/status', (msg) => {
 *   console.log('Device status:', msg.payload);
 * });
 *
 * // Send a message
 * websocket.sendMessage(JSON.stringify({ topic: 'device/set', payload: { state: 'on' } }));
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class Websocket {
  /** The underlying WebSocket connection instance */
  private ws: WebSocket | null = null;
  /** Map of exact topic names to their associated Angular signals */
  private topicSignals = new Map<string, ReturnType<typeof signal<WebSocketMessage>>>();
  /** Map of wildcard topic patterns to their associated Angular signals */
  private wildcardSignals = new Map<string, ReturnType<typeof signal<WebSocketMessage>>>();
  /** Map of exact topic names to their callback functions */
  private topicCallbacks = new Map<string, ((msg: WebSocketMessage) => void)[]>();
  /** Map of wildcard topic patterns to their callback functions */
  private wildcardCallbacks = new Map<string, ((msg: WebSocketMessage) => void)[]>();
  /** Signal that receives all messages not matched by specific subscriptions */
  private catchAllSignal = signal<WebSocketMessage | null>(null);
  /** Array of callbacks that receive all unmatched messages */
  private catchAllCallbacks: ((msg: WebSocketMessage) => void)[] = [];
  /** Connection policy flag - if true, the service will attempt to maintain connection */
  private shouldBeConnected = false;
  /** Seconds since last message received (used by watchdog timer) */
  private timeout = 0;
  /** The WebSocket connection */
  private connection?: Connection;
  /** Interval timer ID for the watchdog */
  private timer?: number;
  private isConnecting: boolean = false;
  private failTimes: number = 0;
  protected readonly signalBusService = inject(SignalBusService);
  /**
   * Establishes a WebSocket connection to the specified URL.
   * Closes any existing connection before creating a new one.
   * Sets up message routing, error handling, and automatic reconnection.
   *
   * @param connection - The connection object
   *
   * @example
   * ```typescript
   * websocket.connect('wss://example.com/api');
   * ```
   */
  connect(connection: Connection): void {
    const { host, port, secure, token } = connection;

    console.log("connect to", connection.host);
    const stripped = host.replace(/^(https?:\/\/)/, "");;
    this.clearWatchdog();
    let url = `${secure ? 'wss' : 'ws'}://${stripped}:${port}/api`;
    if (token) {
      url = `${url}?token=${token}`
    }
    this.connection = connection;
    if (this.ws) {
      console.log("found existing close it")
      this.ws.close(1000);
    }

    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      this.isConnecting = false;
      this.timeout = 0;
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        if (!message || typeof message.topic !== 'string') {
          console.warn('Invalid message format:', event.data);
          return;
        }
        // if the message has a transaction id its a reply 
        if (message.payload && message.payload.transaction) {
          this.signalBusService.emit(`bridge-response-${message.payload.transaction}`, message);
        }

        // Check for exact topic match
        const topicSignal = this.topicSignals.get(message.topic);
        if (topicSignal) {
          topicSignal.set({ ...message });
        }

        // Trigger exact topic callbacks
        const callbacks = this.topicCallbacks.get(message.topic);
        if (callbacks) {
          callbacks.forEach(cb => cb(message));
        }

        // Check for wildcard matches
        let wildcardMatched = false;
        for (const [pattern, signal] of this.wildcardSignals.entries()) {
          if (this.matchesWildcard(message.topic, pattern)) {
            signal.set({ ...message });
            wildcardMatched = true;
          }
        }

        // Trigger wildcard callbacks
        for (const [pattern, callbacks] of this.wildcardCallbacks.entries()) {
          if (this.matchesWildcard(message.topic, pattern)) {
            callbacks.forEach(cb => cb(message));
            wildcardMatched = true;
          }
        }

        // If no exact match or wildcard match, trigger catch-all
        if (!topicSignal && !wildcardMatched) {
          this.catchAllSignal.set({ ...message });
          this.catchAllCallbacks.forEach(cb => cb(message));
        }

      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
        return;
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnecting = false;
      this.failTimes = this.failTimes + 1;
      if (this.failTimes < 5) {
        this.reconnect();
      } else {
        this.signalBusService.emit("connection_error", 'error_connecting');
      }
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.log('WebSocket connection closed', event);
      switch (event.code) {
        case ERROR_UNAUTHORIZED:
          this.signalBusService.emit("connection_error", 'authentication_needed');
          break;
        case 1000:
          // normal closure
          this.clearWatchdog();
          break;
        case 1006:
          this.failTimes = this.failTimes + 1;
          if (this.failTimes < 5) {
            this.reconnect();
          } else {
            this.signalBusService.emit("connection_error", 'error_connecting');
          }
          break;
        default:
          this.reconnect();

      }
    };

    this.ws.onopen = () => {
      this.shouldBeConnected = true;
      this.failTimes = 0;
      this.setWatchdog();
    }


  }

  /**
   * Starts a watchdog timer that monitors connection health.
   * If no messages are received for 60 seconds, triggers a reconnection.
   * Clears any existing watchdog timer before starting a new one.
   *
   * @private
   */
  private setWatchdog(): void {
    this.clearWatchdog();
    this.timer = setInterval(() => {
      this.timeout = this.timeout + 1;
      if (this.timeout > 60) {
        this.clearWatchdog();
        this.reconnect();
      }
    }, 1000);
  }

  /**
   * Stops the watchdog timer and resets the timeout counter.
   * Safe to call even if no watchdog is currently running.
   *
   * @private
   */
  private clearWatchdog(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.timeout = 0;
  }

  /**
   * Subscribes to messages on a specific topic or wildcard pattern.
   * Returns an Angular Signal that updates when matching messages are received.
   *
   * Supports wildcard patterns using '*' to match a single topic level.
   * For example: 'device/*\/status' matches 'device/sensor1/status', 'device/light2/status', etc.
   *
   * @param topic - The topic name or wildcard pattern to subscribe to
   * @returns A readonly Signal that emits matching messages
   *
   * @example
   * ```typescript
   * // Subscribe to exact topic
   * const bridgeSignal = websocket.subscribeTopic('bridge/devices');
   *
   * // Subscribe to wildcard pattern
   * const deviceSignal = websocket.subscribeTopic('device/*\/status');
   *
   * // Use in component
   * effect(() => {
   *   const message = bridgeSignal();
   *   if (message) {
   *     console.log('Devices:', message.payload);
   *   }
   * });
   * ```
   */
  subscribeTopic(topic: string): Signal<any> {
    // Check if topic contains wildcard
    if (topic.includes('*')) {
      if (!this.wildcardSignals.has(topic)) {
        this.wildcardSignals.set(topic, signal<any>(null));
      }
      return this.wildcardSignals.get(topic)!.asReadonly();
    } else {
      if (!this.topicSignals.has(topic)) {
        this.topicSignals.set(topic, signal<any>(null));
      }
      return this.topicSignals.get(topic)!.asReadonly();
    }
  }

  /**
   * Attempts to reconnect to the WebSocket server after a delay.
   * Only reconnects if a URL is set and shouldBeConnected flag is true.
   * This allows pausing reconnection attempts when desired.
   *
   * @private
   */
  private reconnect(): void {
    if (this.isConnecting) {
      return;
    }
    setTimeout(() => {
      if ((this.connection) && (this.shouldBeConnected)) {
        this.connect(this.connection);
      }
    }, 10000);
  }

  /**
   * Checks if a topic matches a wildcard pattern using MQTT-style matching.
   * The '*' character matches a single topic level (anything except '/').
   *
   * @param topic - The topic to test (e.g., 'device/sensor1/status')
   * @param pattern - The pattern to match against (e.g., 'device/*\/status')
   * @returns True if the topic matches the pattern, false otherwise
   *
   * @private
   *
   * @example
   * ```typescript
   * matchesWildcard('device/sensor1/status', 'device/*\/status'); // true
   * matchesWildcard('device/sensor1/temp', 'device/*\/status');   // false
   * ```
   */
  private matchesWildcard(topic: string, pattern: string): boolean {
    // MQTT-style wildcard matching
    // * matches a single level (anything except /)
    const regexPattern = pattern
      .split('/')
      .map(part => {
        if (part === '*') {
          return '[^/]+'; // Match one or more characters except /
        }
        // Escape special regex characters in literal parts
        return part.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('/');
    const regex = new RegExp(`^${regexPattern}$`);
    const matches = regex.test(topic);
    return matches;
  }

  /**
   * Subscribes to messages on a topic or wildcard pattern using a callback function.
   * Alternative to Signal-based subscription for imperative code.
   *
   * @param topic - The topic name or wildcard pattern to subscribe to
   * @param callback - Function called when a matching message is received
   * @returns Unsubscribe function - call it to remove the subscription
   *
   * @example
   * ```typescript
   * // Subscribe to a topic
   * const unsubscribe = websocket.subscribeTopicCallback('bridge/devices', (msg) => {
   *   console.log('Devices:', msg.payload);
   * });
   *
   * // Later, unsubscribe
   * unsubscribe();
   * ```
   */
  subscribeTopicCallback(topic: string, callback: (msg: WebSocketMessage) => void): () => void {
    if (topic.includes('*')) {
      if (!this.wildcardCallbacks.has(topic)) {
        this.wildcardCallbacks.set(topic, []);
      }
      this.wildcardCallbacks.get(topic)!.push(callback);

      // Return unsubscribe function
      return () => {
        const callbacks = this.wildcardCallbacks.get(topic);
        if (callbacks) {
          const index = callbacks.indexOf(callback);
          if (index > -1) {
            callbacks.splice(index, 1);
          }
        }
      };
    } else {
      if (!this.topicCallbacks.has(topic)) {
        this.topicCallbacks.set(topic, []);
      }
      this.topicCallbacks.get(topic)!.push(callback);

      // Return unsubscribe function
      return () => {
        const callbacks = this.topicCallbacks.get(topic);
        if (callbacks) {
          const index = callbacks.indexOf(callback);
          if (index > -1) {
            callbacks.splice(index, 1);
          }
        }
      };
    }
  }

  /**
   * Sends a message through the WebSocket connection.
   * Only sends if the connection is currently open.
   * Silently ignores the message if the connection is not open.
   *
   * @param message - The message string to send (typically JSON-stringified)
   *
   * @example
   * ```typescript
   * const msg = JSON.stringify({
   *   topic: 'device/set',
   *   payload: { state: 'on' }
   * });
   * websocket.sendMessage(msg);
   * ```
   */
  sendMessage(message: string) {
    if (this.ws && this.ws.readyState === this.ws.OPEN) {
      this.ws.send(message);
    }
  }

  /**
   * Subscribes to all messages that don't match any specific topic subscription.
   * Useful for debugging or handling unexpected messages.
   *
   * @returns A readonly Signal that emits unmatched messages
   *
   * @example
   * ```typescript
   * const catchAllSignal = websocket.subscribeCatchAll();
   * effect(() => {
   *   const msg = catchAllSignal();
   *   if (msg) {
   *     console.log('Unhandled message:', msg.topic, msg.payload);
   *   }
   * });
   * ```
   */
  subscribeCatchAll(): Signal<WebSocketMessage | null> {
    return this.catchAllSignal.asReadonly();
  }

  /**
   * Subscribes to all unmatched messages using a callback function.
   * Alternative to Signal-based catch-all subscription.
   *
   * @param callback - Function called for each unmatched message
   * @returns Unsubscribe function - call it to remove the subscription
   *
   * @example
   * ```typescript
   * const unsubscribe = websocket.subscribeCatchAllCallback((msg) => {
   *   console.log('Unhandled:', msg.topic);
   * });
   * ```
   */
  subscribeCatchAllCallback(callback: (msg: WebSocketMessage) => void): () => void {
    this.catchAllCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.catchAllCallbacks.indexOf(callback);
      if (index > -1) {
        this.catchAllCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Closes the WebSocket connection and prevents automatic reconnection.
   * Cleans up the watchdog timer and sets shouldBeConnected to false.
   * Safe to call even if not currently connected.
   *
   * @example
   * ```typescript
   * // Disconnect when user logs out
   * websocket.disconnect();
   * ```
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.shouldBeConnected = false;
      this.clearWatchdog();
    }
  }
}
