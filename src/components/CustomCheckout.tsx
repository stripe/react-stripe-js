import {FunctionComponent, PropsWithChildren, ReactNode} from 'react';
import * as stripeJs from '@stripe/stripe-js';

import React from 'react';
import PropTypes from 'prop-types';

import {parseStripeProp} from '../utils/parseStripeProp';
import {usePrevious} from '../utils/usePrevious';
import {isUnknownObject} from '../utils/guards';
import {isEqual} from '../utils/isEqual';
import {
  ElementsContext,
  ElementsContextValue,
  parseElementsContext,
} from './Elements';
import {registerWithStripeJs} from '../utils/registerWithStripeJs';

interface CustomCheckoutSdkContextValue {
  customCheckoutSdk: stripeJs.StripeCustomCheckout | null;
  stripe: stripeJs.Stripe | null;
}

const CustomCheckoutSdkContext = React.createContext<CustomCheckoutSdkContextValue | null>(
  null
);
CustomCheckoutSdkContext.displayName = 'CustomCheckoutSdkContext';

export const parseCustomCheckoutSdkContext = (
  ctx: CustomCheckoutSdkContextValue | null,
  useCase: string
): CustomCheckoutSdkContextValue => {
  if (!ctx) {
    throw new Error(
      `Could not find CustomCheckoutProvider context; You need to wrap the part of your app that ${useCase} in an <CustomCheckoutProvider> provider.`
    );
  }

  return ctx;
};

type StripeCustomCheckoutActions = Omit<
  Omit<stripeJs.StripeCustomCheckout, 'session'>,
  'on'
>;

interface CustomCheckoutContextValue
  extends StripeCustomCheckoutActions,
    stripeJs.StripeCustomCheckoutSession {}
const CustomCheckoutContext = React.createContext<CustomCheckoutContextValue | null>(
  null
);
CustomCheckoutContext.displayName = 'CustomCheckoutContext';

export const extractCustomCheckoutContextValue = (
  customCheckoutSdk: stripeJs.StripeCustomCheckout | null,
  sessionState: stripeJs.StripeCustomCheckoutSession | null
): CustomCheckoutContextValue | null => {
  if (!customCheckoutSdk) {
    return null;
  }

  const {on: _on, session: _session, ...actions} = customCheckoutSdk;
  if (!sessionState) {
    return {...actions, ...customCheckoutSdk.session()};
  }

  return {...actions, ...sessionState};
};

interface CustomCheckoutProviderProps {
  /**
   * A [Stripe object](https://stripe.com/docs/js/initializing) or a `Promise` resolving to a `Stripe` object.
   * The easiest way to initialize a `Stripe` object is with the the [Stripe.js wrapper module](https://github.com/stripe/stripe-js/blob/master/README.md#readme).
   * Once this prop has been set, it can not be changed.
   *
   * You can also pass in `null` or a `Promise` resolving to `null` if you are performing an initial server-side render or when generating a static site.
   */
  stripe: PromiseLike<stripeJs.Stripe | null> | stripeJs.Stripe | null;
  options: stripeJs.StripeCustomCheckoutOptions;
}

interface PrivateCustomCheckoutProviderProps {
  stripe: unknown;
  options: stripeJs.StripeCustomCheckoutOptions;
  children?: ReactNode;
}
const INVALID_STRIPE_ERROR =
  'Invalid prop `stripe` supplied to `CustomCheckoutProvider`. We recommend using the `loadStripe` utility from `@stripe/stripe-js`. See https://stripe.com/docs/stripe-js/react#elements-props-stripe for details.';

export const CustomCheckoutProvider: FunctionComponent<PropsWithChildren<
  CustomCheckoutProviderProps
