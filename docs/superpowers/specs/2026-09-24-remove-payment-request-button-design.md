# Remove Payment Request Button

## Goal

Remove the React Stripe.js Payment Request Button integration for the next major
release while preserving the `stripe.paymentRequest()` API exposed by
`@stripe/stripe-js`.

## Scope

- Remove the `PaymentRequestButtonElement` public component export.
- Remove its React props and component types.
- Remove its `elements.getElement()` TypeScript overload.
- Delete the hook and class-component Payment Request Button examples and their
  Storybook stories.
- Remove Payment Request Button-specific option update behavior and tests.
- Preserve generic click-event coverage by using `ExpressCheckoutElement`.
- Leave the numbered example filename gap instead of renaming unrelated
  examples.

## Preserved behavior

- `useStripe()` continues to return the Stripe instance, including
  `stripe.paymentRequest()`.
- `mockStripe().paymentRequest` remains available for tests.
- The `@stripe/stripe-js` development and peer dependency ranges remain
  unchanged.
- Generic Element option updates and immutable-option utilities remain intact.

## Implementation

Remove the Payment Request Button import and factory export from `src/index.ts`.
Remove the associated public declarations and module augmentation from
`src/types/index.ts`.

In the shared Element factory, remove `paymentRequest` from the immutable option
keys. Continue to pass an empty immutable-key list so generic option updates
behave as before. Delete the factory integration test that exists only for this
immutable Payment Request Button option. Change the click-event propagation test
to use the existing `ExpressCheckoutElement` test component.

Delete the four Payment Request Button example and story files. Do not add
replacement examples or migration documentation in this change.

## Verification

- Search the repository and confirm there are no remaining
  `PaymentRequestButton` or `paymentRequestButton` references.
- Confirm remaining `paymentRequest` references are limited to the preserved
  Stripe API surface.
- Run Prettier validation, ESLint, TypeScript typechecking, unit tests, the
  package build, and package type validation.
