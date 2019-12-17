# Migrating from `react-stripe-elements`

This guide includes of step by step instructions for migrating your Stripe
integration from
[`react-stripe-elements`](https://github.com/stripe/react-stripe-elements) to
`@stripe/react-stripe`.

- Prefer something a little more comprehensive? Check out the official
  [React Stripe docs](https://stripe.com/docs/stripe-js/react-stripe).
- Prefer something a little more light weight? Check out our
  [existing examples](https://github.com/stripe/react-stripe/tree/master/examples).

---

## Prerequisites

`@stripe/react-stripe` depends on the React Hooks API. The minimum supported
version of React is v16.8. If you are using hooks currently, then you should be
fine. If you are on an older version of React, you will need to upgrade to use
this library. If you do not wish to upgrade your React version, then feel free
to continue using legacy
[`react-stripe-elements`](https://github.com/stripe/react-stripe-elements).

## 1. Install and fix imports

First, use `npm` or `yarn` to remove `react-stripe-elements` and install
`@stripe/react-stripe`.

```sh
npm uninstall react-stripe-elements
npm install @stripe/react-stripe
```

Once you have installed, you need to update your import statements. Anywhere you
used to import from `react-stripe-elements` you will now want to import from
`@stripe/react-stripe`.

#### Before

```js
import {CardElement} from 'react-stripe-elements';
```

#### After

```js
import {CardElement} from '@stripe/react-stripe';
```

## 2. Remove `<StripeProvider>`

`@stripe/react-stripe` no longer has a `<StripeProvider>` component. Instead you
will instantiate the [Stripe object](https://stripe.com/docs/js/initializing)
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
import {Elements} from 'react-stripe-elements';

// Create the Stripe object yourself...
const stripe = window.Stripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

const App = () => (
  // ...and pass it directly to <Elements>.
  <Elements stripe={stripe}>{/* Your checkout form */}</Elements>
);
```

## 3. Update Element component options

The way you pass in
[Element options](https://stripe.com/docs/js/elements_object/create_element?type=card#elements_create-options)
is different in `@stripe/react-stripe`.

#### Before

```jsx
import {CardElement} from 'react-stripe-elements';

<CardElement
  id="my-card"
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
import {CardElement} from '@stripe/react-stripe';


<CardElement
  id="my-card"
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

## 3. `useStripe` and `useElements` instead of `injectStripe`.

`@stripe/react-stripe` uses hooks and consumers rather than higher order
components.

#### Before

```jsx
import {injectStripe} from 'react-stripe-elements';

const CheckoutForm = (props) => {
  const {stripe, elements} = props;

  // the rest of CheckoutForm...
};

// Inject stripe and elements with `injectStripe`.
const InjectedCheckoutForm = injectStripe(CheckoutForm);
```

#### After

```jsx
import {useStripe, useElements} from '@stripe/react-stripe';

const CheckoutForm = (props) => {
  // Get a reference to stripe or elements using hooks.
  const stripe = useStripe();
  const elements = useElements();

  // the rest of CheckoutForm...
};

// Or use `<ElementsConsumer>` if you do not want to use hooks.

import {ElementsConsumer} from '@stripe/react-stripe';

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

## 4. Pass in the Element instance to other Stripe.js methods.

`@stripe/react-stripe` does not have the automatic Element detection.

#### Before

```jsx
import {injectStripe, CardElement} from 'react-stripe-elements';

const CheckoutForm = (props) => {
  const {stripe, elements} = props;

  const handleSubmit = (event) => {
    event.preventDefault();

    // Element will be inferred and is not passed to
    // createToken or other Stripe.js methods.
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
import {useStripe, useElements, CardElement} from 'react-stripe-elements';

const CheckoutForm = (props) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = (event) => {
    event.preventDefault();

    // Use elements.getElement to get a reference to the mounted
    // Element and pass it to createToken or other Stripe.js
    // methods directly.
    const card = elements.getElement(CardElement);
    stripe.createToken(card);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button>Pay</button>
    </form>
  );
};
```

---

### More Information

- [React Stripe Docs](https://stripe.com/docs/stripe-js/react-stripe)
- [Examples](https://github.com/stripe/react-stripe/tree/master/examples)
