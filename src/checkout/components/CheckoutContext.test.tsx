import React from 'react';
import {act, render, renderHook} from '@testing-library/react';

import {
  CheckoutContext,
  CheckoutState,
  useCheckout,
  useCheckoutElements,
  useCheckoutForm,
} from './CheckoutContext';
import {CheckoutElementsProvider} from './CheckoutElementsProvider';
import {CheckoutFormProvider} from './CheckoutFormProvider';
import * as mocks from '../../../test/mocks';
import makeDeferred from '../../../test/makeDeferred';

const wrapper = ({
  state,
  children,
}: React.PropsWithChildren<{state: CheckoutState}>) => (
  <CheckoutContext.Provider value={{checkoutState: state}}>
    {children}
  </CheckoutContext.Provider>
);

const hookCases = [
  {name: 'useCheckoutForm', useHook: useCheckoutForm, sdkKind: 'form' as const},
  {
    name: 'useCheckoutElements',
    useHook: useCheckoutElements,
    sdkKind: 'elements' as const,
  },
  {name: 'useCheckout (form)', useHook: useCheckout, sdkKind: 'form' as const},
  {
    name: 'useCheckout (elements)',
    useHook: useCheckout,
    sdkKind: 'elements' as const,
  },
];

hookCases.forEach(({name, useHook, sdkKind}) => {
  describe(name, () => {
    const makeSuccessState = () =>
      ({
        type: 'success',
        sdkKind,
        sdk: mocks.mockCheckoutSdk(),
        checkoutActions: mocks.mockCheckoutActions(),
        session: mocks.mockCheckoutSession(),
      } as unknown as Extract<CheckoutState, {type: 'success'}>);

    it.each(['loading', 'success', 'error'])(
      'keeps the %s result stable on unrelated renders',
      (type) => {
        const state: CheckoutState =
          type === 'success'
            ? makeSuccessState()
            : type === 'loading'
            ? {type: 'loading', sdk: null}
            : {type: 'error', error: {message: 'Unable to load checkout'}};
        const onResultChange = jest.fn();
        const {result, rerender} = renderHook(
          () => {
            const checkoutResult = useHook();
            React.useEffect(() => {
              onResultChange(checkoutResult);
            }, [checkoutResult]);
            return checkoutResult;
          },
          {
            wrapper: ({children}) => wrapper({state, children}),
          }
        );
        const initialResult = result.current;

        // The wrapper creates a new context value, but checkout state is unchanged.
        rerender();

        expect(result.current).toBe(initialResult);
        if (
          result.current.type === 'success' &&
          initialResult.type === 'success'
        ) {
          expect(result.current.checkout).toBe(initialResult.checkout);
        }
        expect(onResultChange).toHaveBeenCalledTimes(1);
      }
    );

    it('updates the result on state transitions and session changes', () => {
      let state: CheckoutState = {type: 'loading', sdk: null};
      const {result, rerender} = renderHook(() => useHook(), {
        wrapper: ({children}) => wrapper({state, children}),
      });
      expect(result.current).toEqual({type: 'loading'});

      const successState = makeSuccessState();
      state = successState;
      rerender();
      const initialSuccess = result.current;
      if (initialSuccess.type !== 'success') {
        throw new Error('Expected checkout to finish loading');
      }
      expect(initialSuccess.checkout.currency).toBe('usd');

      const updatedState = {
        ...successState,
        session: {...successState.session, currency: 'eur'},
      };
      state = updatedState;
      rerender();
      const updatedSuccess = result.current;
      if (updatedSuccess.type !== 'success') {
        throw new Error('Expected checkout to remain successful');
      }
      expect(updatedSuccess).not.toBe(initialSuccess);
      expect(updatedSuccess.checkout).not.toBe(initialSuccess.checkout);
      expect(updatedSuccess.checkout.currency).toBe('eur');
      expect(updatedSuccess.checkout.confirm).toBe(
        initialSuccess.checkout.confirm
      );

      rerender();
      expect(result.current).toBe(updatedSuccess);

      const error = {message: 'Unable to update checkout'};
      state = {type: 'error', error};
      rerender();
      expect(result.current).toEqual({type: 'error', error});
    });
  });
});

const providerCases = [
  {
    name: 'CheckoutFormProvider',
    Provider: CheckoutFormProvider,
    useHook: useCheckoutForm,
    initMethod: 'initCheckoutFormSdk' as const,
  },
  {
    name: 'CheckoutElementsProvider',
    Provider: CheckoutElementsProvider,
    useHook: useCheckoutElements,
    initMethod: 'initCheckoutElementsSdk' as const,
  },
];

providerCases.forEach(({name, Provider, useHook, initMethod}) => {
  it(`${name} preserves hook identity across parent renders and refreshes it on SDK changes`, async () => {
    const stripe: any = mocks.mockStripe();
    const sdk = mocks.mockCheckoutSdk();
    const actions = mocks.mockCheckoutActions();
    const session = mocks.mockCheckoutSession();
    const loadActions = makeDeferred();
    stripe[initMethod].mockReturnValue(sdk);
    sdk.loadActions.mockReturnValue(loadActions.promise);
    actions.getSession.mockReturnValue(session);

    let onChange: (nextSession: typeof session) => void = () => {
      throw new Error('The SDK change listener has not been attached');
    };
    sdk.on.mockImplementation((event, listener) => {
      if (event === 'change') {
        onChange = listener;
      }
    });

    let latestResult!: ReturnType<typeof useHook>;
    const Consumer = () => {
      latestResult = useHook();
      return (
        <div>
          {latestResult.type === 'success'
            ? latestResult.checkout.currency
            : latestResult.type}
        </div>
      );
    };
    const App = () => (
      <Provider stripe={stripe} options={{clientSecret: 'cs_123'}}>
        <Consumer />
      </Provider>
    );

    const view = render(<App />);
    await act(() => loadActions.resolve({type: 'success', actions}));
    expect(view.getByText('usd')).toBeInTheDocument();
    const initialResult = latestResult;
    if (initialResult.type !== 'success') {
      throw new Error('Expected checkout to finish loading');
    }

    view.rerender(<App />);
    expect(latestResult).toBe(initialResult);

    act(() => {
      // An SDK change must invalidate the cache even if it reuses the session.
      session.currency = 'eur';
      onChange(session);
    });
    expect(view.getByText('eur')).toBeInTheDocument();
    const updatedResult = latestResult;
    if (updatedResult.type !== 'success') {
      throw new Error('Expected checkout to remain successful');
    }
    expect(updatedResult).not.toBe(initialResult);
    expect(updatedResult.checkout).not.toBe(initialResult.checkout);

    view.rerender(<App />);
    expect(latestResult).toBe(updatedResult);
  });
});
