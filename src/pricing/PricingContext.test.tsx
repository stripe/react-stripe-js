import {renderHook} from '@testing-library/react';

import {normalizeError, usePricingContext} from './PricingContext';

describe('Pricing context', () => {
  it('requires a provider and identifies the calling hook', () => {
    expect(() => renderHook(() => usePricingContext('example'))).toThrow(
      'Could not find Pricing context. You need to wrap the part of your app that calls example() in a <PricingProvider>.'
    );
  });

  it('preserves Errors and normalizes other rejection values', () => {
    const error = new Error('original');
    expect(normalizeError(error)).toBe(error);
    expect(normalizeError({message: 'message'})).toEqual(new Error('message'));
    expect(normalizeError('failure')).toEqual(new Error('failure'));
    expect(normalizeError(null)).toEqual(new Error('null'));
    expect(normalizeError({message: 123})).toEqual(
      new Error('[object Object]')
    );
  });
});
