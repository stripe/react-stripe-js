# React Stripe.js

React components for [Stripe.js](https://stripe.com/docs/stripe-js) and
[Stripe Elements](https://stripe.com/docs/elements).

[![build status](https://img.shields.io/travis/stripe/react-stripe/master.svg?style=flat-square)](https://travis-ci.org/stripe/react-stripe)
[![npm version](https://img.shields.io/npm/v/@stripe/react-stripe-js.svg?style=flat-square)](https://www.npmjs.com/package/@stripe/react-stripe-js)

## Getting Started

- [Add React Stripe.js to your React app](https://stripe.com/docs/stripe-js/react#setup)
- [Try it out using CodeSandbox](https://codesandbox.io/s/react-stripe-official-q1loc?fontsize=14&hidenavigation=1&theme=dark)

## Documentation

- [React Stripe.js Docs](https://stripe.com/docs/stripe-js/react)
- [Migrate from `react-stripe-elements`](docs/migrating.md)
- [Legacy `react-stripe-elements` docs](https://github.com/stripe/react-stripe-elements/#react-stripe-elements)
- [Examples](examples)

## Minimal Example

```jsx
import React from "react";
import ReactDOM from "react-dom";

import {CardElement, Elements, useStripe, useElements} from "@stripe/react-stripe-js";

const stripe = window.Stripe("pk_test_6pRNASCoBOKtIshFeQd4XMUh");

const MyCheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async ev => {
    ev.preventDefault();
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardElement)
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button>Pay</button>
    </form>
  );
};

const App = () => {
  return (
    <Elements stripe={stripe}>
      <MyCheckoutForm />
    </Elements>
  );
};

ReactDOM.render(<App />, document.body);
```

### Minimum Requirements

React Stripe.js depends on the
[React Hooks API](https://reactjs.org/docs/hooks-intro.html). The minimum
supported version of React is v16.8. If you use an older version, upgrade React
to use this library. If you prefer not to upgrade your React version, we
recommend using legacy
[`react-stripe-elements`](https://github.com/stripe/react-stripe-elements).

### Contributing

If you would like to contribute to React Stripe.js, please make sure to read our
[contributor guidelines](CONTRIBUTING.md).
