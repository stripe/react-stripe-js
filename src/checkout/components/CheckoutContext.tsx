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

type ElementsLoadActionsSuccess = Extract<
  stripeJs.StripeCheckoutLoadActionsResult,
  {type: 'success'}
>['actions'];

type FormLoadActionsSuccess = Extract<
  stripeJs.StripeCheckoutFormLoadActionsResult,
  {type: 'success'}
>['actions'];

export type CheckoutState =
  | {
      type: 'loading';
      sdk: CheckoutSdk | null;
    }
  | {
      type: 'success';
      sdkKind: 'elements';
      sdk: stripeJs.StripeCheckoutElementsSdk;
      checkoutActions: ElementsLoadActionsSuccess;
      session: stripeJs.StripeCheckoutSession;
    }
  | {
      type: 'success';
      sdkKind: 'form';
      sdk: stripeJs.StripeCheckoutFormSdk;
      checkoutActions: FormLoadActionsSuccess;
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

type StripeCheckoutElementsActions = Omit<
  stripeJs.StripeCheckoutElementsSdk,
  'on' | 'loadActions'
> &
  Omit<ElementsLoadActionsSuccess, 'getSession'>;

type StripeCheckoutFormActions = Omit<
  stripeJs.StripeCheckoutFormSdk,
  'on' | 'loadActions'
> &
  Omit<FormLoadActionsSuccess, 'getSession'>;

export type StripeCheckoutElementsValue = StripeCheckoutElementsActions &
  stripeJs.StripeCheckoutSession;

export type StripeCheckoutFormValue = StripeCheckoutFormActions &
  stripeJs.StripeCheckoutSession;

// Back-compat alias: pre-existing consumers of StripeCheckoutValue see the
// Elements shape (unchanged behavior). Form consumers should prefer the
// narrower StripeCheckoutFormValue returned by useCheckoutForm().
export type StripeCheckoutValue = StripeCheckoutElementsValue;

export type StripeUseCheckoutElementsResult =
  | {type: 'loading'}
  | {
      type: 'success';
      checkout: StripeCheckoutElementsValue;
    }
  | {type: 'error'; error: {message: string}};

export type StripeUseCheckoutFormResult =
  | {type: 'loading'}
  | {
      type: 'success';
      checkout: StripeCheckoutFormValue;
    }
  | {type: 'error'; error: {message: string}};

// Back-compat alias: useCheckout() keeps returning the Elements-shaped result
// regardless of which provider wraps the tree. See useCheckout() JSDoc below.
export type StripeUseCheckoutResult = StripeUseCheckoutElementsResult;

// One runtime shape, two possible static types depending on the calling hook.
// The spread destructure runs uniformly against either SDK kind because both
// StripeCheckoutElementsSdk and StripeCheckoutFormSdk expose `on` and
// `loadActions`; the final cast selects the surface that the caller expects.
const mapStateToCheckoutResult = <
  T extends StripeCheckoutElementsValue | StripeCheckoutFormValue
>(
  checkoutState: CheckoutState
):
  | {type: 'loading'}
  | {type: 'success'; checkout: T}
  | {type: 'error'; error: {message: string}} => {
  if (checkoutState.type === 'success') {
    const {sdk, session, checkoutActions} = checkoutState;
    const {on: _on, loadActions: _loadActions, ...sdkMethods} = sdk;
    const {getSession: _getSession, ...otherCheckoutActions} = checkoutActions;
    return {
      type: 'success',
      checkout: ({
        ...session,
        ...sdkMethods,
        ...otherCheckoutActions,
      } as unknown) as T,
    };
  } else if (checkoutState.type === 'loading') {
    return {type: 'loading'};
  } else {
    return {type: 'error', error: checkoutState.error};
  }
};

/**
 * @deprecated Prefer the provider-specific hooks:
 * - Inside `<CheckoutElementsProvider>`, use `useCheckoutElements()`.
 * - Inside `<CheckoutFormProvider>`, use `useCheckoutForm()`.
 *
 * The provider-specific hooks return the exact action surface exposed by
 * their SDK.
 *
 * `useCheckout()` will keep working under both providers and returns the
 * Elements-shaped result for backward compatibility.
 */
export const useCheckout = (): StripeUseCheckoutResult => {
  const ctx = React.useContext(CheckoutContext);
  const {checkoutState} = validateCheckoutContext(ctx, 'calls useCheckout()');
  return mapStateToCheckoutResult<StripeCheckoutElementsValue>(checkoutState);
};

export const useCheckoutElements = (): StripeUseCheckoutElementsResult => {
  const ctx = React.useContext(CheckoutContext);
  const {checkoutState} = validateCheckoutContext(
    ctx,
    'calls useCheckoutElements()'
  );
  if (
    checkoutState.type === 'success' &&
    checkoutState.sdkKind !== 'elements'
  ) {
    throw new Error(
      'useCheckoutElements() must be used inside <CheckoutElementsProvider>. Inside <CheckoutFormProvider>, use useCheckoutForm() instead.'
    );
  }
  return mapStateToCheckoutResult<StripeCheckoutElementsValue>(checkoutState);
};

export const useCheckoutForm = (): StripeUseCheckoutFormResult => {
  const ctx = React.useContext(CheckoutContext);
  const {checkoutState} = validateCheckoutContext(
    ctx,
    'calls useCheckoutForm()'
  );
  if (checkoutState.type === 'success' && checkoutState.sdkKind !== 'form') {
    throw new Error(
      'useCheckoutForm() must be used inside <CheckoutFormProvider>. Inside <CheckoutElementsProvider>, use useCheckoutElements() instead.'
    );
  }
  return mapStateToCheckoutResult<StripeCheckoutFormValue>(checkoutState);
};
