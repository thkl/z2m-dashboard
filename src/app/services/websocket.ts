import { Injectable, signal, computed, Signal } from '@angular/core';

export interface WebSocketMessage {
  topic: string;
  payload: any;
}

@Injectable({
  providedIn: 'root'
})
export class Websocket {
  private ws: WebSocket | null = null;
  private topicSignals = new Map<string, ReturnType<typeof signal<WebSocketMessage>>>();
  private wildcardSignals = new Map<string, ReturnType<typeof signal<WebSocketMessage>>>();
  private topicCallbacks = new Map<string, ((msg: WebSocketMessage) => void)[]>();
  private wildcardCallbacks = new Map<string, ((msg: WebSocketMessage) => void)[]>();
  private catchAllSignal = signal<WebSocketMessage | null>(null);
  private catchAllCallbacks: ((msg: WebSocketMessage) => void)[] = [];
  private isConntected = false;
  private timeout = 0;
  private url?: string;
  private timer?:number;

  connect(url: string): void {
    this.url = url;
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      this.timeout = 0;
      const message: WebSocketMessage = JSON.parse(event.data);

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
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);

    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      this.reconnect();
    };

    this.setWatchdog();
  }

  private setWatchdog(): void {
    this.timer = setInterval(() => {
      this.timeout = this.timeout + 1;
      if (this.timeout > 60) {
        this.reconnect();
      }
    }, 1000);
  }

  private clearWatchdog(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

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

  private reconnect(): void {
    setTimeout(() => {
      if ((this.url) && (this.isConntected)) {
        this.ws = new WebSocket(this.url);
      }
    }, 1000);
  }

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

  sendMessage(message: string) {
    if (this.ws) {
      this.ws.send(message);
    }
  }

  subscribeCatchAll(): Signal<WebSocketMessage | null> {
    return this.catchAllSignal.asReadonly();
  }

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

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConntected = false;
      this.clearWatchdog();
    }
  }
}
