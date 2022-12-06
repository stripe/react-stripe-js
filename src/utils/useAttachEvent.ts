import React from 'react';
import * as stripeJs from '@stripe/stripe-js';

export const useAttachEvent = <A extends unknown[]>(
  elementRef: React.MutableRefObject<stripeJs.StripeElement | null>,
  event: string,
  cb?: (...args: A) => any
) => {
  React.useEffect(() => {
    if (!cb || !elementRef.current) {
      return () => {};
    }

    const element = elementRef.current;

    (element as any).on(event, cb);

    return () => (element as any).off(event, cb);
  }, [cb, event, elementRef]);
};
