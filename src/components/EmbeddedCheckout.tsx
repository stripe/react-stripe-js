import React from 'react';
import {useEmbeddedCheckoutContext} from './EmbeddedCheckoutProvider';
import {isServer} from '../utils/isServer';

interface EmbeddedCheckoutProps {
  /**
   * Passes through to the Embedded Checkout container.
   */
  id?: string;

  /**
   * Passes through to the Embedded Checkout container.
   */
  className?: string;
}

const EmbeddedCheckoutClientElement = ({
  id,
  className,
}: EmbeddedCheckoutProps) => {
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

  return <div ref={domNode} id={id} className={className} />;
};

// Only render the wrapper in a server environment.
const EmbeddedCheckoutServerElement = ({
  id,
  className,
}: EmbeddedCheckoutProps) => {
  // Validate that we are in the right context by calling useEmbeddedCheckoutContext.
  useEmbeddedCheckoutContext();
  return <div id={id} className={className} />;
};

export const EmbeddedCheckout = isServer
  ? EmbeddedCheckoutServerElement
  : EmbeddedCheckoutClientElement;
