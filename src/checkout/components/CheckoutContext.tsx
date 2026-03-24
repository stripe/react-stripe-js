import * as stripeJs from '@stripe/stripe-js';

import React from 'react';

import {
  ElementsContext,
  ElementsContextValue,
  parseElementsContext,
} from '../../components/Elements';

type CheckoutSdk =
  | stripeJs.StripeCheckoutElementsSdk
  | stripeJs.StripeCheckoutFormSdk;

type LoadActionsSuccess = Extract<
  stripeJs.StripeCheckoutLoadActionsResult,
  {type: 'success'}
>['actions'];

export type CheckoutState =
  | {
      type: 'loading';
      sdk: CheckoutSdk | null;
    }
  | {
      type: 'success';
      sdk: CheckoutSdk;
      checkoutActions: LoadActionsSuccess;
      session: stripeJs.StripeCheckoutSession;
    }
  | {type: 'error'; error: {message: string}};

export type CheckoutContextValue = {
  stripe: stripeJs.Stripe | null;
  checkoutState: CheckoutState;
};

export const CheckoutContext = React.createContext<CheckoutContextValue | null>(
  null
);
CheckoutContext.displayName = 'CheckoutContext';

export const validateCheckoutContext = (
  ctx: CheckoutContextValue | null,
  useCase: string
): CheckoutContextValue => {
  if (!ctx) {
    throw new Error(
      `Could not find checkout context; You need to wrap the part of your app that ${useCase} in a <CheckoutElementsProvider> or <CheckoutFormProvider> provider.`
    );
  }
  return ctx;
};

export const useElementsOrCheckoutContextWithUseCase = (
  useCaseString: string
): CheckoutContextValue | ElementsContextValue => {
  const checkout = React.useContext(CheckoutContext);
  const elements = React.useContext(ElementsContext);

  if (checkout) {
    if (elements) {
      throw new Error(
        `You cannot wrap the part of your app that ${useCaseString} in both a checkout provider and <Elements> provider.`
      );
    } else {
      return checkout;
    }
  } else {
    return parseElementsContext(elements, useCaseString);
  }
};

type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;

type StripeCheckoutActions = DistributiveOmit<
  CheckoutSdk,
  'on' | 'loadActions'
> &
  Omit<LoadActionsSuccess, 'getSession'>;

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
  checkoutState: CheckoutState
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
