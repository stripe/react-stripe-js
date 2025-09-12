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

type State =
  | {
      type: 'loading';
      sdk: stripeJs.StripeCheckout | null;
    }
  | {
      type: 'success';
      sdk: stripeJs.StripeCheckout;
      checkoutActions: stripeJs.LoadActionsSuccess;
      session: stripeJs.StripeCheckoutSession;
    }
  | {type: 'error'; error: {message: string}};

type CheckoutContextValue = {
  stripe: stripeJs.Stripe | null;
  checkoutState: State;
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

const maybeSdk = (state: State): stripeJs.StripeCheckout | null => {
  if (state.type === 'success' || state.type === 'loading') {
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

  const [state, setState] = React.useState<State>({type: 'loading', sdk: null});
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
        const sdk = stripe.initCheckout(options);
        setState({type: 'loading', sdk});

        sdk
          .loadActions()
          .then((result) => {
            if (result.type === 'success') {
              const {actions} = result;
              setState({
                type: 'success',
                sdk,
                checkoutActions: actions,
                session: actions.getSession(),
              });

              sdk.on('change', (session) => {
                setState((prevState) => {
                  if (prevState.type === 'success') {
                    return {
                      type: 'success',
                      sdk: prevState.sdk,
                      checkoutActions: prevState.checkoutActions,
                      session,
                    };
                  } else {
                    return prevState;
                  }
                });
              });
            } else {
              setState({type: 'error', error: result.error});
            }
          })
          .catch((error) => {
            setState({type: 'error', error});
          });
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
  React.useEffect(() => {
    // Ignore changes while checkout sdk is not initialized.
    if (!sdk) {
      return;
    }

    // Handle appearance changes
    const previousAppearance = prevOptions?.elementsOptions?.appearance;
    const currentAppearance = options?.elementsOptions?.appearance;
    const hasAppearanceChanged = !isEqual(
      currentAppearance,
      previousAppearance
    );
    if (currentAppearance && hasAppearanceChanged) {
      sdk.changeAppearance(currentAppearance);
    }

    // Handle fonts changes
    const previousFonts = prevOptions?.elementsOptions?.fonts;
    const currentFonts = options?.elementsOptions?.fonts;
    const hasFontsChanged = !isEqual(previousFonts, currentFonts);

    if (currentFonts && hasFontsChanged) {
      sdk.loadFonts(currentFonts);
    }
  }, [options, prevOptions, sdk]);

  // Attach react-stripe-js version to stripe.js instance
  React.useEffect(() => {
    registerWithStripeJs(stripe);
  }, [stripe]);

  // Use useMemo to prevent unnecessary re-renders of child components
  // when the context value object reference changes but the actual values haven't
  const contextValue = React.useMemo(
    () => ({
      stripe,
      checkoutState: state,
    }),
    [stripe, state]
  );

  return (
    <CheckoutContext.Provider value={contextValue}>
      {children}
    </CheckoutContext.Provider>
  );
}) as FunctionComponent<PropsWithChildren<CheckoutProviderProps>>;

CheckoutProvider.propTypes = {
  stripe: PropTypes.any,
  options: PropTypes.shape({
    clientSecret: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Promise),
    ]).isRequired,
    elementsOptions: PropTypes.object,
  }).isRequired,
} as PropTypes.ValidationMap<CheckoutProviderProps>;

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

type StripeCheckoutActions = Omit<
  stripeJs.StripeCheckout,
  'on' | 'loadActions'
> &
  Omit<stripeJs.LoadActionsSuccess, 'getSession'>;

export type StripeCheckoutValue = StripeCheckoutActions &
  stripeJs.StripeCheckoutSession;

export type StripeUseCheckoutResult =
  | {type: 'loading'}
  | {
      type: 'success';
      checkout: StripeCheckoutValue;
    }
  | {type: 'error'; error: {message: string}};

const mapStateToUseCheckoutResult = (
  checkoutState: State
): StripeUseCheckoutResult => {
  if (checkoutState.type === 'success') {
    const {sdk, session, checkoutActions} = checkoutState;
    const {on: _on, loadActions: _loadActions, ...elementsMethods} = sdk;
    const {getSession: _getSession, ...otherCheckoutActions} = checkoutActions;
    const actions = {
      ...elementsMethods,
      ...otherCheckoutActions,
    };
    return {
      type: 'success',
      checkout: {
        ...session,
        ...actions,
      },
    };
  } else if (checkoutState.type === 'loading') {
    return {
      type: 'loading',
    };
  } else {
    return {
      type: 'error',
      error: checkoutState.error,
    };
  }
};

export const useCheckout = (): StripeUseCheckoutResult => {
  const ctx = React.useContext(CheckoutContext);
  const {checkoutState} = validateCheckoutContext(ctx, 'calls useCheckout()');
  return mapStateToUseCheckoutResult(checkoutState);
};
