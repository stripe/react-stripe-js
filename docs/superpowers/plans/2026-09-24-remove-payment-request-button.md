# Remove Payment Request Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the React `PaymentRequestButtonElement` integration without
changing access to `stripe.paymentRequest()`.

**Architecture:** Delete the button component at the package entry point and
remove its public TypeScript surface. Remove button-specific behavior and
examples while preserving the shared Element factory, Stripe instance mock, and
generic event coverage.

**Tech Stack:** React 19, TypeScript 5.6, Jest, Testing Library, Rollup, Yarn

## Global Constraints

- Keep `stripe.paymentRequest()` available through the Stripe instance returned
  by `useStripe()`.
- Keep `test/mocks.js` `paymentRequest: jest.fn()` unchanged.
- Keep `@stripe/stripe-js` dependency and peer dependency ranges unchanged.
- Leave the numbered example filename gap.
- Do not add replacement examples, migration documentation, or changelog
  content.
- Do not create commits unless the user explicitly requests them.

---

### Task 1: Remove the public component and type surface

**Files:**

- Modify: `src/index.ts:2-26,103-107`
- Modify: `src/types/index.ts:511-532,762-768`

**Interfaces:**

- Removes: `PaymentRequestButtonElement`
- Removes: `PaymentRequestButtonElementProps`
- Removes: `PaymentRequestButtonElementComponent`
- Removes: `StripeElements#getElement(PaymentRequestButtonElementComponent)`
- Preserves: `useStripe(): Stripe | null`, including `Stripe#paymentRequest`

- [ ] **Step 1: Remove the public component type import and export**

Delete `PaymentRequestButtonElementComponent` from the type import in
`src/index.ts`, then delete this complete export:

```typescript
/**
 * @docs https://stripe.com/docs/stripe-js/react#element-components
 */
export const PaymentRequestButtonElement: PaymentRequestButtonElementComponent =
  createElementComponent('paymentRequestButton', isServer);
```

- [ ] **Step 2: Remove the component props and component type**

Delete this complete block from `src/types/index.ts`:

```typescript
export interface PaymentRequestButtonElementProps extends ElementProps {
  /**
   * An object containing [Element configuration options](https://stripe.com/docs/js/elements_object/create_element?type=paymentRequestButton).
   */
  options?: stripeJs.StripePaymentRequestButtonElementOptions;

  /**
   * Triggered when the Element is clicked.
   */
  onClick?: (
    event: stripeJs.StripePaymentRequestButtonElementClickEvent
  ) => any;

  /**
   * Triggered when the Element is fully rendered and can accept imperative `element.focus()` calls.
   * Called with a reference to the underlying [Element instance](https://stripe.com/docs/js/element).
   */
  onReady?: (element: stripeJs.StripePaymentRequestButtonElement) => any;
}

export type PaymentRequestButtonElementComponent =
  FunctionComponent<PaymentRequestButtonElementProps>;
```

- [ ] **Step 3: Remove the `getElement` overload**

Delete the Payment Request Button documentation and overload from the
`StripeElements` module augmentation:

```typescript
/**
 * Returns the underlying [element instance](https://stripe.com/docs/js/elements_object/create_element?type=paymentRequestButton) for the `PaymentRequestButtonElement` component in the current [Elements](https://stripe.com/docs/stripe-js/react#elements-provider) provider tree.
 * Returns `null` if no `PaymentRequestButtonElement` is rendered in the current `Elements` provider tree.
 */
getElement(
  component: PaymentRequestButtonElementComponent
): stripeJs.StripePaymentRequestButtonElement | null;
```

- [ ] **Step 4: Confirm remaining in-repository consumers fail typechecking**

Run: `yarn typecheck`

Expected: FAIL only where tests and examples still import or type
`PaymentRequestButtonElement`. This confirms the removed API is no longer
exported before its consumers are cleaned up.

---

### Task 2: Remove button-specific behavior, tests, and examples

**Files:**

- Modify: `src/components/createElementComponent.tsx:214-227`
- Modify:
  `src/components/createElementComponent.test.tsx:11-24,165-184,710-728,1003-1032`
