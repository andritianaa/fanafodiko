type Handler<T = any> = (event: T) => void | Promise<void>;

export class EventBus {
  private readonly handlers: Map<string, Handler[]> = new Map();

  subscribe<T>(eventName: string, handler: Handler<T>) {
    const current = this.handlers.get(eventName) || [];
    this.handlers.set(eventName, [...current, handler]);
  }

  async publish(eventName: string, event: any) {
    const handlers = this.handlers.get(eventName) || [];
    // On lance les handlers de manière asynchrone pour ne pas bloquer le flux principal
    handlers.forEach((handler) => handler(event));
  }
}

// singleton
export const globalEventBus = new EventBus();
