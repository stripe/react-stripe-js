import React from 'react';
import * as stripeJs from '@stripe/stripe-js';

export const useAttachEvent = <A extends unknown[]>(
  element: stripeJs.StripeElement | null,
  event: string,
  cb?: (...args: A) => any
) => {
  const cbDefined = !!cb;
  const cbRef = React.useRef(cb);

  React.useEffect(() => {
    cbRef.current = cb;
  }, [cb]);

  React.useEffect(() => {
    if (!cbDefined || !element) {
      return () => {};
    }

    const decoratedCb = (...args: A): void => {
      if (cbRef.current) {
        cbRef.current(...args);
      }
    };

    (element as any).on(event, decoratedCb);

    return () => {
      (element as any).off(event, decoratedCb);
    };
  }, [cbDefined, event, element, cbRef]);
};