- Delete: `examples/hooks/3-Payment-Request-Button.tsx`
- Delete: `examples/hooks/3-Payment-Request-Button.stories.tsx`
- Delete: `examples/class-components/3-Payment-Request-Button.tsx`
- Delete: `examples/class-components/3-Payment-Request-Button.stories.tsx`

**Interfaces:**

- Preserves: generic `onClick` event attachment through `createElementComponent`
- Preserves: generic mutable option updates
- Removes: special handling for immutable `options.paymentRequest`

- [ ] **Step 1: Remove the button-only test component**

Delete `PaymentRequestButtonElementComponent` from the test type imports and
delete:

```typescript
const PaymentRequestButtonElement: PaymentRequestButtonElementComponent =
  createElementComponent('card', false);
```

- [ ] **Step 2: Preserve click-event coverage with Express Checkout**

Change both render calls in the click-event test to use the existing component:

```tsx
const {rerender} = render(
  <Elements stripe={mockStripe}>
    <ExpressCheckoutElement onClick={mockHandler} />
  </Elements>
);
rerender(
  <Elements stripe={mockStripe}>
    <ExpressCheckoutElement onClick={mockHandler2} />
  </Elements>
);
```

Keep the existing click simulation and assertions unchanged.

- [ ] **Step 3: Remove the button-only immutable-option test**

Delete the complete `warns on changes to non-updatable options` test. The
standalone `extractAllowedOptionsUpdates` tests continue to cover immutable-key
warning behavior.

- [ ] **Step 4: Remove button-specific immutable option handling**

Replace the button-specific immutable-key list in `createElementComponent.tsx`:

```typescript
const updates = extractAllowedOptionsUpdates(options, prevOptions, []);
```

Keep the option update effect and shared utility unchanged.

- [ ] **Step 5: Delete the hook and class-component examples**

Delete these files without renaming later examples:

```text
examples/hooks/3-Payment-Request-Button.tsx
examples/hooks/3-Payment-Request-Button.stories.tsx
examples/class-components/3-Payment-Request-Button.tsx
examples/class-components/3-Payment-Request-Button.stories.tsx
```

- [ ] **Step 6: Run focused tests and typechecking**

Run: `yarn test:unit src/components/createElementComponent.test.tsx --runInBand`

Expected: PASS for `createElementComponent.test.tsx`.

Run: `yarn typecheck`

Expected: PASS with no missing Payment Request Button imports or types.

---

### Task 3: Verify complete removal and preserved Payment Request API

**Files:**

- Verify unchanged: `test/mocks.js`
- Verify all modified and deleted files from Tasks 1 and 2

**Interfaces:**

- Verifies: no React Payment Request Button API remains
- Verifies: the Stripe Payment Request API test mock remains

- [ ] **Step 1: Search for removed button identifiers**

Run:

```bash
rg 'PaymentRequestButton|paymentRequestButton' \
  --glob '!docs/superpowers/**' \
  .
```

Expected: no matches.

- [ ] **Step 2: Inspect preserved Payment Request API references**

Run:

```bash
rg 'paymentRequest' \
  --glob '!docs/superpowers/**' \
  .
```

Expected: the retained `paymentRequest: jest.fn()` Stripe mock remains; no React
button component, button options, examples, or stories remain.

- [ ] **Step 3: Run formatting and lint validation**

Run: `yarn lint:prettier`

Expected: PASS with no files listed as incorrectly formatted.

Run: `yarn lint`

Expected: PASS with zero warnings.

- [ ] **Step 4: Run the complete unit and type suites**

Run: `yarn test:unit --runInBand`

Expected: PASS.

Run: `yarn typecheck`

Expected: PASS.

- [ ] **Step 5: Build and validate the package types**

Run: `yarn build`

Expected: PASS; Rollup produces package bundles and `scripts/check-imports`
succeeds.

Run: `yarn test:package-types`

Expected: PASS.

- [ ] **Step 6: Review the final diff**

Run: `git status --short && git diff --check && git diff --stat && git diff`

Expected: only the approved source, type, test, example deletion, design, and
plan changes are present; `git diff --check` reports no whitespace errors.
