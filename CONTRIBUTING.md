# Contributing to React Stripe.js

This project is maintained by Stripe and does not accept external pull requests.
We welcome bug reports and feature requests as issues.

## Issues

React Stripe is a thin wrapper around [Stripe.js] and [Stripe
Elements][elements] for React. Please only file issues here that you believe
represent bugs with React Stripe.js, not Stripe.js itself.

If you're having general trouble with Stripe.js or your Stripe integration,
please reach out to us using the form at <https://support.stripe.com/email> or
come chat with us on the [Stripe Discord server][developer-chat]. We're very
proud of our level of service, and we're more than happy to help you out with
your integration.

If you've found a bug in React Stripe.js, please [let us know][issue]! You may
also want to check out our [issue template][issue-template].

## Developing

Install dependencies:

```sh
yarn install
```

Run the examples using [Storybook](https://storybook.js.org/):

```sh
yarn storybook
```

We use a number of automated checks:

- Flow, for adding types to JavaScript
  - `yarn run flow`
- Jest, for testing
  - `yarn test`
- ESLint, for assorted warnings
  - `yarn run lint`
- Prettier, for code formatting
  - `yarn run prettier`

You might want to configure your editor to automatically run these checks. Not
passing any of these checks will cause the CI build to fail.

[stripe.js]: https://stripe.com/docs/stripe.js
[elements]: https://stripe.com/elements
[issue]: https://github.com/stripe/react-stripe-js/issues/new
[issue-template]: .github/ISSUE_TEMPLATE.md
[developer-chat]: https://stripe.com/go/developer-chat
