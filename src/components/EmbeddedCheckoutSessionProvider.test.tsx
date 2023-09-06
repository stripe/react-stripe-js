import React from 'react';
import {render, act} from '@testing-library/react';
import {renderHook} from '@testing-library/react-hooks';

import {
  EmbeddedCheckoutSessionProvider,
  useEmbeddedCheckoutContext,
} from './EmbeddedCheckoutSessionProvider';
import * as mocks from '../../test/mocks';

describe('EmbeddedCheckoutSessionProvider', () => {
  let mockStripe: any;
  let mockStripePromise: any;
  let mockEmbeddedCheckout: any;
  let mockEmbeddedCheckoutPromise: any;
  const fakeClientSecret = 'cs_123_secret_abc';
  const fakeOptions = {clientSecret: fakeClientSecret};
  let consoleWarn: any;
  let consoleError: any;

  beforeEach(() => {
    mockStripe = mocks.mockStripe();
    mockStripePromise = Promise.resolve(mockStripe);
    mockEmbeddedCheckout = mocks.mockEmbeddedCheckout();
    mockEmbeddedCheckoutPromise = Promise.resolve(mockEmbeddedCheckout);
    mockStripe.initEmbeddedCheckout.mockReturnValue(
      mockEmbeddedCheckoutPromise
    );

    jest.spyOn(console, 'error');
    jest.spyOn(console, 'warn');
    consoleError = console.error;
    consoleWarn = console.warn;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('provides the Embedded Checkout instance via context', async () => {
    const wrapper = ({children}: {children?: React.ReactNode}) => (
      <EmbeddedCheckoutSessionProvider
        stripe={mockStripe}
        options={fakeOptions}
      >
        {children}
      </EmbeddedCheckoutSessionProvider>
    );

    const {result} = renderHook(() => useEmbeddedCheckoutContext(), {wrapper});

    await act(() => mockEmbeddedCheckoutPromise);

    expect(result.current.embeddedCheckout).toBe(mockEmbeddedCheckout);
  });

  it('only creates elements once', async () => {
    const TestConsumerComponent = () => {
      const _ = useEmbeddedCheckoutContext();
      return <div />;
    };

    render(
      <EmbeddedCheckoutSessionProvider
        stripe={mockStripe}
        options={fakeOptions}
      >
        <TestConsumerComponent />
      </EmbeddedCheckoutSessionProvider>
    );

    await act(() => mockEmbeddedCheckoutPromise);

    expect(mockStripe.initEmbeddedCheckout).toHaveBeenCalledTimes(1);
  });

  it('allows a transition from null to a valid Stripe object', async () => {
    let stripeProp: any = null;
    const wrapper = ({children}: {children?: React.ReactNode}) => (
      <EmbeddedCheckoutSessionProvider
        stripe={stripeProp}
        options={fakeOptions}
      >
        {children}
      </EmbeddedCheckoutSessionProvider>
    );

    const {result, rerender} = renderHook(() => useEmbeddedCheckoutContext(), {
      wrapper,
    });
    expect(result.current.embeddedCheckout).toBe(null);

    stripeProp = mockStripe;
    rerender();
    await act(() => mockEmbeddedCheckoutPromise);
    expect(result.current.embeddedCheckout).toBe(mockEmbeddedCheckout);
  });

  it('allows a transition from null to a valid client secret', async () => {
    let optionsProp: any = {clientSecret: null};
    const wrapper = ({children}: {children?: React.ReactNode}) => (
      <EmbeddedCheckoutSessionProvider
        stripe={mockStripe}
        options={optionsProp}
      >
        {children}
      </EmbeddedCheckoutSessionProvider>
    );

    const {result, rerender} = renderHook(() => useEmbeddedCheckoutContext(), {
      wrapper,
    });
    expect(result.current.embeddedCheckout).toBe(null);

    optionsProp = {clientSecret: fakeClientSecret};
    rerender();

    await act(() => mockEmbeddedCheckoutPromise);
    expect(result.current.embeddedCheckout).toBe(mockEmbeddedCheckout);
  });

  it('works with a Promise resolving to a valid Stripe object', async () => {
    const wrapper = ({children}: {children?: React.ReactNode}) => (
      <EmbeddedCheckoutSessionProvider
        stripe={mockStripePromise}
        options={fakeOptions}
      >
        {children}
      </EmbeddedCheckoutSessionProvider>
    );

    const {result} = renderHook(() => useEmbeddedCheckoutContext(), {wrapper});

    expect(result.current.embeddedCheckout).toBe(null);

    await act(() => mockStripePromise);
    await act(() => mockEmbeddedCheckoutPromise);

    expect(result.current.embeddedCheckout).toBe(mockEmbeddedCheckout);
  });

  it('allows a transition from null to a valid Promise', async () => {
    let stripeProp: any = null;

    const wrapper = ({children}: {children?: React.ReactNode}) => (
      <EmbeddedCheckoutSessionProvider
        stripe={stripeProp}
        options={fakeOptions}
      >
        {children}
      </EmbeddedCheckoutSessionProvider>
    );

    const {result, rerender} = renderHook(() => useEmbeddedCheckoutContext(), {
      wrapper,
    });

    expect(result.current.embeddedCheckout).toBe(null);

    stripeProp = mockStripePromise;
    rerender();
    expect(result.current.embeddedCheckout).toBe(null);

    await act(() => mockStripePromise);

    expect(result.current.embeddedCheckout).toBe(mockEmbeddedCheckout);
  });

  it('works with a Promise resolving to null for SSR safety', async () => {
    const nullPromise = Promise.resolve(null);
    const TestConsumerComponent = () => {
      const {embeddedCheckout} = useEmbeddedCheckoutContext();
      return embeddedCheckout ? <div>not empty</div> : null;
    };

    const {container} = render(
      <EmbeddedCheckoutSessionProvider
        stripe={nullPromise}
        options={fakeOptions}
      >
        <TestConsumerComponent />
      </EmbeddedCheckoutSessionProvider>
    );

    expect(container).toBeEmptyDOMElement();

    await act(() => nullPromise.then(() => undefined));
    expect(container).toBeEmptyDOMElement();
  });

  it('errors when props.stripe is `undefined`', () => {
    // Silence console output so test output is less noisy
    consoleError.mockImplementation(() => {});

    expect(() =>
      render(
        <EmbeddedCheckoutSessionProvider
          stripe={undefined as any}
          options={fakeOptions}
        />
      )
    ).toThrow(
      'Invalid prop `stripe` supplied to `EmbeddedCheckoutSessionProvider`.'
    );
  });

  it('errors when props.stripe is `false`', () => {
    // Silence console output so test output is less noisy
    consoleError.mockImplementation(() => {});

    expect(() =>
      render(
        <EmbeddedCheckoutSessionProvider
          stripe={false as any}
          options={fakeOptions}
        />
      )
    ).toThrow(
      'Invalid prop `stripe` supplied to `EmbeddedCheckoutSessionProvider`.'
    );
  });

  it('errors when props.stripe is a string', () => {
    // Silence console output so test output is less noisy
    consoleError.mockImplementation(() => {});

    expect(() =>
      render(
        <EmbeddedCheckoutSessionProvider
          stripe={'foo' as any}
          options={fakeOptions}
        />
      )
    ).toThrow(
      'Invalid prop `stripe` supplied to `EmbeddedCheckoutSessionProvider`.'
    );
  });

  it('errors when props.stripe is a some other object', () => {
    // Silence console output so test output is less noisy
    consoleError.mockImplementation(() => {});

    expect(() =>
      render(
        <EmbeddedCheckoutSessionProvider
          stripe={{wat: 2} as any}
          options={fakeOptions}
        />
      )
    ).toThrow(
      'Invalid prop `stripe` supplied to `EmbeddedCheckoutSessionProvider`.'
    );
  });

  it('does not allow changes to a set Stripe object', async () => {
    // Silence console output so test output is less noisy
    consoleWarn.mockImplementation(() => {});

    const {rerender} = render(
      <EmbeddedCheckoutSessionProvider
        stripe={mockStripe}
        options={fakeOptions}
      ></EmbeddedCheckoutSessionProvider>
    );
    await act(() => mockEmbeddedCheckoutPromise);

    const mockStripe2: any = mocks.mockStripe();
    rerender(
      <EmbeddedCheckoutSessionProvider
        stripe={mockStripe2}
        options={fakeOptions}
      ></EmbeddedCheckoutSessionProvider>
    );

    expect(mockStripe.initEmbeddedCheckout.mock.calls).toHaveLength(1);
    expect(mockStripe2.initEmbeddedCheckout.mock.calls).toHaveLength(0);
    expect(consoleWarn).toHaveBeenCalledWith(
      'Unsupported prop change on EmbeddedCheckoutSessionProvider: You cannot change the `stripe` prop after setting it.'
    );
  });

  it('does not allow changes to clientSecret option', async () => {
    const optionsProp1 = {clientSecret: 'cs_123_secret_abc'};
    const optionsProp2 = {clientSecret: 'cs_abc_secret_123'};

    // Silence console output so test output is less noisy
    consoleWarn.mockImplementation(() => {});

    const {rerender} = render(
      <EmbeddedCheckoutSessionProvider
        stripe={mockStripe}
        options={optionsProp1}
      ></EmbeddedCheckoutSessionProvider>
    );
    await act(() => mockEmbeddedCheckoutPromise);

    rerender(
      <EmbeddedCheckoutSessionProvider
        stripe={mockStripe}
        options={optionsProp2}
      ></EmbeddedCheckoutSessionProvider>
    );

    expect(consoleWarn).toHaveBeenCalledWith(
      'Unsupported prop change on EmbeddedCheckoutSessionProvider: You cannot change the client secret after setting it. Unmount and create a new instance of EmbeddedCheckoutSessionProvider instead.'
    );
  });

  it('does not allow changes to onComplete option', async () => {
    const optionsProp1 = {
      clientSecret: 'cs_123_secret_abc',
      onComplete: () => 'foo',
    };
    const optionsProp2 = {
      clientSecret: 'cs_123_secret_abc',
      onComplete: () => 'bar',
    };
    // Silence console output so test output is less noisy
    consoleWarn.mockImplementation(() => {});

    const {rerender} = render(
      <EmbeddedCheckoutSessionProvider
        stripe={mockStripe}
        options={optionsProp1}
      ></EmbeddedCheckoutSessionProvider>
    );
    await act(() => mockEmbeddedCheckoutPromise);

    rerender(
      <EmbeddedCheckoutSessionProvider
        stripe={mockStripe}
        options={optionsProp2}
      ></EmbeddedCheckoutSessionProvider>
    );

    expect(consoleWarn).toHaveBeenCalledWith(
      'Unsupported prop change on EmbeddedCheckoutSessionProvider: You cannot change the onComplete option after setting it.'
    );
  });

  it('destroys Embedded Checkout when the component unmounts', async () => {
    const {rerender} = render(
      <div>
        <EmbeddedCheckoutSessionProvider
          stripe={mockStripe}
          options={fakeOptions}
        ></EmbeddedCheckoutSessionProvider>
      </div>
    );

    await act(() => mockEmbeddedCheckoutPromise);

    rerender(<div></div>);
    expect(mockEmbeddedCheckout.destroy).toBeCalled();
  });
});
