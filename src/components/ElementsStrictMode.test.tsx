import React from 'react';
import {render, act} from '@testing-library/react';

import {Elements, useElements, ElementsConsumer} from './Elements';
import * as mocks from '../../test/mocks';

describe('Elements', () => {
  let mockStripe: any;
  let mockStripePromise: any;
  let mockElements: any;
  let consoleWarn: any;

  beforeEach(() => {
    mockStripe = mocks.mockStripe();
    mockStripePromise = Promise.resolve(mockStripe);
    mockElements = mocks.mockElements();
    mockStripe.elements.mockReturnValue(mockElements);

    jest.spyOn(console, 'error');
    jest.spyOn(console, 'warn');
    consoleWarn = console.warn;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('only creates elements once in Strict Mode', () => {
    const TestComponent = () => {
      const _ = useElements();
      return <div />;
    };

    render(
      <React.StrictMode>
        <Elements stripe={mockStripe}>
          <TestComponent />
        </Elements>
      </React.StrictMode>
    );

    expect(mockStripe.elements).toHaveBeenCalledTimes(1);
  });

  test('provides elements and stripe with the ElementsConsumer component in Strict Mode', () => {
    expect.assertions(2);

    render(
      <React.StrictMode>
        <Elements stripe={mockStripe}>
          <ElementsConsumer>
            {(ctx) => {
              expect(ctx.elements).toBe(mockElements);
              expect(ctx.stripe).toBe(mockStripe);

              return null;
            }}
          </ElementsConsumer>
        </Elements>
      </React.StrictMode>
    );
  });

  test('does not allow updates to options after the Stripe Promise is set in StrictMode', async () => {
    // Silence console output so test output is less noisy
    consoleWarn.mockImplementation(() => {});

    const {rerender} = render(
      <React.StrictMode>
        <Elements stripe={mockStripePromise} options={{foo: 'foo'} as any} />
      </React.StrictMode>
    );

    rerender(
      <React.StrictMode>
        <Elements stripe={mockStripePromise} options={{bar: 'bar'} as any} />
      </React.StrictMode>
    );

    await act(() => mockStripePromise);

    expect(consoleWarn).toHaveBeenCalledTimes(1);
    expect(consoleWarn.mock.calls[0][0]).toContain(
      'Unsupported prop change on Elements'
    );
    expect(mockStripe.elements).toHaveBeenCalledTimes(1);
    expect(mockStripe.elements).toHaveBeenCalledWith({foo: 'foo'});
  });
});
