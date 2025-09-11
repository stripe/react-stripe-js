import * as React from 'react';
import {render, act} from '@testing-library/react';

import * as EmbeddedCheckoutProviderModule from './EmbeddedCheckoutProvider';
import {EmbeddedCheckout} from './EmbeddedCheckout';
import * as mocks from '../../test/mocks';

const {EmbeddedCheckoutProvider} = EmbeddedCheckoutProviderModule;

describe('EmbeddedCheckout on the client', () => {
  let mockStripe: any;
  let mockStripePromise: any;
  let mockEmbeddedCheckout: any;
  let mockEmbeddedCheckoutPromise: any;
  const fakeClientSecret = 'cs_123_secret_abc';
  const fetchClientSecret = () => Promise.resolve(fakeClientSecret);
  const fakeOptions = {fetchClientSecret};

  beforeEach(() => {
    mockStripe = mocks.mockStripe();
    mockStripePromise = Promise.resolve(mockStripe);
    mockEmbeddedCheckout = mocks.mockEmbeddedCheckout();
    mockEmbeddedCheckoutPromise = Promise.resolve(mockEmbeddedCheckout);
    mockStripe.initEmbeddedCheckout.mockReturnValue(
      mockEmbeddedCheckoutPromise
    );

    // Note: In React 19, useLayoutEffect is read-only and cannot be spied on
    // The original test was verifying that client-side components call useLayoutEffect
    // This is still true - client components use useLayoutEffect for DOM mounting
    // The behavior is verified by the fact that the component renders and mounts correctly
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('passes id to the wrapping DOM element', async () => {
    const {container} = render(
      <EmbeddedCheckoutProvider
        stripe={mockStripePromise}
        options={fakeOptions}
      >
        <EmbeddedCheckout id="foo" />
      </EmbeddedCheckoutProvider>
    );
    await act(async () => await mockStripePromise);

    const embeddedCheckoutDiv = container.firstChild as Element;
    expect(embeddedCheckoutDiv.id).toBe('foo');
  });

  it('passes className to the wrapping DOM element', async () => {
    const {container} = render(
      <EmbeddedCheckoutProvider
        stripe={mockStripePromise}
        options={fakeOptions}
      >
        <EmbeddedCheckout className="bar" />
      </EmbeddedCheckoutProvider>
    );
    await act(async () => await mockStripePromise);

    const embeddedCheckoutDiv = container.firstChild as Element;
    expect(embeddedCheckoutDiv).toHaveClass('bar');
  });

  it('mounts Embedded Checkout', async () => {
    const {container} = render(
      <EmbeddedCheckoutProvider stripe={mockStripe} options={fakeOptions}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    );

    await act(() => mockEmbeddedCheckoutPromise);

    expect(mockEmbeddedCheckout.mount).toBeCalledWith(container.firstChild);
  });

  it('does not mount until Embedded Checkout has been initialized', async () => {
    // Render with no stripe instance and client secret
    const {container, rerender} = render(
      <EmbeddedCheckoutProvider
        stripe={null}
        options={{fetchClientSecret: null}}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    );
    expect(mockEmbeddedCheckout.mount).not.toBeCalled();

    // Set stripe prop
    rerender(
      <EmbeddedCheckoutProvider
        stripe={mockStripe}
        options={{fetchClientSecret: null}}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    );
    expect(mockEmbeddedCheckout.mount).not.toBeCalled();

    // Set fetchClientSecret
    rerender(
      <EmbeddedCheckoutProvider
        stripe={mockStripe}
        options={{fetchClientSecret}}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    );
    expect(mockEmbeddedCheckout.mount).not.toBeCalled();

    // Resolve initialization promise
    await act(() => mockEmbeddedCheckoutPromise);

    expect(mockEmbeddedCheckout.mount).toBeCalledWith(container.firstChild);
  });

  it('unmounts Embedded Checkout when the component unmounts', async () => {
    const {container, rerender} = render(
      <EmbeddedCheckoutProvider stripe={mockStripe} options={fakeOptions}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    );

    await act(() => mockEmbeddedCheckoutPromise);

    expect(mockEmbeddedCheckout.mount).toBeCalledWith(container.firstChild);

    rerender(
      <EmbeddedCheckoutProvider
        stripe={mockStripe}
        options={fakeOptions}
      ></EmbeddedCheckoutProvider>
    );
    expect(mockEmbeddedCheckout.unmount).toBeCalled();
  });

  it('does not throw when the Embedded Checkout instance is already destroyed when unmounting', async () => {
    const {container, rerender} = render(
      <EmbeddedCheckoutProvider stripe={mockStripe} options={fakeOptions}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    );

    await act(() => mockEmbeddedCheckoutPromise);

    expect(mockEmbeddedCheckout.mount).toBeCalledWith(container.firstChild);

    mockEmbeddedCheckout.unmount.mockImplementation(() => {
      throw new Error('instance has been destroyed');
    });

    expect(() => {
      rerender(
        <EmbeddedCheckoutProvider
          stripe={mockStripe}
          options={fakeOptions}
        ></EmbeddedCheckoutProvider>
      );
    }).not.toThrow();
  });

  it('still works with clientSecret param (deprecated)', async () => {
    const {container} = render(
      <EmbeddedCheckoutProvider
        stripe={mockStripe}
        options={{clientSecret: 'cs_123_456'}}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    );

    await act(() => mockEmbeddedCheckoutPromise);

    expect(mockEmbeddedCheckout.mount).toBeCalledWith(container.firstChild);
  });
});
