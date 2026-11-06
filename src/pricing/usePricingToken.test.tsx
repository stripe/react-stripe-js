import React from 'react';
import {act, renderHook} from '@testing-library/react';
import * as stripeJs from '@stripe/stripe-js';

import makeDeferred from '../../test/makeDeferred';
import * as mocks from '../../test/mocks';

import {PricingContext, PricingState} from './PricingContext';
import {PricingProvider} from './PricingProvider';
import {usePricingToken} from './usePricingToken';

describe('usePricingToken', () => {
  let mockStripe: any;
  let mockPricing: any;
  let pricingState: PricingState;
  let pricingPromise: Promise<stripeJs.Pricing>;
  const options = {pricingPolicy: 'pricing_policy_123'};

  const ContextWrapper = ({children}: React.PropsWithChildren) => (
    <PricingContext.Provider value={{state: pricingState, pricingPromise}}>
      {children}
    </PricingContext.Provider>
  );

  const ProviderWrapper = ({children}: React.PropsWithChildren) => (
    <PricingProvider stripe={mockStripe} options={options}>
      {children}
    </PricingProvider>
  );

  beforeEach(() => {
    mockStripe = mocks.mockStripe();
    mockPricing = mocks.mockPricing();
    mockPricing.createPricingToken.mockResolvedValue({id: 'prctok_123'});
    mockStripe.initializePricing.mockResolvedValue(mockPricing);
    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 0};
    pricingPromise = Promise.resolve(mockPricing);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requires a PricingProvider and names the hook in the error', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => usePricingToken())).toThrow(
      'Could not find Pricing context. You need to wrap the part of your app that calls usePricingToken() in a <PricingProvider>.'
    );
  });

  it('waits while loading and creates a token after initialization', async () => {
    const initialized = makeDeferred<stripeJs.Pricing>();
    mockStripe.initializePricing.mockReturnValue(initialized.promise);
    const {result} = renderHook(() => usePricingToken(), {
      wrapper: ProviderWrapper,
    });

    const createPricingToken = result.current.createPricingToken;
    const pending = createPricingToken();
    const settled = jest.fn();
    pending.then(settled, settled);
    await act(async () => {});
    expect(settled).not.toHaveBeenCalled();
    expect(mockPricing.createPricingToken).not.toHaveBeenCalled();

    await act(() => initialized.resolve(mockPricing));

    await expect(pending).resolves.toEqual({
      id: 'prctok_123',
    });
    expect(mockPricing.createPricingToken).toHaveBeenCalledTimes(1);
  });

  it('rejects pending and subsequent token calls with the initialization error', async () => {
    const initialized = makeDeferred<stripeJs.Pricing>();
    mockStripe.initializePricing.mockReturnValue(initialized.promise);
    const {result} = renderHook(() => usePricingToken(), {
      wrapper: ProviderWrapper,
    });
    const error = new Error('Initialization failed');
    const rejected = expect(result.current.createPricingToken()).rejects.toBe(
      error
    );

    await act(() => initialized.reject(error));

    await rejected;
    await expect(result.current.createPricingToken()).rejects.toBe(error);
    expect(mockPricing.createPricingToken).not.toHaveBeenCalled();
  });

  it('creates a requested token after its consumer unmounts while the provider stays mounted', async () => {
    const initialized = makeDeferred<stripeJs.Pricing>();
    mockStripe.initializePricing.mockReturnValue(initialized.promise);
    let showConsumer = true;
    const {result, rerender} = renderHook(() => usePricingToken(), {
      wrapper: ({children}) => (
        <ProviderWrapper>{showConsumer ? children : null}</ProviderWrapper>
      ),
    });
    const pending = result.current.createPricingToken();

    showConsumer = false;
    rerender();
    expect(mockPricing.createPricingToken).not.toHaveBeenCalled();
    await act(() => initialized.resolve(mockPricing));

    await expect(pending).resolves.toEqual({id: 'prctok_123'});
    expect(mockPricing.createPricingToken).toHaveBeenCalledTimes(1);
  });

  it('only creates tokens on explicit calls, including in StrictMode and after changes', async () => {
    const {result, rerender} = renderHook(() => usePricingToken(), {
      reactStrictMode: true,
      wrapper: ContextWrapper,
    });
    const createPricingToken = result.current.createPricingToken;

    rerender();
    pricingState = {type: 'success', pricing: mockPricing, changeVersion: 1};
    rerender();
    expect(result.current.createPricingToken).toBe(createPricingToken);
    expect(mockPricing.createPricingToken).not.toHaveBeenCalled();

    await expect(createPricingToken()).resolves.toEqual({id: 'prctok_123'});
    mockPricing.createPricingToken.mockResolvedValueOnce({id: 'prctok_456'});
    await expect(createPricingToken()).resolves.toEqual({id: 'prctok_456'});
    expect(mockPricing.createPricingToken).toHaveBeenCalledTimes(2);
    expect(mockPricing.createPricingToken).toHaveBeenCalledWith();
  });

  it('propagates token creation errors and allows another attempt', async () => {
    const error = new Error('Token creation failed');
    mockPricing.createPricingToken.mockRejectedValueOnce(error);
    const {result} = renderHook(() => usePricingToken(), {
      wrapper: ContextWrapper,
    });

    await expect(result.current.createPricingToken()).rejects.toBe(error);
    await expect(result.current.createPricingToken()).resolves.toEqual({
      id: 'prctok_123',
    });
    expect(mockPricing.createPricingToken).toHaveBeenCalledTimes(2);
  });
});
