import React, {StrictMode} from 'react';
import {act, render, renderHook, waitFor} from '@testing-library/react';
import * as stripeJs from '@stripe/stripe-js';

import * as mocks from '../../test/mocks';
import makeDeferred from '../../test/makeDeferred';
import {PricingProvider} from './PricingProvider';
import {usePricingContext} from './PricingContext';

describe('PricingProvider', () => {
  let mockStripe: any;
  let mockStripePromise: any;
  let mockPricing: any;
  let consoleError: any;
  let consoleWarn: any;

  beforeEach(() => {
    mockPricing = mocks.mockPricing();

    mockStripe = mocks.mockStripe();
    mockStripe.initializePricing.mockResolvedValue(mockPricing);
    mockStripePromise = Promise.resolve(mockStripe);

    jest.spyOn(console, 'error');
    jest.spyOn(console, 'warn');
    consoleError = console.error;
    consoleWarn = console.warn;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const defaultOptions: stripeJs.InitializePricingOptions = {
    pricingPolicy: 'pricing_policy_123',
  };

  const expectContextValueSuccess = (state: unknown) => {
    expect(state).toEqual({
      type: 'success',
      pricing: mockPricing,
      changeVersion: 0,
    });
  };

  it('initializes a synchronous Stripe exactly once and cleans up its listener', async () => {
    const options = {...defaultOptions, detectedCurrencyOverride: 'eur'};
    const rendered = render(
      <StrictMode>
        <PricingProvider stripe={mockStripe} options={options}>
          <div />
        </PricingProvider>
      </StrictMode>
    );

    await waitFor(() => expect(mockPricing.on).toHaveBeenCalledTimes(1));
    const changeHandler = mockPricing.on.mock.calls[0][1];
    expect(mockStripe.initializePricing).toHaveBeenCalledTimes(1);
    expect(mockStripe.initializePricing).toHaveBeenCalledWith(options);

    rendered.unmount();
    expect(mockPricing.off).toHaveBeenCalledTimes(1);
    expect(mockPricing.off).toHaveBeenCalledWith('change', changeHandler);
  });

  it('validates stripe prop type', async () => {
    consoleError.mockImplementation(() => {});

    const renderWithStripeProp = (stripeProp: unknown) => () => {
      render(
        <PricingProvider stripe={stripeProp as any} options={defaultOptions}>
          <div />
        </PricingProvider>
      );
    };

    expect(renderWithStripeProp(undefined)).toThrow(
      'Invalid prop `stripe` supplied to `PricingProvider`'
    );
    expect(renderWithStripeProp(false)).toThrow(
      'Invalid prop `stripe` supplied to `PricingProvider`.'
    );
    expect(renderWithStripeProp('foo')).toThrow(
      'Invalid prop `stripe` supplied to `PricingProvider`.'
    );
    expect(renderWithStripeProp({foo: 'bar'})).toThrow(
      'Invalid prop `stripe` supplied to `PricingProvider`.'
    );
  });

  it('works when stripe is a promise', async () => {
    const deferredStripe = makeDeferred<stripeJs.Stripe | null>();
    const deferredPricing = makeDeferred();
    mockStripe.initializePricing.mockReturnValue(deferredPricing.promise);
    const {result} = renderHook(() => usePricingContext('usePricing'), {
      wrapper: ({children}) => (
        <PricingProvider
          stripe={deferredStripe.promise}
          options={defaultOptions}
        >
          {children}
        </PricingProvider>
      ),
    });

    expect(result.current).toEqual({type: 'loading'});
    expect(mockStripe.initializePricing).not.toHaveBeenCalled();

    await act(() => deferredStripe.resolve(mockStripe));
    expect(mockStripe.initializePricing).toHaveBeenCalledTimes(1);
    expect(mockStripe.initializePricing).toHaveBeenCalledWith(defaultOptions);
    expect(result.current).toEqual({type: 'loading'});

    await act(() => deferredPricing.resolve(mockPricing));
    expectContextValueSuccess(result.current);
  });

  it('works when stripe changes from null to a promise', async () => {
    const deferred = makeDeferred<stripeJs.Stripe | null>();
    let stripeProp: any = null;
    const {result, rerender} = renderHook(
      () => usePricingContext('usePricing'),
      {
        wrapper: ({children}) => (
          <PricingProvider stripe={stripeProp} options={defaultOptions}>
            {children}
          </PricingProvider>
        ),
      }
    );

    stripeProp = deferred.promise;
    rerender();
    expect(result.current).toEqual({type: 'loading'});
    expect(mockStripe.initializePricing).not.toHaveBeenCalled();

    await act(() => deferred.resolve(mockStripe));

    expectContextValueSuccess(result.current);
  });

  it('works when stripe is a promise resolving to null', async () => {
    const deferred = makeDeferred<stripeJs.Stripe | null>();
    const {result} = renderHook(() => usePricingContext('usePricing'), {
      wrapper: ({children}) => (
        <PricingProvider stripe={deferred.promise} options={defaultOptions}>
          {children}
        </PricingProvider>
      ),
    });

    await act(() => deferred.resolve(null));

    expect(result.current).toEqual({type: 'loading'});
    expect(mockStripe.initializePricing).not.toHaveBeenCalled();
  });

  it('does not allow changes to an already set Stripe object', async () => {
    consoleWarn.mockImplementation(() => {});
    let stripeProp: any = mockStripe;
    const {result, rerender} = renderHook(
      () => usePricingContext('usePricing'),
      {
        wrapper: ({children}) => (
          <PricingProvider stripe={stripeProp} options={defaultOptions}>
            {children}
          </PricingProvider>
        ),
      }
    );
    await waitFor(() => expectContextValueSuccess(result.current));

    const otherStripe = mocks.mockStripe();
    stripeProp = otherStripe;
    rerender();
    await act(async () => {});

    expectContextValueSuccess(result.current);
    expect(mockStripe.initializePricing).toHaveBeenCalledTimes(1);
    expect(otherStripe.initializePricing).not.toHaveBeenCalled();
    expect(consoleWarn).toHaveBeenCalledWith(
      'Unsupported prop change on PricingProvider. You cannot change the `stripe` prop after setting it.'
    );
  });

  it('does not allow changes to options.pricingPolicy once Stripe is set', async () => {
    consoleWarn.mockImplementation(() => {});
    let optionsProp: stripeJs.InitializePricingOptions = defaultOptions;
    const {result, rerender} = renderHook(
      () => usePricingContext('usePricing'),
      {
        wrapper: ({children}) => (
          <PricingProvider stripe={mockStripe} options={optionsProp}>
            {children}
          </PricingProvider>
        ),
      }
    );
    await waitFor(() => expectContextValueSuccess(result.current));

    optionsProp = {...defaultOptions, pricingPolicy: 'pricing_policy_456'};
    rerender();
    await act(async () => {});

    expectContextValueSuccess(result.current);
    expect(mockStripe.initializePricing).toHaveBeenCalledTimes(1);
    expect(consoleWarn).toHaveBeenCalledWith(
      'Unsupported prop change on PricingProvider: You cannot change `options.pricingPolicy` after setting it.'
    );
  });

  it('does not allow changes to options.detectedCurrencyOverride once Stripe is set', async () => {
    consoleWarn.mockImplementation(() => {});
    let optionsProp: stripeJs.InitializePricingOptions = defaultOptions;
    const {result, rerender} = renderHook(
      () => usePricingContext('usePricing'),
      {
        wrapper: ({children}) => (
          <PricingProvider stripe={mockStripe} options={optionsProp}>
            {children}
          </PricingProvider>
        ),
      }
    );
    await waitFor(() => expectContextValueSuccess(result.current));

    optionsProp = {...defaultOptions, detectedCurrencyOverride: 'eur'};
    rerender();
    await act(async () => {});

    expectContextValueSuccess(result.current);
    expect(mockStripe.initializePricing).toHaveBeenCalledTimes(1);
    expect(consoleWarn).toHaveBeenCalledWith(
      'Unsupported prop change on PricingProvider: You cannot change `options.detectedCurrencyOverride` after setting it.'
    );
  });

  it('allows changes to options while stripe is null', async () => {
    consoleWarn.mockImplementation(() => {});
    let stripeProp: any = null;
    let optionsProp: stripeJs.InitializePricingOptions = defaultOptions;
    const {result, rerender} = renderHook(
      () => usePricingContext('usePricing'),
      {
        wrapper: ({children}) => (
          <PricingProvider stripe={stripeProp} options={optionsProp}>
            {children}
          </PricingProvider>
        ),
      }
    );

    const options = {
      pricingPolicy: 'pricing_policy_456',
      detectedCurrencyOverride: 'eur',
    };

    optionsProp = options;
    rerender();
    expect(mockStripe.initializePricing).not.toHaveBeenCalled();

    stripeProp = mockStripe;
    rerender();
    await waitFor(() => expectContextValueSuccess(result.current));

    expect(mockStripe.initializePricing).toHaveBeenCalledTimes(1);
    expect(mockStripe.initializePricing).toHaveBeenCalledWith(options);
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it('allows changes to options while the Stripe promise is pending', async () => {
    consoleWarn.mockImplementation(() => {});
    const deferred = makeDeferred<stripeJs.Stripe | null>();
    let optionsProp: stripeJs.InitializePricingOptions = defaultOptions;
    const {result, rerender} = renderHook(
      () => usePricingContext('usePricing'),
      {
        wrapper: ({children}) => (
          <PricingProvider stripe={deferred.promise} options={optionsProp}>
            {children}
          </PricingProvider>
        ),
      }
    );
    const options = {
      pricingPolicy: 'pricing_policy_456',
      detectedCurrencyOverride: 'eur',
    };

    optionsProp = options;
    rerender();
    expect(mockStripe.initializePricing).not.toHaveBeenCalled();

    await act(() => deferred.resolve(mockStripe));
    expectContextValueSuccess(result.current);

    expect(mockStripe.initializePricing).toHaveBeenCalledTimes(1);
    expect(mockStripe.initializePricing).toHaveBeenCalledWith(options);
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it('uses updated options when Stripe becomes available in the same render', async () => {
    let stripeProp: any = null;
    let optionsProp = defaultOptions;
    const {result, rerender} = renderHook(
      () => usePricingContext('usePricing'),
      {
        wrapper: ({children}) => (
          <PricingProvider stripe={stripeProp} options={optionsProp}>
            {children}
          </PricingProvider>
        ),
      }
    );

    stripeProp = mockStripe;
    optionsProp = {
      pricingPolicy: 'pricing_policy_456',
      detectedCurrencyOverride: 'eur',
    };
    rerender();
    await waitFor(() => expectContextValueSuccess(result.current));

    expect(mockStripe.initializePricing).toHaveBeenCalledTimes(1);
    expect(mockStripe.initializePricing).toHaveBeenCalledWith(optionsProp);
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it('ignores options changes while initialization is pending in StrictMode', async () => {
    consoleWarn.mockImplementation(() => {});
    const deferred = makeDeferred<stripeJs.Pricing>();
    mockStripe.initializePricing.mockReturnValue(deferred.promise);
    let optionsProp = defaultOptions;
    const {result, rerender} = renderHook(
      () => usePricingContext('usePricing'),
      {
        reactStrictMode: true,
        wrapper: ({children}) => (
          <PricingProvider stripe={mockStripe} options={optionsProp}>
            {children}
          </PricingProvider>
        ),
      }
    );

    expect(mockStripe.initializePricing).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual({type: 'loading'});

    optionsProp = {
      pricingPolicy: 'pricing_policy_456',
      detectedCurrencyOverride: 'eur',
    };
    rerender();

    expect(mockStripe.initializePricing).toHaveBeenCalledTimes(1);
    expect(mockStripe.initializePricing).toHaveBeenCalledWith(defaultOptions);
    expect(consoleWarn).toHaveBeenCalledTimes(2);
    expect(consoleWarn).toHaveBeenCalledWith(
      'Unsupported prop change on PricingProvider: You cannot change `options.pricingPolicy` after setting it.'
    );
    expect(consoleWarn).toHaveBeenCalledWith(
      'Unsupported prop change on PricingProvider: You cannot change `options.detectedCurrencyOverride` after setting it.'
    );

    await act(() => deferred.resolve(mockPricing));
    expectContextValueSuccess(result.current);
    act(() => mockPricing._emitChange());
    expect(result.current).toEqual({
      type: 'success',
      pricing: mockPricing,
      changeVersion: 1,
    });
  });

  it('reports initialization errors after options change', async () => {
    consoleWarn.mockImplementation(() => {});
    const deferred = makeDeferred<stripeJs.Pricing>();
    mockStripe.initializePricing.mockReturnValue(deferred.promise);
    let optionsProp = defaultOptions;
    const {result, rerender} = renderHook(
      () => usePricingContext('usePricing'),
      {
        wrapper: ({children}) => (
          <PricingProvider stripe={mockStripe} options={optionsProp}>
            {children}
          </PricingProvider>
        ),
      }
    );

    optionsProp = {...defaultOptions, pricingPolicy: 'pricing_policy_456'};
    rerender();
    const error = new Error('initializePricing rejected');
    await act(() => deferred.reject(error));

    expect(result.current).toEqual({type: 'error', error});
    expect(mockStripe.initializePricing).toHaveBeenCalledTimes(1);
  });

  describe('initialization errors in StrictMode', () => {
    it('reports a rejected Stripe promise through context', async () => {
      const deferred = makeDeferred<stripeJs.Stripe | null>();
      const error = new Error('Failed to load Stripe.js');
      const {result} = renderHook(() => usePricingContext('usePricing'), {
        reactStrictMode: true,
        wrapper: ({children}) => (
          <PricingProvider stripe={deferred.promise} options={defaultOptions}>
            {children}
          </PricingProvider>
        ),
      });

      expect(result.current).toEqual({type: 'loading'});
      await act(() => deferred.reject(error));

      expect(result.current).toEqual({type: 'error', error});
      expect(mockStripe.initializePricing).not.toHaveBeenCalled();
    });

    it('reports an invalid resolved Stripe value through context', async () => {
      const deferred = makeDeferred<any>();
      const {result} = renderHook(() => usePricingContext('usePricing'), {
        reactStrictMode: true,
        wrapper: ({children}) => (
          <PricingProvider stripe={deferred.promise} options={defaultOptions}>
            {children}
          </PricingProvider>
        ),
      });

      await act(() => deferred.resolve({foo: 'bar'}));

      expect(result.current).toEqual({
        type: 'error',
        error: expect.any(Error),
      });
      if (result.current.type === 'error') {
        expect(result.current.error.message).toContain(
          'Invalid prop `stripe` supplied to `PricingProvider`'
        );
      }
      expect(mockStripe.initializePricing).not.toHaveBeenCalled();
    });

    describe('with a synchronous Stripe prop', () => {
      it('reports a synchronous initialization exception through context', async () => {
        const error = new Error('initializePricing threw');
        mockStripe.initializePricing.mockImplementation(() => {
          throw error;
        });
        const {result} = renderHook(() => usePricingContext('usePricing'), {
          reactStrictMode: true,
          wrapper: ({children}) => (
            <PricingProvider stripe={mockStripe} options={defaultOptions}>
              {children}
            </PricingProvider>
          ),
        });

        await waitFor(() =>
          expect(result.current).toEqual({type: 'error', error})
        );
        expect(mockStripe.initializePricing).toHaveBeenCalledTimes(1);
      });

      it('reports a rejected initialization promise through context', async () => {
        const deferred = makeDeferred();
        const error = new Error('initializePricing rejected');
        mockStripe.initializePricing.mockReturnValue(deferred.promise);
        const {result} = renderHook(() => usePricingContext('usePricing'), {
          reactStrictMode: true,
          wrapper: ({children}) => (
            <PricingProvider stripe={mockStripe} options={defaultOptions}>
              {children}
            </PricingProvider>
          ),
        });

        await waitFor(() =>
          expect(mockStripe.initializePricing).toHaveBeenCalledTimes(1)
        );
        expect(result.current).toEqual({type: 'loading'});
        await act(() => deferred.reject(error));

        expect(result.current).toEqual({type: 'error', error});
      });
    });

    describe('with a promised Stripe prop', () => {
      it('reports a synchronous initialization exception through context', async () => {
        const error = new Error('initializePricing threw');
        mockStripe.initializePricing.mockImplementation(() => {
          throw error;
        });
        const {result} = renderHook(() => usePricingContext('usePricing'), {
          reactStrictMode: true,
          wrapper: ({children}) => (
            <PricingProvider
              stripe={mockStripePromise}
              options={defaultOptions}
            >
              {children}
            </PricingProvider>
          ),
        });

        await waitFor(() =>
          expect(result.current).toEqual({type: 'error', error})
        );
        expect(mockStripe.initializePricing).toHaveBeenCalledTimes(1);
      });

      it('reports a rejected initialization promise through context', async () => {
        const deferred = makeDeferred();
        const error = new Error('initializePricing rejected');
        mockStripe.initializePricing.mockReturnValue(deferred.promise);
        const {result} = renderHook(() => usePricingContext('usePricing'), {
          reactStrictMode: true,
          wrapper: ({children}) => (
            <PricingProvider
              stripe={mockStripePromise}
              options={defaultOptions}
            >
              {children}
            </PricingProvider>
          ),
        });

        await waitFor(() =>
          expect(mockStripe.initializePricing).toHaveBeenCalledTimes(1)
        );
        expect(result.current).toEqual({type: 'loading'});
        await act(() => deferred.reject(error));

        expect(result.current).toEqual({type: 'error', error});
      });
    });
  });

  it('increments changeVersion for each pricing change', async () => {
    const {result} = renderHook(() => usePricingContext('usePricing'), {
      wrapper: ({children}) => (
        <PricingProvider stripe={mockStripe} options={defaultOptions}>
          {children}
        </PricingProvider>
      ),
    });
    await waitFor(() => expectContextValueSuccess(result.current));

    act(() => {
      mockPricing._emitChange();
      mockPricing._emitChange();
    });

    expect(result.current).toEqual({
      type: 'success',
      pricing: mockPricing,
      changeVersion: 2,
    });
  });

  it('keeps its change listener when options are replaced with equivalent values', async () => {
    let optionsProp: stripeJs.InitializePricingOptions = defaultOptions;
    const {result, rerender} = renderHook(
      () => usePricingContext('usePricing'),
      {
        wrapper: ({children}) => (
          <PricingProvider stripe={mockStripe} options={optionsProp}>
            {children}
          </PricingProvider>
        ),
      }
    );
    await waitFor(() => expectContextValueSuccess(result.current));

    optionsProp = {...defaultOptions};
    rerender();
    act(() => mockPricing._emitChange());

    expect(result.current).toEqual({
      type: 'success',
      pricing: mockPricing,
      changeVersion: 1,
    });
    expect(mockStripe.initializePricing).toHaveBeenCalledTimes(1);
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it('does not initialize if the Stripe promise resolves after unmount', async () => {
    const deferred = makeDeferred<stripeJs.Stripe | null>();
    const {unmount} = renderHook(() => usePricingContext('usePricing'), {
      wrapper: ({children}) => (
        <PricingProvider stripe={deferred.promise} options={defaultOptions}>
          {children}
        </PricingProvider>
      ),
    });

    unmount();
    await act(() => deferred.resolve(mockStripe));

    expect(mockStripe.initializePricing).not.toHaveBeenCalled();
  });

  it('does not attach a change listener if initialization resolves after unmount', async () => {
    const deferred = makeDeferred();
    mockStripe.initializePricing.mockReturnValue(deferred.promise);
    const {unmount} = renderHook(() => usePricingContext('usePricing'), {
      wrapper: ({children}) => (
        <PricingProvider stripe={mockStripe} options={defaultOptions}>
          {children}
        </PricingProvider>
      ),
    });
    expect(mockStripe.initializePricing).toHaveBeenCalledTimes(1);

    unmount();
    await act(() => deferred.resolve(mockPricing));

    expect(mockPricing._changeListeners.size).toBe(0);
  });
});
