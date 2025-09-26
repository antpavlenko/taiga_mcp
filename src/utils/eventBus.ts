type Listener<T> = (payload: T) => void;

export class EventBus {
  private listeners: Record<string, Listener<any>[]> = {};
  on<T>(event: string, listener: Listener<T>) {
    (this.listeners[event] ||= []).push(listener as any);
    return () => { this.listeners[event] = this.listeners[event].filter(l => l !== listener); };
  }
  emit<T>(event: string, payload: T) {
    (this.listeners[event] || []).forEach(l => l(payload));
  }
}

export const GlobalEventBus = new EventBus();
