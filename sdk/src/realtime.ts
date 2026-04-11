import type { RealtimeEvent, RealtimePayload, RealtimeChannel as IRealtimeChannel } from './types';
import type { GoBaseAuth } from './auth';

export class GoBaseRealtime {
  private baseUrl: string;
  private auth: GoBaseAuth;
  private ws: WebSocket | null = null;
  private channels: Map<string, RealtimeChannelImpl> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;

  constructor(baseUrl: string, auth: GoBaseAuth) {
    // Convert http(s) to ws(s)
    this.baseUrl = baseUrl.replace(/^http/, 'ws');
    this.auth = auth;
  }

  /** Connect to the WebSocket server. */
  connect(): void {
    const token = this.auth.getAccessToken();
    if (!token) {
      console.error('GoBase Realtime: No access token. Sign in first.');
      return;
    }

    this.ws = new WebSocket(`${this.baseUrl}/realtime/ws?token=${token}`);

    this.ws.onopen = () => {
      console.log('GoBase Realtime: Connected');
      this.reconnectAttempts = 0;

      // Re-subscribe to all channels
      for (const [name] of this.channels) {
        this.sendSubscribe(name);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: RealtimePayload = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch (e) {
        console.error('GoBase Realtime: Failed to parse message', e);
      }
    };

    this.ws.onclose = () => {
      console.log('GoBase Realtime: Disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('GoBase Realtime: Error', error);
    };
  }

  /** Disconnect from the WebSocket server. */
  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnect
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.channels.clear();
  }

  /** Create a channel subscription builder. */
  channel(table: string): RealtimeChannelImpl {
    const channelName = `realtime:public:${table}`;
    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = new RealtimeChannelImpl(channelName, this);
      this.channels.set(channelName, channel);
    }
    return channel;
  }

  /** @internal Send subscribe message to server. */
  sendSubscribe(channel: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', channel }));
    }
  }

  /** @internal Send unsubscribe message to server. */
  sendUnsubscribe(channel: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe', channel }));
    }
    this.channels.delete(channel);
  }

  private handleMessage(msg: RealtimePayload): void {
    const channel = this.channels.get(msg.channel);
    if (channel) {
      channel.handleEvent(msg);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`GoBase Realtime: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    setTimeout(() => this.connect(), delay);
  }
}

/** A single realtime channel with event listeners. */
class RealtimeChannelImpl implements IRealtimeChannel {
  private name: string;
  private realtime: GoBaseRealtime;
  private listeners: Map<RealtimeEvent, ((payload: RealtimePayload) => void)[]> = new Map();

  constructor(name: string, realtime: GoBaseRealtime) {
    this.name = name;
    this.realtime = realtime;
  }

  /** Listen for a specific event type on this channel. */
  on(event: RealtimeEvent, callback: (payload: RealtimePayload) => void): this {
    const existing = this.listeners.get(event) || [];
    existing.push(callback);
    this.listeners.set(event, existing);
    return this;
  }

  /** Subscribe to this channel. */
  subscribe(): this {
    this.realtime.sendSubscribe(this.name);
    return this;
  }

  /** Unsubscribe from this channel. */
  unsubscribe(): void {
    this.realtime.sendUnsubscribe(this.name);
  }

  /** @internal Handle an incoming event. */
  handleEvent(payload: RealtimePayload): void {
    // Fire specific listeners
    const specific = this.listeners.get(payload.type as RealtimeEvent);
    if (specific) {
      specific.forEach(cb => cb(payload));
    }
    // Fire wildcard listeners
    const wildcards = this.listeners.get('*');
    if (wildcards) {
      wildcards.forEach(cb => cb(payload));
    }
  }
}