>> = (({
  stripe: rawStripeProp,
  options,
  children,
}: PrivateCustomCheckoutProviderProps) => {
  const parsed = React.useMemo(
    () => parseStripeProp(rawStripeProp, INVALID_STRIPE_ERROR),
    [rawStripeProp]
  );

  // State used to trigger a re-render when sdk.session is updated
  const [
    session,
    setSession,
  ] = React.useState<stripeJs.StripeCustomCheckoutSession | null>(null);

  const [ctx, setContext] = React.useState<CustomCheckoutSdkContextValue>(
    () => ({
      stripe: parsed.tag === 'sync' ? parsed.stripe : null,
      customCheckoutSdk: null,
    })
  );

  const safeSetContext = (
    stripe: stripeJs.Stripe,
    customCheckoutSdk: stripeJs.StripeCustomCheckout
  ) => {
    setContext((ctx) => {
      if (ctx.stripe && ctx.customCheckoutSdk) {
        return ctx;
      }

      return {stripe, customCheckoutSdk};
    });
  };

  // Ref used to avoid calling initCustomCheckout multiple times when options changes
  const initCustomCheckoutCalledRef = React.useRef(false);

  React.useEffect(() => {
    let isMounted = true;

    if (parsed.tag === 'async' && !ctx.stripe) {
      parsed.stripePromise.then((stripe) => {
        if (stripe && isMounted && !initCustomCheckoutCalledRef.current) {
          // Only update context if the component is still mounted
          // and stripe is not null. We allow stripe to be null to make
          // handling SSR easier.
          initCustomCheckoutCalledRef.current = true;
          stripe.initCustomCheckout(options).then((customCheckoutSdk) => {
            if (customCheckoutSdk) {
              safeSetContext(stripe, customCheckoutSdk);
              customCheckoutSdk.on('change', setSession);
            }
          });
        }
      });
    } else if (
      parsed.tag === 'sync' &&
      parsed.stripe &&
      !initCustomCheckoutCalledRef.current
    ) {
      initCustomCheckoutCalledRef.current = true;
      parsed.stripe.initCustomCheckout(options).then((customCheckoutSdk) => {
        if (customCheckoutSdk) {
          safeSetContext(parsed.stripe, customCheckoutSdk);
          customCheckoutSdk.on('change', setSession);
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
        'Unsupported prop change on CustomCheckoutProvider: You cannot change the `stripe` prop after setting it.'
      );
    }
  }, [prevStripe, rawStripeProp]);

  // Apply updates to elements when options prop has relevant changes
  const prevOptions = usePrevious(options);
  React.useEffect(() => {
    if (!ctx.customCheckoutSdk) {
      return;
    }

    if (
      options.clientSecret &&
      !isUnknownObject(prevOptions) &&
      !isEqual(options.clientSecret, prevOptions.clientSecret)
    ) {
      console.warn(
        'Unsupported prop change: options.client_secret is not a mutable property.'
      );
    }

    const previousAppearance = prevOptions?.elementsOptions?.appearance;
    const currentAppearance = options?.elementsOptions?.appearance;
    if (currentAppearance && !isEqual(currentAppearance, previousAppearance)) {
      ctx.customCheckoutSdk.changeAppearance(currentAppearance);
    }
  }, [options, prevOptions, ctx.customCheckoutSdk]);

  // Attach react-stripe-js version to stripe.js instance
  React.useEffect(() => {
    registerWithStripeJs(ctx.stripe);
  }, [ctx.stripe]);

  const customCheckoutContextValue = React.useMemo(
    () => extractCustomCheckoutContextValue(ctx.customCheckoutSdk, session),
    [ctx.customCheckoutSdk, session]
  );

  if (!ctx.customCheckoutSdk) {
    return null;
  }

  return (
    <CustomCheckoutSdkContext.Provider value={ctx}>
      <CustomCheckoutContext.Provider value={customCheckoutContextValue}>
        {children}
      </CustomCheckoutContext.Provider>
    </CustomCheckoutSdkContext.Provider>
  );
}) as FunctionComponent<PropsWithChildren<CustomCheckoutProviderProps>>;

CustomCheckoutProvider.propTypes = {
  stripe: PropTypes.any,
  options: PropTypes.shape({
    clientSecret: PropTypes.string.isRequired,
    elementsOptions: PropTypes.object as any,
  }).isRequired,
};

export const useCustomCheckoutSdkContextWithUseCase = (
  useCaseString: string
): CustomCheckoutSdkContextValue => {
  const ctx = React.useContext(CustomCheckoutSdkContext);
  return parseCustomCheckoutSdkContext(ctx, useCaseString);
};

export const useElementsOrCustomCheckoutSdkContextWithUseCase = (
  useCaseString: string
): CustomCheckoutSdkContextValue | ElementsContextValue => {
  const customCheckoutSdkContext = React.useContext(CustomCheckoutSdkContext);
  const elementsContext = React.useContext(ElementsContext);

  if (customCheckoutSdkContext && elementsContext) {
    throw new Error(
      `You cannot wrap the part of your app that ${useCaseString} in both <CustomCheckoutProvider> and <Elements> providers.`
    );
  }

  if (customCheckoutSdkContext) {
    return parseCustomCheckoutSdkContext(
      customCheckoutSdkContext,
      useCaseString
    );
  }

  return parseElementsContext(elementsContext, useCaseString);
};

export const useCustomCheckout = (): CustomCheckoutContextValue => {
  // ensure it's in CustomCheckoutProvider
  useCustomCheckoutSdkContextWithUseCase('calls useCustomCheckout()');
  const ctx = React.useContext(CustomCheckoutContext);
  if (!ctx) {
    throw new Error(
      'Could not find CustomCheckout Context; You need to wrap the part of your app that calls useCustomCheckout() in an <CustomCheckoutProvider> provider.'
    );
  }
  return ctx;
};
