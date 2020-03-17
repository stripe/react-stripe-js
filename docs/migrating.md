# Migrating from `react-stripe-elements`

This guide will walk you through migrating your Stripe integration from
[`react-stripe-elements`](https://github.com/stripe/react-stripe-elements) to
React Stripe.js.

- Prefer something a little more comprehensive? Check out the official
  [React Stripe.js docs](https://stripe.com/docs/stripe-js/react).
- Or take a look at some
  [example integrations](https://github.com/stripe/react-stripe-js/tree/master/examples).

### Prerequisites

React Stripe.js depends on the
[React Hooks API](https://reactjs.org/docs/hooks-intro.html). The minimum
supported version of React is v16.8. If you use an older version, upgrade React
to use this library. If you prefer not to upgrade your React version, feel free
to continue using legacy
[`react-stripe-elements`](https://github.com/stripe/react-stripe-elements).

<br />

## 1. Install and fix imports

First, use `npm` or `yarn` to remove `react-stripe-elements` and install
`@stripe/react-stripe-js` and `@stripe/stripe-js`.

```sh
npm uninstall react-stripe-elements
npm install @stripe/react-stripe-js @stripe/stripe-js
```

After installing React Stripe.js, update your import statements. In places where
you used to import from `react-stripe-elements`, adjust your code to import from
`@stripe/react-stripe-js`.

#### Before

```js
import {CardElement} from 'react-stripe-elements';
```

#### After

```js
import {CardElement} from '@stripe/react-stripe-js';
```

<br />

## 2. Remove `<StripeProvider>`

React Stripe.js no longer has a `<StripeProvider>` component. Instead you will
instantiate the [Stripe object](https://stripe.com/docs/js/initializing)
yourself and pass it directly to `<Elements>`. We've prefilled the examples
below with a sample test [API key](https://stripe.com/docs/keys). Replace it
with your own publishable key.

#### Before

```jsx
import {StripeProvider, Elements} from 'react-stripe-elements';

// Pass your API key to <StripeProvider> which creates and
// provides the Stripe object to <Elements>.
const App = () => (
  <StripeProvider apiKey="pk_test_TYooMQauvdEDq54NiTphI7jx">
    {/* Somewhere in the StripeProvider component tree... */}
    <Elements>{/* Your checkout form */}</Elements>
  </StripeProvider>
);
```

#### After

```jsx
import {loadStripe} from '@stripe/stripe-js';
import {Elements} from '@stripe/react-stripe-js';

// Create the Stripe object yourself...
const stripePromise = loadStripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');

const App = () => (
  // ...and pass it directly to <Elements>.
  <Elements stripe={stripePromise}>{/* Your checkout form */}</Elements>
);
```

<br />

## 3. Update Element component options

The way you pass in
[Element options](https://stripe.com/docs/js/elements_object/create_element?type=card#elements_create-options)
is different in React Stripe.js.

#### Before

```jsx
import {CardElement} from 'react-stripe-elements';

<CardElement
  id="my-card"
  onChange={handleChange}
  {/* Options are spread onto the component as props. */}
  iconStyle="solid"
  style={{
    base: {
      iconColor: '#c4f0ff',
      color: '#fff',
      fontSize: '16px',
    },
    invalid: {
      iconColor: '#FFC7EE',
      color: '#FFC7EE',
    },
  }}
/>;
```

#### After

```jsx
import {CardElement} from '@stripe/react-stripe-js';


<CardElement
  id="my-card"
  onChange={handleChange}
  {/* Options are passed in on their own prop. */}
  options={{
    iconStyle: 'solid',
    style: {
      base: {
        iconColor: '#c4f0ff',
        color: '#fff',
        fontSize: '16px',
      },
      invalid: {
        iconColor: '#FFC7EE',
        color: '#FFC7EE',
      },
    },
  }}
/>;
```

<br />

## 4. `useStripe` and `useElements` instead of `injectStripe`.

React Stripe.js uses hooks and consumers rather than higher order components.

#### Before

```jsx
import {injectStripe} from 'react-stripe-elements';

const CheckoutForm = (props) => {
  const {stripe, elements} = props;

  // the rest of CheckoutForm...
};

// Inject Stripe and Elements with `injectStripe`.
const InjectedCheckoutForm = injectStripe(CheckoutForm);
```

#### After

```jsx
import {useStripe, useElements} from '@stripe/react-stripe-js';

const CheckoutForm = (props) => {
  // Get a reference to Stripe or Elements using hooks.
  const stripe = useStripe();
  const elements = useElements();

  // the rest of CheckoutForm...
};

// Or use `<ElementsConsumer>` if you do not want to use hooks.

import {ElementsConsumer} from '@stripe/react-stripe-js';

const CheckoutForm = (props) => {
  const {stripe, elements} = props;

  // the rest of CheckoutForm...
};

const InjectedCheckoutForm = () => (
  <ElementsConsumer>
    {({stripe, elements}) => (
      <CheckoutForm stripe={stripe} elements={elements} />
    )}
  </ElementsConsumer>
);
```

<br />

## 5. Pass in the Element instance to other Stripe.js methods.

React Stripe.js does not have the automatic Element detection.

#### Before

```jsx
import {injectStripe, CardElement} from 'react-stripe-elements';

const CheckoutForm = (props) => {
  const {stripe, elements} = props;

  const handleSubmit = (event) => {
    event.preventDefault();

    // Element will be inferred and is not passed to Stripe.js methods.
    // e.g. stripe.createToken
    stripe.createToken();
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button>Pay</button>
    </form>
  );
};

const InjectedCheckoutForm = injectStripe(CheckoutForm);
```

#### After

```jsx
import {useStripe, useElements, CardElement} from '@stripe/react-stripe-js';

const CheckoutForm = (props) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = (event) => {
    event.preventDefault();

    // Use elements.getElement to get a reference to the mounted Element.
    const cardElement = elements.getElement(CardElement);

    // Pass the Element directly to other Stripe.js methods:
    // e.g. createToken - https://stripe.com/docs/js/tokens_sources/create_token?type=cardElement
    stripe.createToken(cardElement);

    // or createPaymentMethod - https://stripe.com/docs/js/payment_intents/create_payment_method
    stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    // or confirmCardPayment - https://stripe.com/docs/js/payment_intents/confirm_card_payment
    stripe.confirmCardPayment({
      payment_method: {
        card: cardElement,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button>Pay</button>
    </form>
  );
};
```

<br />

---

### More Information

- [React Stripe.js Docs](https://stripe.com/docs/stripe-js/react)
- [Examples](https://github.com/stripe/react-stripe-js/tree/master/examples)
