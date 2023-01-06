import React from 'react';
import * as stripeJs from '@stripe/stripe-js';

export const useAttachEvent = <A extends unknown[]>(
  element: stripeJs.StripeElement | null,
  event: string,
  cb?: (...args: A) => any
) => {
  React.useEffect(() => {
    if (!cb || !element) {
      return () => {};
    }

    (element as any).on(event, cb);

    return () => {
      (element as any).off(event, cb);
    };
  }, [cb, event, element]);
};
