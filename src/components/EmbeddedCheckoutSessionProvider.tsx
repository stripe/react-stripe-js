import {FunctionComponent, PropsWithChildren, ReactNode} from 'react';
import React from 'react';

import {usePrevious} from '../utils/usePrevious';
import {UnknownOptions} from '../utils/extractAllowedOptionsUpdates';
import {parseStripeProp} from '../utils/parseStripeProp';
import {registerWithStripeJs} from '../utils/registerWithStripeJs';
import * as stripeJs from '@stripe/stripe-js';

type EmbeddedCheckoutPublicInterface = {
  mount(location: string | HTMLElement): void;
  unmount(): void;
  destroy(): void;
};

export type EmbeddedCheckoutContextValue = {
  embeddedCheckout: EmbeddedCheckoutPublicInterface | null;
};

const EmbeddedCheckoutContext = React.createContext<
  EmbeddedCheckoutContextValue
>({embeddedCheckout: null});

export const useEmbeddedCheckoutContext = (): EmbeddedCheckoutContextValue => {
  const ctx = React.useContext(EmbeddedCheckoutContext);
  if (!ctx) {
    throw new Error(
      '<EmbeddedCheckout> must be used within <EmbeddedCheckoutSessionProvider>'
    );
  }
  return ctx;
};

interface EmbeddedCheckoutSessionProviderProps {
  /**
   * A [Stripe object](https://stripe.com/docs/js/initializing) or a `Promise`
   * resolving to a `Stripe` object.
   * The easiest way to initialize a `Stripe` object is with the the
   * [Stripe.js wrapper module](https://github.com/stripe/stripe-js/blob/master/README.md#readme).
   * Once this prop has been set, it can not be changed.
   *
   * You can also pass in `null` or a `Promise` resolving to `null` if you are
   * performing an initial server-side render or when generating a static site.
   */
  stripe: any;
  /**
   * [Embedded Checkout configuration options](https://stripe.com/docs/js/TODO).
   * Once the stripe prop has been set, these options cannot be changed.
   */
  options: {
    clientSecret: string;
    onComplete?: () => void;
  };
}

interface PrivateEmbeddedCheckoutSessionProviderProps {
  stripe: unknown;
  options?: UnknownOptions;
  children?: ReactNode;
}

export const EmbeddedCheckoutSessionProvider: FunctionComponent<PropsWithChildren<
  EmbeddedCheckoutSessionProviderProps
>> = ({
  stripe: rawStripeProp,
  options,
  children,
}: PrivateEmbeddedCheckoutSessionProviderProps) => {
  const parsed = React.useMemo(() => {
    return parseStripeProp(rawStripeProp);
  }, [rawStripeProp]);

  const embeddedCheckoutPromise = React.useRef<Promise<
    EmbeddedCheckoutPublicInterface
  > | null>(null);
  const loadedStripe = React.useRef<stripeJs.Stripe | null>(null);

  const [ctx, setContext] = React.useState<EmbeddedCheckoutContextValue>({
    embeddedCheckout: null,
  });

  React.useEffect(() => {
    // Don't support any ctx updates once embeddedCheckout or stripe is set.
    if (loadedStripe.current || embeddedCheckoutPromise.current) {
      return;
    }

    const setStripeAndInitEmbeddedCheckout = (stripe: stripeJs.Stripe) => {
      if (loadedStripe.current || embeddedCheckoutPromise.current) return;

      loadedStripe.current = stripe;
      embeddedCheckoutPromise.current = loadedStripe.current
        // @ts-expect-error initEmbeddedCheckout is not defined on the Stripe
        // interface yet.
        .initEmbeddedCheckout(options)
        .then((embeddedCheckout: EmbeddedCheckoutPublicInterface) => {
          setContext({embeddedCheckout});
        });
    };

    // For an async stripePromise, store it once resolved
    if (parsed.tag === 'async' && !loadedStripe.current) {
      parsed.stripePromise.then((stripe) => {
        if (stripe) {
          setStripeAndInitEmbeddedCheckout(stripe);
        }
      });
    } else if (parsed.tag === 'sync' && !loadedStripe.current) {
      // Or, handle a sync stripe instance going from null -> populated
      setStripeAndInitEmbeddedCheckout(parsed.stripe);
    }
  }, [parsed, options, ctx, loadedStripe]);

  React.useEffect(() => {
    // cleanup on unmount
    return () => {
      // If embedded checkout is fully initialized, destroy it.
      if (ctx.embeddedCheckout) {
        embeddedCheckoutPromise.current = null;
        ctx.embeddedCheckout.destroy();
      } else if (embeddedCheckoutPromise.current) {
        // If embedded checkout is still initializing, destroy it once
        // it's done. This could be caused by unmounting very quickly
        // after mounting.
        embeddedCheckoutPromise.current.then(() => {
          embeddedCheckoutPromise.current = null;
          if (ctx.embeddedCheckout) {
            ctx.embeddedCheckout.destroy();
          }
        });
      }
    };
  }, [ctx.embeddedCheckout]);

  // Attach react-stripe-js version to stripe.js instance
  React.useEffect(() => {
    registerWithStripeJs(loadedStripe);
  }, [loadedStripe]);

  // Warn on changes to stripe prop
  const prevStripe = usePrevious(rawStripeProp);
  React.useEffect(() => {
    if (prevStripe !== null && prevStripe !== rawStripeProp) {
      console.warn(
        'Unsupported prop change on EmbeddedCheckoutSessionProvider: You cannot change the `stripe` prop after setting it.'
      );
    }
  }, [prevStripe, rawStripeProp]);

  // Warn on changes to options prop
  const prevOptions = usePrevious(options);
  React.useEffect(() => {
    if (
      options != null &&
      prevOptions != null &&
      prevOptions.clientSecret !== options.clientSecret
    ) {
      console.warn(
        'Unsupported prop change on EmbeddedCheckoutSessionProvider: You cannot change the `clientSecret` option after setting it.'
      );
    }
  }, [prevOptions, options]);

  return (
    <EmbeddedCheckoutContext.Provider value={ctx}>
      {children}
    </EmbeddedCheckoutContext.Provider>
  );
};
