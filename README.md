## React Stripe

React Stripe is a thin React wrapper around
[Stripe Elements](https://stripe.com/docs/elements). It allows you to add
Elements to any React app.

[![build status](https://img.shields.io/travis/stripe/react-stripe/master.svg?style=flat-square)](https://travis-ci.org/stripe/react-stripe)
[![npm version](https://img.shields.io/npm/v/@stripe/react-stripe.svg?style=flat-square)](https://www.npmjs.com/package/@stripe/react-stripe)

# Docs

### [React Stripe Docs](https://stripe.com/docs/stripe-js/react-stripe) | [Stripe.js Reference](https://stripe.com/docs/js)

- Migrating from `react-stripe-elements`? Check out our
  [migration guide](docs/migrating.md).
- Looking for something a little more lightweight? Check out our
  [examples](examples).
- Looking for the legacy `react-stripe-elements` docs? You can find those
  [here](https://github.com/stripe/react-stripe-elements/).

# Development

Install dependencies:

    yarn install

Run the examples using [Storybook](https://storybook.js.org/):

    yarn storybook

Run the tests:

    yarn run test

Build:

    yarn run build

We use [prettier](https://github.com/prettier/prettier) for code formatting:

    yarn run prettier

Checks:

    yarn test
    yarn run lint
    yarn run flow

### Contributing

If you would like to contribute to React Stripe please make sure to read our
[contributor guidelines](CONTRIBUTING.md).
