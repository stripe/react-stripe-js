import * as stripeJs from '@stripe/stripe-js';
import React, {FunctionComponent} from 'react';
import {parseStripeProp} from '../utils/parseStripeProp';
import {registerWithStripeJs} from '../utils/registerWithStripeJs';
import {StripeError} from '@stripe/stripe-js';
import {usePrevious} from '../utils/usePrevious';

interface IssuingDisclosureProps {
  /**
   * A [Stripe object](https://stripe.com/docs/js/initializing) or a `Promise` resolving to a `Stripe` object.
   * The easiest way to initialize a `Stripe` object is with the the [Stripe.js wrapper module](https://github.com/stripe/stripe-js/blob/master/README.md#readme).
   * Once this prop has been set, it can not be changed.
   *
   * You can also pass in `null` or a `Promise` resolving to `null` if you are performing an initial server-side render or when generating a static site.
   */
  stripe: PromiseLike<stripeJs.Stripe | null> | stripeJs.Stripe | null;

  /**
   * Callback function called after the disclosure content loads.
   */
  onLoad?: () => void;

  /**
   * Callback function called when an error occurs during disclosure creation.
   */
  onError?: (error: StripeError) => void;

  /**
   * Optional Issuing Disclosure configuration options.
   *
   * issuingProgramID: The ID of the issuing program you want to display the disclosure for.
   * publicCardProgramName: The public name of the Issuing card program you want to display the disclosure for.
   * learnMoreLink: A supplemental link to for your users to learn more about Issuing or any other relevant information included in the disclosure.
   */
  options?: {
    issuingProgramID?: string;
    publicCardProgramName?: string;
    learnMoreLink?: string;
  };
}

export const IssuingDisclosure: FunctionComponent<IssuingDisclosureProps> = ({
  stripe: rawStripeProp,
  onLoad,
  onError,
  options,
}) => {
  const issuingProgramID = options?.issuingProgramID;
  const publicCardProgramName = options?.publicCardProgramName;
  const learnMoreLink = options?.learnMoreLink;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const parsed = React.useMemo(() => parseStripeProp(rawStripeProp), [
    rawStripeProp,
  ]);
  const [stripeState, setStripeState] = React.useState<stripeJs.Stripe | null>(
    parsed.tag === 'sync' ? parsed.stripe : null
  );

  React.useEffect(() => {
    let isMounted = true;

    if (parsed.tag === 'async') {
      parsed.stripePromise.then((stripePromise: stripeJs.Stripe | null) => {
        if (stripePromise && isMounted) {
          setStripeState(stripePromise);
        }
      });
    } else if (parsed.tag === 'sync') {
      setStripeState(parsed.stripe);
    }

    return () => {
      isMounted = false;
    };
  }, [parsed]);

  // Warn on changes to stripe prop
  const prevStripe = usePrevious(rawStripeProp);
  React.useEffect(() => {
    if (prevStripe !== null && prevStripe !== rawStripeProp) {
      console.warn(
        'Unsupported prop change on IssuingDisclosure: You cannot change the `stripe` prop after setting it.'
      );
    }
  }, [prevStripe, rawStripeProp]);

  // Attach react-stripe-js version to stripe.js instance
  React.useEffect(() => {
    registerWithStripeJs(stripeState);
  }, [stripeState]);

  React.useEffect(() => {
    const createDisclosure = async () => {
      if (!stripeState || !containerRef.current) {
        return;
      }

      const {
        htmlElement: disclosureContent,
        error,
      } = await (stripeState as any).createIssuingDisclosure({
        issuingProgramID,
        publicCardProgramName,
        learnMoreLink,
      });

      if (error && onError) {
        onError(error);
      } else if (disclosureContent) {
        const container = containerRef.current;
        container.innerHTML = '';
        container.appendChild(disclosureContent);
        if (onLoad) {
          onLoad();
        }
      }
    };

    createDisclosure();
  }, [
    stripeState,
    issuingProgramID,
    publicCardProgramName,
    learnMoreLink,
    onLoad,
    onError,
  ]);

  return React.createElement('div', {ref: containerRef});
};
