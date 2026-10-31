import React from 'react';
import {renderToString} from 'react-dom/server.node';
import {hydrateRoot} from 'react-dom/client';
import {act, fireEvent, within} from '@testing-library/react';

import * as mocks from '../../test/mocks';
import {
  PricingProvider,
  useResolvedPrice,
  useCurrencySelection,
  usePricingToken,
} from '.';
import type {PricingProviderProps} from '.';

const Consumer = () => {
  const price = useResolvedPrice('price_123');
  const currency = useCurrencySelection();
  const {createPricingToken} = usePricingToken();
  const [tokenId, setTokenId] = React.useState('No token');

  if (price.loading || currency.loading) {
    return <p role="status">Loading</p>;
  }
  if (price.error || currency.error) {
    return <p role="alert">{(price.error || currency.error)?.message}</p>;
  }

  return (
    <>
      <p aria-label="Price currency">{price.data.currency}</p>
      <p aria-label="Selected currency">
        {currency.data.selectedCurrency.currency}
      </p>
      <p>{tokenId}</p>
      <button onClick={() => currency.setSelectedCurrency('eur')}>
        Select EUR
      </button>
      <button onClick={async () => setTokenId((await createPricingToken()).id)}>
        Create token
      </button>
    </>
  );
};

const App = ({stripe}: Pick<PricingProviderProps, 'stripe'>) => (
  <PricingProvider stripe={stripe} options={{pricingPolicy: 'policy_123'}}>
    <Consumer />
  </PricingProvider>
);

test('hydrates loading output, refreshes both reads, and creates a token on demand', async () => {
  const stripe = mocks.mockStripe();
  const pricing = mocks.mockPricing();
  stripe.initializePricing.mockResolvedValue(pricing);
  pricing.setSelectedCurrency.mockImplementation(async (currency: string) => {
    pricing.getSelectedCurrency.mockResolvedValue({currency});
    pricing.resolvePrice.mockResolvedValue({
      currency,
      unitAmount: null,
      unitAmountDecimal: null,
      minorUnitsAmountDivisor: 100,
    });
    pricing.emitChange();
  });
  const container = document.createElement('div');
  container.innerHTML = renderToString(<App stripe={null} />);
  document.body.appendChild(container);
  const screen = within(container);
  const onRecoverableError = jest.fn();
  let root: ReturnType<typeof hydrateRoot> | undefined;

  try {
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    await act(async () => {
      root = hydrateRoot(container, <App stripe={stripe as any} />, {
        onRecoverableError,
      });
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Price currency')).toHaveTextContent('usd');
    expect(screen.getByLabelText('Selected currency')).toHaveTextContent('usd');
    expect(stripe.initializePricing).toHaveBeenCalledTimes(1);
    expect(pricing.resolvePrice).toHaveBeenCalledTimes(1);
    expect(pricing.getAvailableCurrencies).toHaveBeenCalledTimes(1);
    expect(pricing.getSelectedCurrency).toHaveBeenCalledTimes(1);
    expect(pricing.createPricingToken).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Select EUR'}));
    });
    expect(screen.getByLabelText('Price currency')).toHaveTextContent('eur');
    expect(screen.getByLabelText('Selected currency')).toHaveTextContent('eur');
    expect(pricing.setSelectedCurrency).toHaveBeenCalledWith('eur');
    expect(pricing.resolvePrice).toHaveBeenCalledTimes(2);
    expect(pricing.getAvailableCurrencies).toHaveBeenCalledTimes(2);
    expect(pricing.getSelectedCurrency).toHaveBeenCalledTimes(2);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', {name: 'Create token'}));
    });
    expect(screen.getByText('prctok_test')).toBeInTheDocument();
    expect(pricing.createPricingToken).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => root?.unmount());
    container.remove();
  }
  expect(pricing.changeListeners.size).toBe(0);
});
