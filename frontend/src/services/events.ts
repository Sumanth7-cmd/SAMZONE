type EventHandler = (data: any) => void;

class EventEmitter {
    private events: { [key: string]: EventHandler[] } = {};

    on(event: string, handler: EventHandler) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(handler);
    }

    off(event: string, handler: EventHandler) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(h => h !== handler);
    }

    emit(event: string, data: any) {
        if (!this.events[event]) return;
        this.events[event].forEach(handler => handler(data));
    }
}

export const eventBus = new EventEmitter();

export const EVENTS = {
    PRODUCT_SELECTED: 'PRODUCT_SELECTED',
    TRY_ON_STARTED: 'TRY_ON_STARTED',
};
