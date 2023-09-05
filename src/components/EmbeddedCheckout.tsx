import * as React from 'react';
import {useEmbeddedCheckoutContext} from './EmbeddedCheckoutSessionProvider';

export const EmbeddedCheckout = () => {
  const {embeddedCheckout} = useEmbeddedCheckoutContext();

  const isMounted = React.useRef<boolean>(false);
  const domNode = React.useRef<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    if (!isMounted.current && embeddedCheckout && domNode.current !== null) {
      embeddedCheckout.mount(domNode.current);
      isMounted.current = true;
    }

    // Clean up on unmount
    return () => {
      if (isMounted.current && embeddedCheckout) {
        embeddedCheckout.unmount();
        isMounted.current = false;
      }
    };
  }, [embeddedCheckout]);

  return <div ref={domNode} />;
};
