# Changelog

React Stripe.js adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v1.0.3 - 2020-02-25

### Fixes

Fixed an issue where build output was not correctly transpiled to ES5 #50

## v1.0.2 - 2020-02-20

### Documentation

- Remove beta callout in the readme
- Add links to relevant integration guides in each example

## v1.0.1 - 2020-02-20

Initial stable release. No changes.

## v1.0.0-beta.7 - 2020-02-13

### New Features

- Add `FpxBankElement`, and examples.
- Add `AuBankAccountElement`.
  - The AU BECS Debit Payment Method is currently in beta, for more information
    please contact [Stripe Support](https://support.stripe.com/).
- **[types]** Bump
  [`@stripe/stripe-js` to `1.0.0-beta.9`](https://github.com/stripe/stripe-js/releases/tag/v1.0.0-beta.9)
  to use the new Payment Methods.

### Fixes

- Fixed the ES Module version of this package to only use the default export of
  `react` to allow integrations that don't accept named exports. (#40)

## v1.0.0-beta.6 - 2020-02-11

### Fixes

Invalid import of `prop-types` causing an error when using the ES Module version
of this library (#33) Various Stripe.js types from
[@stripe/stripe-js](https://github.com/stripe/stripe-js/releases).

## v1.0.0-beta.5 - 2020-02-06

### Fixes

- Fix types for TS projects not using esModuleInterop (#31)

## v1.0.0-beta.4 - 2020-02-06

### Features

- Adds TypeScript support, to be used in tandem with the latest
  [`@stripe/stripe-js`](https://github.com/stripe/stripe-js) release. For more
  information, see our
  [TypeScript versioning policy](https://github.com/stripe/stripe-js#typescript-support).

## v1.0.0-beta.3 - 2020-01-23

### Fixes

- Removes a warning about `useLayoutEffect` when using React Stripe.js with
  server side rendering.

### Documentation

- Add class component minimal example to readme
- Add a class component example for each hooks based example
- Update examples to use `loadStripe`
- Misc. example refactors

## v1.0.0-beta.2 - 2020-01-21

Initial public beta
