import React from 'react';
import {
  LinkSignupElement,
  LinkSignupElementInstance,
  LinkSignupElementOptions,
  LinkSignupElementProps,
  useCheckout,
} from '../index';
import {StripeElements, StripeError} from '@stripe/stripe-js';

declare const elements: StripeElements;

const onReady = (element: LinkSignupElementInstance) => {
  element.focus();

  // @ts-expect-error Link Signup does not expose entered values.
  element.value;
};

const LinkSignupElementTypeTest = () => {
  const checkout = useCheckout();
  const checkoutElement: LinkSignupElementInstance | null = checkout.getLinkSignupElement();
  const regularElement: LinkSignupElementInstance | null = elements.getElement(
    LinkSignupElement
  );
  const options: LinkSignupElementOptions = {
    defaultValues: {
      email: 'jenny.rosen@example.com',
      name: 'Jenny Rosen',
      phone: '+15555555555',
    },
  };
  const props: LinkSignupElementProps = {
    id: 'link-signup',
    className: 'LinkSignupElement',
    options,
    onReady,
    onFocus: (event) => event.elementType,
    onBlur: (event) => event.elementType,
    onEscape: (event) => event.elementType,
    onLoaderStart: (event) => event.elementType,
    onLoadError: (event) => {
      const error: StripeError = event.error;
      return error;
    },
  };

  checkoutElement?.focus();
  regularElement?.focus();

  return (
    <>
      <LinkSignupElement />
      <LinkSignupElement {...props} />
      {/* @ts-expect-error Link Signup does not expose change events. */}
      <LinkSignupElement onChange={() => {}} />
    </>
  );
};

test('Link Signup Element type assertions compile', () => {
  expect(LinkSignupElementTypeTest).toBeDefined();
});
