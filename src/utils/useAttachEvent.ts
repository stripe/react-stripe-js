import React from 'react';
import * as stripeJs from '@stripe/stripe-js';

export const useAttachEvent = <A extends unknown[]>(
  elementRef: React.MutableRefObject<stripeJs.StripeElement | null>,
  event: string,
  cb?: (...args: A) => any
) => {
  const removePreviousEvent = React.useRef(() => {});

  const addEventCallback = React.useCallback(() => {
    removePreviousEvent.current();

    if (!elementRef.current || !cb) {
      removePreviousEvent.current = () => {};
      return;
    }

    const element = elementRef.current;

    (element as any).on(event, cb);

    removePreviousEvent.current = () => {
      if (element === elementRef.current) {
        (element as any).off(event, cb);
      }
    };
  }, [cb, event, elementRef]);

  React.useEffect(() => addEventCallback(), [addEventCallback]);

  return addEventCallback;
};
