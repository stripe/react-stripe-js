import React from 'react';

export type EventHandler = (...args: unknown[]) => void;

export interface EventEmitter {
  on(type: string, handler: EventHandler): this;
  off(type: string, handler: EventHandler): this;
}

export type EventProps<K extends string> = Partial<
  Record<K, EventHandler | undefined>
>;

type SavedHandler = {
  source: EventHandler;
  registered: EventHandler;
};

export const useEvents = <K extends string, E extends EventEmitter>(
  eventProps: EventProps<K>,
  emitterRef: React.MutableRefObject<E | null>,
  eventTransform: {
    [event: string]: (handler: EventHandler, emitter: E) => EventHandler;
  } = {}
): void => {
  const eventHandlers = React.useRef<Map<string, SavedHandler> | null>(null);

  React.useEffect(() => {
    if (!emitterRef.current) {
      return;
    }

    const currentHandlers: Map<string, SavedHandler> =
      eventHandlers.current || new Map();
    const newHandlers = new Map<string, SavedHandler>();

    eventHandlers.current = newHandlers;

    for (const [onEvent, handler] of Object.entries<EventHandler | undefined>(
      eventProps
    )) {
      if (onEvent.substring(0, 2) !== 'on' || typeof handler !== 'function') {
        continue;
      }

      const event = onEvent[2].toLowerCase() + onEvent.substring(3);

      let savedHandler = currentHandlers.get(event);

      if (!savedHandler || savedHandler.source !== handler) {
        savedHandler = {
          source: handler,
          registered:
            event in eventTransform
              ? eventTransform[event](handler, emitterRef.current)
              : handler,
        };

        emitterRef.current.on(event, savedHandler.registered);
      } else {
        currentHandlers.delete(event);
      }
      newHandlers.set(event, savedHandler);
    }

    for (const [event, savedHandler] of currentHandlers.entries()) {
      emitterRef.current.off(event, savedHandler.registered);
    }
  });
};
