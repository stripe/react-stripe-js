# React Stripe.js

React components for
[Stripe.js and Elements](https://stripe.com/docs/stripe-js).

[![npm version](https://img.shields.io/npm/v/@stripe/react-stripe-js.svg?style=flat-square)](https://www.npmjs.com/package/@stripe/react-stripe-js)

## Requirements

The minimum supported version of React is v16.8. If you use an older version,
upgrade React to use this library. If you prefer not to upgrade your React
version, we recommend using legacy
[`react-stripe-elements`](https://github.com/stripe/react-stripe-elements).

## Getting started

- [Build a custom checkout page using the Checkout Sessions API](https://docs.stripe.com/payments/accept-a-payment?payment-ui=elements&api-integration=checkout)
- [Add React Stripe.js to your React app](https://stripe.com/docs/stripe-js/react#setup)
- [Try it out using CodeSandbox](https://codesandbox.io/s/react-stripe-official-q1loc?fontsize=14&hidenavigation=1&theme=dark)

## Documentation

- [React Stripe.js reference](https://stripe.com/docs/stripe-js/react)
- [Migrate from `react-stripe-elements`](docs/migrating.md)
- [Legacy `react-stripe-elements` docs](https://github.com/stripe/react-stripe-elements/#react-stripe-elements)
- [Examples](examples)

## Build a custom checkout page

For a new custom checkout page, we recommend the
[Checkout Sessions API](https://docs.stripe.com/payments/accept-a-payment?payment-ui=elements&api-integration=checkout)
with `ui_mode: 'elements'`. This lets you combine Stripe Elements with your own
React layout while Checkout Sessions manages the checkout state. If you want to
own every part of your checkout, the lower-level
[Payment Intents API](https://docs.stripe.com/payments/accept-a-payment?payment-ui=elements&api-integration=payment-intents)
provides more fine-grained control, but requires significantly more code and
ongoing maintenance.

First, install React Stripe.js and
[Stripe.js](https://github.com/stripe/stripe-js).

```sh
npm install @stripe/react-stripe-js @stripe/stripe-js
```

Create a Checkout Session on your server using trusted product and pricing data,
then return its client secret:

```js
// POST /create-checkout-session
const session = await stripe.checkout.sessions.create({
  ui_mode: 'elements',
  mode: 'payment',
  return_url: 'https://example.com/order/123/complete',
  line_items: [
    {
      price_data: {
        currency: 'usd',
        product_data: {name: 'T-shirt'},
        unit_amount: 1099,
      },
      quantity: 1,
    },
  ],
});

if (!session.client_secret) {
  throw new Error('Checkout Session is missing a client secret.');
}

res.json({clientSecret: session.client_secret});
```

Client:

```jsx
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {loadStripe} from '@stripe/stripe-js';
import {
  PaymentElement,
  CheckoutElementsProvider,
  useCheckoutElements,
} from '@stripe/react-stripe-js/checkout';

const CheckoutForm = () => {
  const result = useCheckoutElements();
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (result.type !== 'success' || !result.checkout.canConfirm) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const confirmResult = await result.checkout.confirm({
        returnUrl: 'https://example.com/order/123/complete',
      });

      if (confirmResult.type === 'error') {
        setErrorMessage(confirmResult.error.message);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'An unexpected error occurred.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result.type === 'loading') {
    return <div>Loading checkout...</div>;
  }

  if (result.type === 'error') {
    return <div>{result.error.message}</div>;
  }

  const {checkout} = result;

  return (
    <>
      <ul>
        {checkout.lineItems.map((lineItem) => (
          <li key={lineItem.id}>
            {lineItem.name}: {lineItem.total.amount}
          </li>
        ))}
      </ul>
      <p>Total: {checkout.total.total.amount}</p>
      <form onSubmit={handleSubmit}>
        <PaymentElement />
        <button type="submit" disabled={!checkout.canConfirm || isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Pay'}
        </button>
        {errorMessage && <div>{errorMessage}</div>}
      </form>
    </>
  );
};

// Use the publishable key for the same account that created the Checkout Session.
const stripePromise = loadStripe('pk_test_...');

const clientSecretPromise = fetch('/create-checkout-session', {
  method: 'POST',
}).then(async (response) => {
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? 'Unable to create a Checkout Session.');
  }

  return body.clientSecret;
});

const options = {
  clientSecret: clientSecretPromise,
  elementsOptions: {
    appearance: {
      theme: 'stripe',
    },
  },
};

const App = () => (
  <CheckoutElementsProvider stripe={stripePromise} options={options}>
    <CheckoutForm />
  </CheckoutElementsProvider>
);

createRoot(document.getElementById('root')).render(<App />);
```

### TypeScript support

React Stripe.js is packaged with TypeScript declarations. Some types are pulled
from [`@stripe/stripe-js`](https://github.com/stripe/stripe-js)—be sure to add
`@stripe/stripe-js` as a dependency to your project for full TypeScript support.

Typings in React Stripe.js follow the same
[versioning policy](https://github.com/stripe/stripe-js#typescript-support) as
`@stripe/stripe-js`.

### Contributing

This project is maintained by Stripe and does not accept external pull requests.
If you have feedback or ideas, please
[open an issue](https://github.com/stripe/react-stripe-js/issues/new).
