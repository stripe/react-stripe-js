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

- [Build a custom payment form using the Checkout Sessions API](https://docs.stripe.com/payments/accept-a-payment?payment-ui=elements&api-integration=checkout)
- [Add React Stripe.js to your React app](https://stripe.com/docs/stripe-js/react#setup)
- [Try it out using CodeSandbox](https://codesandbox.io/s/react-stripe-official-q1loc?fontsize=14&hidenavigation=1&theme=dark)

## Documentation

- [React Stripe.js reference](https://stripe.com/docs/stripe-js/react)
- [Migrate from `react-stripe-elements`](docs/migrating.md)
- [Legacy `react-stripe-elements` docs](https://github.com/stripe/react-stripe-elements/#react-stripe-elements)
- [Examples](examples)

### Minimal example

First, install React Stripe.js and
[Stripe.js](https://github.com/stripe/stripe-js).

```sh
npm install @stripe/react-stripe-js @stripe/stripe-js
```

#### Using hooks

> **Building a custom payment form?** Use the
> [Checkout Sessions API](https://docs.stripe.com/payments/accept-a-payment?payment-ui=elements&api-integration=checkout)
> integration shown below — the recommended approach for most integrations.
> Create a Checkout Session on your server with `ui_mode: 'elements'` and pass
> its `clientSecret` to `CheckoutElementsProvider`.

Your server endpoint should create a Checkout Session and return its client
secret:

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (result.type !== 'success') {
      return;
    }

    try {
      await result.checkout.confirm({
        returnUrl: 'https://example.com/order/123/complete',
      });
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  if (result.type === 'error') {
    return <div>{result.error.message}</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={result.type !== 'success'}>
        Pay
      </button>
      {errorMessage && <div>{errorMessage}</div>}
    </form>
  );
};

// Use the publishable key for the same account that created the Checkout Session.
const stripePromise = loadStripe('pk_test_...');

const App = () => {
  // Fetch clientSecret from your server when the page loads.
  // e.g. POST /create-checkout-session → { clientSecret }
  const clientSecret = '...';

  return (
    <CheckoutElementsProvider stripe={stripePromise} options={{clientSecret}}>
      <CheckoutForm />
    </CheckoutElementsProvider>
  );
};

createRoot(document.getElementById('root')).render(<App />);
```

#### Using PaymentElement directly

For existing integrations or when you need fine-grained control over the
PaymentIntents flow, use `Elements` with `PaymentElement`:

```jsx
import React from 'react';
import {createRoot} from 'react-dom/client';
import {loadStripe} from '@stripe/stripe-js';
import {
  PaymentElement,
  Elements,
  ElementsConsumer,
} from '@stripe/react-stripe-js';

class CheckoutForm extends React.Component {
  handleSubmit = async (event) => {
    event.preventDefault();
    const {stripe, elements} = this.props;

    if (elements == null) {
      return;
    }

    // Trigger form validation and wallet collection
    const {error: submitError} = await elements.submit();
    if (submitError) {
      // Show error to your customer
      return;
    }

    // Create the PaymentIntent and obtain clientSecret
    const res = await fetch('/create-intent', {
      method: 'POST',
    });

    const {client_secret: clientSecret} = await res.json();

    const {error} = await stripe.confirmPayment({
      //`Elements` instance that was used to create the Payment Element
      elements,
      clientSecret,
      confirmParams: {
        return_url: 'https://example.com/order/123/complete',
      },
    });

    if (error) {
      // This point will only be reached if there is an immediate error when
      // confirming the payment. Show error to your customer (for example, payment
      // details incomplete)
    } else {
      // Your customer will be redirected to your `return_url`. For some payment
      // methods like iDEAL, your customer will be redirected to an intermediate
      // site first to authorize the payment, then redirected to the `return_url`.
    }
  };

  render() {
    const {stripe} = this.props;
    return (
      <form onSubmit={this.handleSubmit}>
        <PaymentElement />
        <button type="submit" disabled={!stripe}>
          Pay
        </button>
      </form>
    );
  }
}

const InjectedCheckoutForm = () => (
  <ElementsConsumer>
    {({stripe, elements}) => (
      <CheckoutForm stripe={stripe} elements={elements} />
    )}
  </ElementsConsumer>
);

const stripePromise = loadStripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');

const options = {
  mode: 'payment',
  amount: 1099,
  currency: 'usd',
  // Fully customizable with appearance API.
  appearance: {
    /*...*/
  },
};

const App = () => (
  <Elements stripe={stripePromise} options={options}>
    <InjectedCheckoutForm />
  </Elements>
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
