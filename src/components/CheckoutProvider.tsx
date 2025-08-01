import {FunctionComponent, PropsWithChildren, ReactNode} from 'react';
import * as stripeJs from '@stripe/stripe-js';

import React from 'react';
import PropTypes from 'prop-types';

import {parseStripeProp} from '../utils/parseStripeProp';
import {usePrevious} from '../utils/usePrevious';
import {isEqual} from '../utils/isEqual';
import {
  ElementsContext,
  ElementsContextValue,
  parseElementsContext,
} from './Elements';
import {registerWithStripeJs} from '../utils/registerWithStripeJs';

interface CheckoutSdkContextValue {
  checkoutSdk: stripeJs.StripeCheckout | null;
  stripe: stripeJs.Stripe | null;
}

const CheckoutSdkContext = React.createContext<CheckoutSdkContextValue | null>(
  null
);
CheckoutSdkContext.displayName = 'CheckoutSdkContext';

export const parseCheckoutSdkContext = (
  ctx: CheckoutSdkContextValue | null,
  useCase: string
): CheckoutSdkContextValue => {
  if (!ctx) {
    throw new Error(
      `Could not find CheckoutProvider context; You need to wrap the part of your app that ${useCase} in an <CheckoutProvider> provider.`
    );
  }

  return ctx;
};

type StripeCheckoutActions = Omit<
  Omit<stripeJs.StripeCheckout, 'session'>,
  'on'
>;

export interface CheckoutContextValue
  extends StripeCheckoutActions,
    stripeJs.StripeCheckoutSession {}
const CheckoutContext = React.createContext<CheckoutContextValue | null>(null);
CheckoutContext.displayName = 'CheckoutContext';

export const extractCheckoutContextValue = (
  checkoutSdk: stripeJs.StripeCheckout | null,
  sessionState: stripeJs.StripeCheckoutSession | null
): CheckoutContextValue | null => {
  if (!checkoutSdk) {
    return null;
  }

  const {on: _on, session: _session, ...actions} = checkoutSdk;
  if (!sessionState) {
    return Object.assign(checkoutSdk.session(), actions);
  }

  return Object.assign(sessionState, actions);
};

interface CheckoutProviderProps {
  /**
   * A [Stripe object](https://stripe.com/docs/js/initializing) or a `Promise` resolving to a `Stripe` object.
   * The easiest way to initialize a `Stripe` object is with the the [Stripe.js wrapper module](https://github.com/stripe/stripe-js/blob/master/README.md#readme).
   * Once this prop has been set, it can not be changed.
   *
   * You can also pass in `null` or a `Promise` resolving to `null` if you are performing an initial server-side render or when generating a static site.
   */
  stripe: PromiseLike<stripeJs.Stripe | null> | stripeJs.Stripe | null;
  options: stripeJs.StripeCheckoutOptions;
}

interface PrivateCheckoutProviderProps {
  stripe: unknown;
  options: stripeJs.StripeCheckoutOptions;
  children?: ReactNode;
}
const INVALID_STRIPE_ERROR =
  'Invalid prop `stripe` supplied to `CheckoutProvider`. We recommend using the `loadStripe` utility from `@stripe/stripe-js`. See https://stripe.com/docs/stripe-js/react#elements-props-stripe for details.';

export const CheckoutProvider: FunctionComponent<PropsWithChildren<
  CheckoutProviderProps
