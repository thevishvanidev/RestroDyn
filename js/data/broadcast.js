// ── RestroDyn BroadcastChannel Manager ──
// Cross-tab real-time communication for orders, status updates, menu changes

const CHANNEL_NAME = 'restrodyn-sync';

export const EVENTS = {
  NEW_ORDER: 'NEW_ORDER',
  ORDER_STATUS_CHANGE: 'ORDER_STATUS_CHANGE',
  MENU_UPDATE: 'MENU_UPDATE',
  CALL_WAITER: 'CALL_WAITER',
  SETTINGS_UPDATE: 'SETTINGS_UPDATE',
};

class BroadcastManager {
  constructor() {
    this.channel = null;
    this.listeners = new Map();
    this.init();
  }

  init() {
    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        const { type, payload } = event.data;
        const handlers = this.listeners.get(type) || [];
        handlers.forEach(handler => handler(payload));
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported, real-time sync disabled');
    }
  }

  send(type, payload) {
    if (this.channel) {
      this.channel.postMessage({ type, payload, timestamp: Date.now() });
    }
  }

  on(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(handler);
  }

  off(type, handler) {
    const handlers = this.listeners.get(type) || [];
    this.listeners.set(type, handlers.filter(h => h !== handler));
  }

  destroy() {
    if (this.channel) {
      this.channel.close();
    }
  }
}

// Singleton
export const broadcast = new BroadcastManager();
