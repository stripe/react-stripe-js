import React from 'react';
import type {StripeElements, StripeLinkSignupElement} from '@stripe/stripe-js';
import {LinkSignupElement} from '../index';
import {LinkSignupElement as CheckoutLinkSignupElement} from '../checkout';

const assertLinkSignupElementTypes = (elements: StripeElements) => {
  const options = {
    defaultValues: {
      email: 'jenny.rosen@example.com',
      name: 'Jenny Rosen',
      phone: '+15555555555',
    },
  };

  <LinkSignupElement
    options={options}
    onReady={(element) => {
      element.focus();
      // @ts-expect-error Link Signup does not expose entered values.
      element.value;
    }}
    onFocus={(event) => event.elementType}
    onBlur={(event) => event.elementType}
    onEscape={() => undefined}
    onLoaderStart={(event) => event.elementType}
    onLoadError={(event) => event.error}
  />;

  <CheckoutLinkSignupElement
    options={options}
    onReady={(element) => {
      element.focus();
      // @ts-expect-error Checkout Link Signup does not expose entered values.
      element.value;
    }}
    onFocus={(event) => event.elementType}
    onBlur={(event) => event.elementType}
    onEscape={() => undefined}
    onLoaderStart={(event) => event.elementType}
    onLoadError={(event) => event.error}
  />;

  const element: StripeLinkSignupElement | null =
    elements.getElement(LinkSignupElement);

  // @ts-expect-error Link Signup does not expose change events.
  <LinkSignupElement onChange={() => undefined} />;
  // @ts-expect-error Checkout Link Signup does not expose change events.
  <CheckoutLinkSignupElement onChange={() => undefined} />;

  element?.focus();
};

test('Link Signup Element type assertions compile', () => {
  expect(assertLinkSignupElementTypes).toBeDefined();
});
