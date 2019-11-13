# @stripe/react-stripe

[![build status](https://img.shields.io/travis/stripe/react-stripe-elements/master.svg?style=flat-square)](https://travis-ci.org/stripe/react-stripe)
[![npm version](https://img.shields.io/npm/v/react-stripe-elements.svg?style=flat-square)](https://www.npmjs.com/package/@stripe/react-stripe)

> React components for Stripe.js and Stripe Elements

This project is a thin React wrapper around
[Stripe Elements](https://stripe.com/docs/elements). It allows you to add
Elements to any React app, and manages the state and lifecycle of Elements for
you.

The
[Stripe.js API reference](https://stripe.com/docs/stripe-js/reference#the-elements-object)
goes into more detail on the various customization options for Elements (e.g.
styles, fonts).

Elements can be used with the broader Stripe API for a number of different
payments applications. For more details, please refer to the
[Stripe Payments](https://stripe.com/docs/payments) documentation.

Looking for the legacy `react-stripe-elements` docs? You can find those
[here](https://github.com/stripe/react-stripe-elements/).

> TODO: Move all these docs to the offical Stripe docs, and just link there.

<!-- prettier-ignore-start -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of Contents

- [Quick Start](#quick-start)
  - [[Optional] Create A React App](#optional-create-a-react-app)
  - [Installation](#installation)
  - [Include Stripe.js in your application](#include-stripejs-in-your-application)
  - [Instantiate the Stripe object](#instantiate-the-stripe-object)
  - [Wrap your Checkout form in an Elements provider:](#wrap-your-checkout-form-in-an-elements-provider)
  - [Build your Checkout form using Elements:](#build-your-checkout-form-using-elements)
- [Adding Custom Styles](#adding-custom-styles)
  - [Passing custom styles to the Element](#passing-custom-styles-to-the-element)
  - [Styling the Elements container](#styling-the-elements-container)
  - [Adding custom fonts](#adding-custom-fonts)
- [Other Configuration Options](#other-configuration-options)
  - [Element specific options](#element-specific-options)
  - [Localization](#localization)
- [Advanced Integrations](#advanced-integrations)
  - [Loading Stripe.js asynchronously](#loading-stripejs-asynchronously)
  - [Server Side Rendering (SSR)](#server-side-rendering-ssr)
  - [Element specific options](#element-specific-options-1)
- [Reference](#reference)
  - [`<Elements>` Provider](#elements-provider)
    - [Props](#props)
  - [`<*Element>` Components](#element-components)
    - [Available Elements](#available-elements)
    - [Props](#props-1)
  - [`useElements` Hook](#useelements-hook)
  - [`injectElements` Higher Order Component](#injectelements-higher-order-component)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
<!-- prettier-ignore-end -->

## Quick Start

### [Optional] Create A React App

In order to get started with React Stripe, you’ll need a React app. If you need
to create one, we recommend [Create React App](https://create-react-app.dev/).

```sh
npx create-react-app my-stripe-app
cd my-stripe-app
```

### Installation

Use [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) or
[yarn](https://yarnpkg.com/lang/en/) to install React Stripe from the
[npm public registry](https://www.npmjs.com/package/@stripe/react-stripe).

```sh
npm install --save react-stripe-elements
```

OR use the UMD build (exports a global `ReactStripeElements` object);

```html
<script src="https://unpkg.com/react-stripe-elements@latest/dist/@stripe-react-stripe.min.js"></script>
```

### Include Stripe.js in your application

In addition to installing the React Stripe library, you will also need to
include this script on your pages—it should always be loaded directly from
**&#8203;https://js.stripe.com**:

```html
<script src="https://js.stripe.com/v3/"></script>
```

_If you are using Create React App, add the line above to the `<head>` of your
root HTML file (`public/index.html`)._

This script will make Stripe.js globally available as `window.Stripe`.

### Create the Stripe object

In order for your application to have access to
[the Stripe object](https://stripe.com/docs/elements/reference#the-stripe-object),
let's instantiate Stripe, and export it as a global. To do this, you will need
to call `window.Stripe` with your
[publishable key](https://stripe.com/docs/keys):

```jsx
// src/globals.js

export const stripe = window.Stripe('{{PUBLISHABLE_KEY}}');
```

_Note: If you are using server side rendering (SSR), this approach needs to be
modified, we have a section on SSR and asynchronously loading Stripe below._

### Wrap your Checkout form in an Elements provider:

Wrap whichever parts of your App need to be able to render and access Elements
in the `<Elements>` Provider:

```jsx
// src/App.js

import React from 'react';
import {Elements} from '@stripe/react-stripe';

import {stripe} from './globals';

const App = () => {
  return (
    <Elements stripe={stripe}>
      <MyCheckoutForm />
    </Elements>
  );
};

export default App;
```

### Build your Checkout form using Elements:

Lets start with collecting card payments by using the `CardElement`:

```jsx
// src/Checkout.js
import React from 'react';
import {CardElement, useElements} from '@stripe/react-stripe';

import {stripe} from './globals';

const Checkout = () => {
  // Inject a reference to elements with the useElements hook.
  const element = useElements();
  // If you are not using hooks, we also provide a higher order component,
  // `injectElements`, that will inject `elements` as a prop.

  const handleSubmit = (e) => {
    // call e.preventDefault to prevent the default form submission
    // behavior from reloading the page.
    e.preventDefault();

    // Use Elements to lookup the underlying `card` Element created
    // by the CardElement component.
    const cardElement = elements.getElement('card');

    // Use the card Element with other Stripe.js APIs (e.g. createToken):
    const response = await stripe.createToken(cardElement);

    console.log('[Token Response]', response)

    // For more examples of how to use Elements to securely pass
    // payment data to the Stripe API, please refer to the
    // Stripe.js reference:
    // https://stripe.com/docs/stripe-js/reference
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit">Pay</button>
    </form>
  );
};

export default Checkout;
```

At this point, you should have a functioning form which allows you to collect
and tokenize payment card data. Additional options, events, and advanced
integrations are covered below.

## Adding Custom Styles

### Passing custom styles to the Element

TODO

### Styling the Elements container

TODO

### Adding custom fonts

TODO

## Other Configuration Options

### Element specific options

TODO

### Localization

TODO

## Advanced Integrations

TODO

### Loading Stripe.js asynchronously

TODO

### Server Side Rendering (SSR)

TODO

### Element specific options

TODO

## Reference

TODO

### `<Elements>` Provider

TODO

#### Props

TODO

### `<*Element>` Components

TODO

#### Available Elements

TODO

#### Props

TODO

### `useElements` Hook

TODO

### `injectElements` Higher Order Component

TODO

## Troubleshooting

TODO

## Development

Install dependencies:

    yarn install

Run the demo:

    yarn run demo

Run the tests:

    yarn run test

Build:

    yarn run build

We use [prettier](https://github.com/prettier/prettier) for code formatting:

    yarn run prettier

To update the ToC in the README if any of the headers changed:

    yarn run doctoc

Checks:

    yarn test
    yarn run lint
    yarn run flow
