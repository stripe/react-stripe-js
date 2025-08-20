import {FunctionComponent} from 'react';
import * as stripeJs from '@stripe/stripe-js';
import {StripeError} from '@stripe/stripe-js';
import {ElementProps} from '../../types';

export interface CurrencySelectorElementProps extends ElementProps {
  /**
   * Triggered when the Element is fully rendered and can accept imperative `element.focus()` calls.
   * Called with a reference to the underlying [Element instance](https://stripe.com/docs/js/element).
   */
  onReady?: (element: stripeJs.StripeCurrencySelectorElement) => any;

  /**
   * Triggered when the escape key is pressed within the Element.
   */
  onEscape?: () => any;

  /**
   * Triggered when the Element fails to load.
   */
  onLoadError?: (event: {
    elementType: 'currencySelector';
    error: StripeError;
  }) => any;

  /**
   * Triggered when the [loader](https://stripe.com/docs/js/elements_object/create#stripe_elements-options-loader) UI is mounted to the DOM and ready to be displayed.
   */
  onLoaderStart?: (event: {elementType: 'currencySelector'}) => any;
}

export type CurrencySelectorElementComponent = FunctionComponent<
  CurrencySelectorElementProps
>;
