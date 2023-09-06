import React from 'react';
import {render, act} from '@testing-library/react';

import * as EmbeddedCheckoutSessionProviderModule from './EmbeddedCheckoutSessionProvider';
import {EmbeddedCheckout} from './EmbeddedCheckout';
import * as mocks from '../../test/mocks';

const {EmbeddedCheckoutSessionProvider} = EmbeddedCheckoutSessionProviderModule;

describe('EmbeddedCheckout on the client', () => {
  let mockStripe: any;
  let mockEmbeddedCheckout: any;
  let mockEmbeddedCheckoutPromise: any;
  const fakeClientSecret = 'cs_123_secret_abc';
  const fakeOptions = {clientSecret: fakeClientSecret};

  beforeEach(() => {
    mockStripe = mocks.mockStripe();
    mockEmbeddedCheckout = mocks.mockEmbeddedCheckout();
    mockEmbeddedCheckoutPromise = Promise.resolve(mockEmbeddedCheckout);
    mockStripe.initEmbeddedCheckout.mockReturnValue(
      mockEmbeddedCheckoutPromise
    );

    jest.spyOn(React, 'useLayoutEffect');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('passes id to the wrapping DOM element', () => {
    const {container} = render(
      <EmbeddedCheckoutSessionProvider
        stripe={mockStripe}
        options={fakeOptions}
      >
        <EmbeddedCheckout id="foo" />
      </EmbeddedCheckoutSessionProvider>
    );
    const embeddedCheckoutDiv = container.firstChild as Element;

    expect(embeddedCheckoutDiv.id).toBe('foo');
  });

  it('passes className to the wrapping DOM element', () => {
    const {container} = render(
      <EmbeddedCheckoutSessionProvider
        stripe={mockStripe}
        options={fakeOptions}
      >
        <EmbeddedCheckout className="bar" />
      </EmbeddedCheckoutSessionProvider>
    );
    const embeddedCheckoutDiv = container.firstChild as Element;

    expect(embeddedCheckoutDiv).toHaveClass('bar');
  });

  it('mounts Embedded Checkout', async () => {
    const {container} = render(
      <EmbeddedCheckoutSessionProvider
        stripe={mockStripe}
        options={fakeOptions}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutSessionProvider>
    );

    await act(() => mockEmbeddedCheckoutPromise);

    expect(mockEmbeddedCheckout.mount).toBeCalledWith(container.firstChild);
  });

  it('does not mount until Embedded Checkouts has been initialized', async () => {
    // Render with no stripe instance and client secret
    const {container, rerender} = render(
      <EmbeddedCheckoutSessionProvider
        stripe={null}
        options={{clientSecret: null}}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutSessionProvider>
    );
    expect(mockEmbeddedCheckout.mount).not.toBeCalled();

    // Set stripe prop
    rerender(
      <EmbeddedCheckoutSessionProvider
        stripe={mockStripe}
        options={{clientSecret: null}}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutSessionProvider>
    );
    expect(mockEmbeddedCheckout.mount).not.toBeCalled();

    // Set client secret
    rerender(
      <EmbeddedCheckoutSessionProvider
        stripe={mockStripe}
        options={{clientSecret: fakeClientSecret}}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutSessionProvider>
    );
    expect(mockEmbeddedCheckout.mount).not.toBeCalled();

    // Resolve initialization promise
    await act(() => mockEmbeddedCheckoutPromise);

    expect(mockEmbeddedCheckout.mount).toBeCalledWith(container.firstChild);
  });

  it('unmounts Embedded Checkout when the component unmounts', async () => {
    const {container, rerender} = render(
      <EmbeddedCheckoutSessionProvider
        stripe={mockStripe}
        options={fakeOptions}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutSessionProvider>
    );

    await act(() => mockEmbeddedCheckoutPromise);

    expect(mockEmbeddedCheckout.mount).toBeCalledWith(container.firstChild);

    rerender(
      <EmbeddedCheckoutSessionProvider
        stripe={mockStripe}
        options={fakeOptions}
      ></EmbeddedCheckoutSessionProvider>
    );
    expect(mockEmbeddedCheckout.unmount).toBeCalled();
  });
});
