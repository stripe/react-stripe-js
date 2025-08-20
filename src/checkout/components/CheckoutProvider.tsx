import {FunctionComponent, PropsWithChildren, ReactNode} from 'react';
import * as stripeJs from '@stripe/stripe-js';

import React from 'react';
import PropTypes from 'prop-types';

import {parseStripeProp} from '../../utils/parseStripeProp';
import {usePrevious} from '../../utils/usePrevious';
import {isEqual} from '../../utils/isEqual';
import {
  ElementsContext,
  ElementsContextValue,
  parseElementsContext,
} from '../../components/Elements';
import {registerWithStripeJs} from '../../utils/registerWithStripeJs';

export type CheckoutValue = StripeCheckoutActions &
  stripeJs.StripeCheckoutSession;

export type CheckoutState =
  | {type: 'loading'}
  | {
      type: 'success';
      checkout: CheckoutValue;
    }
  | {type: 'error'; error: {message: string}};

type CheckoutContextValue = {
  stripe: stripeJs.Stripe | null;
  checkoutState: CheckoutState;
};

const CheckoutContext = React.createContext<CheckoutContextValue | null>(null);
CheckoutContext.displayName = 'CheckoutContext';

const validateCheckoutContext = (
  ctx: CheckoutContextValue | null,
  useCase: string
): CheckoutContextValue => {
  if (!ctx) {
    throw new Error(
      `Could not find CheckoutProvider context; You need to wrap the part of your app that ${useCase} in a <CheckoutProvider> provider.`
    );
  }
  return ctx;
};

type StripeCheckoutActions = Omit<
  Omit<stripeJs.StripeCheckout, 'session'>,
  'on'
>;

const getContextValue = (
  stripe: stripeJs.Stripe | null,
  state: State
): CheckoutContextValue => {
  if (state.type === 'success') {
    const {sdk, session} = state;
    const {on: _on, session: _session, ...actions} = sdk;
    return {
      stripe,
      checkoutState: {
        type: 'success',
        checkout: Object.assign({}, session, actions),
      },
    };
  } else {
    return {stripe, checkoutState: state};
  }
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

type State =
  | {type: 'loading'}
  | {
      type: 'success';
      sdk: stripeJs.StripeCheckout;
      session: stripeJs.StripeCheckoutSession;
    }
  | {type: 'error'; error: {message: string}};

const maybeSdk = (state: State): stripeJs.StripeCheckout | null => {
  if (state.type === 'success') {
    return state.sdk;
  } else {
    return null;
  }
};

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

  const [state, setState] = React.useState<State>({type: 'loading'});
  const [stripe, setStripe] = React.useState<stripeJs.Stripe | null>(null);

  // Ref used to avoid calling initCheckout multiple times when options changes
  const initCheckoutCalledRef = React.useRef(false);

  React.useEffect(() => {
    let isMounted = true;

    const init = ({stripe}: {stripe: stripeJs.Stripe}) => {
      if (stripe && isMounted && !initCheckoutCalledRef.current) {
        // Only update context if the component is still mounted
        // and stripe is not null. We allow stripe to be null to make
        // handling SSR easier.
        initCheckoutCalledRef.current = true;
        stripe.initCheckout(options).then(
          (sdk) => {
            setState({type: 'success', sdk, session: sdk.session()});
            sdk.on('change', (session) => {
              setState((prevState) => {
                if (prevState.type === 'success') {
                  return {
                    type: 'success',
                    sdk: prevState.sdk,
                    session,
                  };
                } else {
                  return prevState;
                }
              });
            });
          },
          (error) => {
            setState({type: 'error', error});
          }
        );
      }
    };

    if (parsed.tag === 'async') {
      parsed.stripePromise.then((stripe) => {
        setStripe(stripe);
        if (stripe) {
          init({stripe});
        } else {
          // Only update context if the component is still mounted
          // and stripe is not null. We allow stripe to be null to make
          // handling SSR easier.
        }
      });
    } else if (parsed.tag === 'sync') {
      setStripe(parsed.stripe);
      init({stripe: parsed.stripe});
    }

    return () => {
      isMounted = false;
    };
  }, [parsed, options, setState]);

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
  const sdk = maybeSdk(state);
  const prevOptions = usePrevious(options);
  const prevCheckoutSdk = usePrevious(sdk);
  React.useEffect(() => {
    // Ignore changes while checkout sdk is not initialized.
    if (!sdk) {
      return;
    }

    const hasSdkLoaded = Boolean(!prevCheckoutSdk && sdk);

    // Handle appearance changes
    const previousAppearance = prevOptions?.elementsOptions?.appearance;
    const currentAppearance = options?.elementsOptions?.appearance;
    const hasAppearanceChanged = !isEqual(
      currentAppearance,
      previousAppearance
    );
    if (currentAppearance && (hasAppearanceChanged || hasSdkLoaded)) {
      sdk.changeAppearance(currentAppearance);
    }

    // Handle fonts changes
    const previousFonts = prevOptions?.elementsOptions?.fonts;
    const currentFonts = options?.elementsOptions?.fonts;
    const hasFontsChanged = !isEqual(previousFonts, currentFonts);

    if (currentFonts && (hasFontsChanged || hasSdkLoaded)) {
      sdk.loadFonts(currentFonts);
    }
  }, [options, prevOptions, sdk, prevCheckoutSdk]);

  // Attach react-stripe-js version to stripe.js instance
  React.useEffect(() => {
    registerWithStripeJs(stripe);
  }, [stripe]);

  const contextValue = React.useMemo(() => getContextValue(stripe, state), [
    stripe,
    state,
  ]);

  return (
    <CheckoutContext.Provider value={contextValue}>
      {children}
    </CheckoutContext.Provider>
  );
}) as FunctionComponent<PropsWithChildren<CheckoutProviderProps>>;

CheckoutProvider.propTypes = {
  stripe: PropTypes.any,
  options: PropTypes.shape({
    fetchClientSecret: PropTypes.func.isRequired,
    elementsOptions: PropTypes.object as any,
  }).isRequired,
};

export const useElementsOrCheckoutContextWithUseCase = (
  useCaseString: string
): CheckoutContextValue | ElementsContextValue => {
  const checkout = React.useContext(CheckoutContext);
  const elements = React.useContext(ElementsContext);

  if (checkout) {
    if (elements) {
      throw new Error(
        `You cannot wrap the part of your app that ${useCaseString} in both <CheckoutProvider> and <Elements> providers.`
      );
    } else {
      return checkout;
    }
  } else {
    return parseElementsContext(elements, useCaseString);
  }
};

export const useCheckout = (): CheckoutState => {
  const ctx = React.useContext(CheckoutContext);
  const {checkoutState} = validateCheckoutContext(ctx, 'calls useCheckout()');
  return checkoutState;
};
