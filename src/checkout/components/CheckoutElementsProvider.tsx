import {FunctionComponent, PropsWithChildren, ReactNode} from 'react';
import * as stripeJs from '@stripe/stripe-js';

import React from 'react';
import PropTypes from 'prop-types';

import {parseStripeProp} from '../../utils/parseStripeProp';
import {usePrevious} from '../../utils/usePrevious';
import {isEqual} from '../../utils/isEqual';
import {registerWithStripeJs} from '../../utils/registerWithStripeJs';
import {CheckoutContext, CheckoutState} from './CheckoutContext';

interface CheckoutElementsProviderProps {
  /**
   * A [Stripe object](https://stripe.com/docs/js/initializing) or a `Promise` resolving to a `Stripe` object.
   * The easiest way to initialize a `Stripe` object is with the the [Stripe.js wrapper module](https://github.com/stripe/stripe-js/blob/master/README.md#readme).
   * Once this prop has been set, it can not be changed.
   *
   * You can also pass in `null` or a `Promise` resolving to `null` if you are performing an initial server-side render or when generating a static site.
   */
  stripe: PromiseLike<stripeJs.Stripe | null> | stripeJs.Stripe | null;
  options: stripeJs.StripeCheckoutElementsSdkOptions;
}

interface PrivateCheckoutElementsProviderProps {
  stripe: unknown;
  options: stripeJs.StripeCheckoutElementsSdkOptions;
  children?: ReactNode;
}
const INVALID_STRIPE_ERROR =
  'Invalid prop `stripe` supplied to `CheckoutElementsProvider`. We recommend using the `loadStripe` utility from `@stripe/stripe-js`. See https://stripe.com/docs/stripe-js/react#elements-props-stripe for details.';

const maybeSdk = (
  state: CheckoutState
): stripeJs.StripeCheckoutElementsSdk | null => {
  if (state.type === 'success' || state.type === 'loading') {
    return state.sdk as stripeJs.StripeCheckoutElementsSdk | null;
  } else {
    return null;
  }
};

export const CheckoutElementsProvider: FunctionComponent<PropsWithChildren<
  CheckoutElementsProviderProps
>> = (({
  stripe: rawStripeProp,
  options,
  children,
}: PrivateCheckoutElementsProviderProps) => {
  const parsed = React.useMemo(
    () => parseStripeProp(rawStripeProp, INVALID_STRIPE_ERROR),
    [rawStripeProp]
  );

  const [state, setState] = React.useState<CheckoutState>({
    type: 'loading',
    sdk: null,
  });
  const [stripe, setStripe] = React.useState<stripeJs.Stripe | null>(null);

  // Ref used to avoid calling initCheckoutElementsSdk multiple times when options changes
  const initCalledRef = React.useRef(false);

  React.useEffect(() => {
    let isMounted = true;

    const init = ({stripe}: {stripe: stripeJs.Stripe}) => {
      if (stripe && isMounted && !initCalledRef.current) {
        // Only update context if the component is still mounted
        // and stripe is not null. We allow stripe to be null to make
        // handling SSR easier.
        initCalledRef.current = true;
        const sdk = stripe.initCheckoutElementsSdk(options);
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

              sdk.on('change', (session: stripeJs.StripeCheckoutSession) => {
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
          .catch((error: any) => {
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
        'Unsupported prop change on CheckoutElementsProvider: You cannot change the `stripe` prop after setting it.'
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
}) as FunctionComponent<PropsWithChildren<CheckoutElementsProviderProps>>;

CheckoutElementsProvider.propTypes = {
  stripe: PropTypes.any,
  options: PropTypes.shape({
    clientSecret: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Promise),
    ]).isRequired,
    elementsOptions: PropTypes.object,
  }).isRequired,
} as PropTypes.ValidationMap<CheckoutElementsProviderProps>;