>> = (({
  stripe: rawStripeProp,
  options,
  children,
}: PrivateCheckoutProviderProps) => {
  const parsed = React.useMemo(
    () => parseStripeProp(rawStripeProp, INVALID_STRIPE_ERROR),
    [rawStripeProp]
  );

  // State used to trigger a re-render when sdk.session is updated
  const [
    session,
    setSession,
  ] = React.useState<stripeJs.StripeCheckoutSession | null>(null);

  const [ctx, setContext] = React.useState<CheckoutSdkContextValue>(() => ({
    stripe: parsed.tag === 'sync' ? parsed.stripe : null,
    checkoutSdk: null,
  }));

  const safeSetContext = (
    stripe: stripeJs.Stripe,
    checkoutSdk: stripeJs.StripeCheckout
  ) => {
    setContext((ctx) => {
      if (ctx.stripe && ctx.checkoutSdk) {
        return ctx;
      }

      return {stripe, checkoutSdk};
    });
  };

  // Ref used to avoid calling initCheckout multiple times when options changes
  const initCheckoutCalledRef = React.useRef(false);

  React.useEffect(() => {
    let isMounted = true;

    if (parsed.tag === 'async' && !ctx.stripe) {
      parsed.stripePromise.then((stripe) => {
        if (stripe && isMounted && !initCheckoutCalledRef.current) {
          // Only update context if the component is still mounted
          // and stripe is not null. We allow stripe to be null to make
          // handling SSR easier.
          initCheckoutCalledRef.current = true;
          stripe.initCheckout(options).then((checkoutSdk) => {
            if (checkoutSdk) {
              safeSetContext(stripe, checkoutSdk);
              checkoutSdk.on('change', setSession);
            }
          });
        }
      });
    } else if (
      parsed.tag === 'sync' &&
      parsed.stripe &&
      !initCheckoutCalledRef.current
    ) {
      initCheckoutCalledRef.current = true;
      parsed.stripe.initCheckout(options).then((checkoutSdk) => {
        if (checkoutSdk) {
          safeSetContext(parsed.stripe, checkoutSdk);
          checkoutSdk.on('change', setSession);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [parsed, ctx, options, setSession]);

  // Warn on changes to stripe prop
  const prevStripe = usePrevious(rawStripeProp);
  React.useEffect(() => {
    if (prevStripe !== null && prevStripe !== rawStripeProp) {
      console.warn(
        'Unsupported prop change on CheckoutProvider: You cannot change the `stripe` prop after setting it.'
      );
    }
  }, [prevStripe, rawStripeProp]);

  // Apply updates to elements when options prop has relevant changes
  const prevOptions = usePrevious(options);
  const prevCheckoutSdk = usePrevious(ctx.checkoutSdk);
  React.useEffect(() => {
    // Ignore changes while checkout sdk is not initialized.
    if (!ctx.checkoutSdk) {
      return;
    }

    const hasSdkLoaded = Boolean(!prevCheckoutSdk && ctx.checkoutSdk);

    // Handle appearance changes
    const previousAppearance = prevOptions?.elementsOptions?.appearance;
    const currentAppearance = options?.elementsOptions?.appearance;
    const hasAppearanceChanged = !isEqual(
      currentAppearance,
      previousAppearance
    );
    if (currentAppearance && (hasAppearanceChanged || hasSdkLoaded)) {
      ctx.checkoutSdk.changeAppearance(currentAppearance);
    }

    // Handle fonts changes
    const previousFonts = prevOptions?.elementsOptions?.fonts;
    const currentFonts = options?.elementsOptions?.fonts;
    const hasFontsChanged = !isEqual(previousFonts, currentFonts);

    if (currentFonts && (hasFontsChanged || hasSdkLoaded)) {
      ctx.checkoutSdk.loadFonts(currentFonts);
    }
  }, [options, prevOptions, ctx.checkoutSdk, prevCheckoutSdk]);

  // Attach react-stripe-js version to stripe.js instance
  React.useEffect(() => {
    registerWithStripeJs(ctx.stripe);
  }, [ctx.stripe]);

  const checkoutContextValue = React.useMemo(
    () => extractCheckoutContextValue(ctx.checkoutSdk, session),
    [ctx.checkoutSdk, session]
  );

  if (!ctx.checkoutSdk) {
    return null;
  }

  return (
    <CheckoutSdkContext.Provider value={ctx}>
      <CheckoutContext.Provider value={checkoutContextValue}>
        {children}
      </CheckoutContext.Provider>
    </CheckoutSdkContext.Provider>
  );
}) as FunctionComponent<PropsWithChildren<CheckoutProviderProps>>;

CheckoutProvider.propTypes = {
  stripe: PropTypes.any,
  options: PropTypes.shape({
    fetchClientSecret: PropTypes.func.isRequired,
    elementsOptions: PropTypes.object as any,
  }).isRequired,
};

export const useCheckoutSdkContextWithUseCase = (
  useCaseString: string
): CheckoutSdkContextValue => {
  const ctx = React.useContext(CheckoutSdkContext);
  return parseCheckoutSdkContext(ctx, useCaseString);
};

export const useElementsOrCheckoutSdkContextWithUseCase = (
  useCaseString: string
): CheckoutSdkContextValue | ElementsContextValue => {
  const checkoutSdkContext = React.useContext(CheckoutSdkContext);
  const elementsContext = React.useContext(ElementsContext);

  if (checkoutSdkContext && elementsContext) {
    throw new Error(
      `You cannot wrap the part of your app that ${useCaseString} in both <CheckoutProvider> and <Elements> providers.`
    );
  }

  if (checkoutSdkContext) {
    return parseCheckoutSdkContext(checkoutSdkContext, useCaseString);
  }

  return parseElementsContext(elementsContext, useCaseString);
};

export const useCheckout = (): CheckoutContextValue => {
  // ensure it's in CheckoutProvider
  useCheckoutSdkContextWithUseCase('calls useCheckout()');
  const ctx = React.useContext(CheckoutContext);
  if (!ctx) {
    throw new Error(
      'Could not find Checkout Context; You need to wrap the part of your app that calls useCheckout() in an <CheckoutProvider> provider.'
    );
  }
  return ctx;
};
