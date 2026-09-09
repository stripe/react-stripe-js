import React from 'react';
import {LinkSignupElement, LinkSignupElementProps, useCheckout} from '../index';
import {
  StripeElements,
  StripeError,
  StripeLinkSignupElement,
} from '@stripe/stripe-js';

declare const elements: StripeElements;

const onReady = (element: StripeLinkSignupElement) => {
  element.focus();

  // @ts-expect-error Link Signup does not expose entered values.
  element.value;
};

const LinkSignupElementTypeTest = () => {
  const checkout = useCheckout();
  const checkoutElement: StripeLinkSignupElement | null = checkout.getLinkSignupElement();
  const regularElement: StripeLinkSignupElement | null = elements.getElement(
    LinkSignupElement
  );
  const props: LinkSignupElementProps = {
    id: 'link-signup',
    className: 'LinkSignupElement',
    options: {
      defaultValues: {
        email: 'jenny.rosen@example.com',
        name: 'Jenny Rosen',
        phone: '+15555555555',
      },
    },
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
