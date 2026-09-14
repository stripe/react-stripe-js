import React from 'react';
import {act, render} from '@testing-library/react';
import {renderToString} from 'react-dom/server';

import * as CheckoutContextModule from './CheckoutContext';
import {CheckoutFormProvider} from './CheckoutFormProvider';
import {CheckoutElementsProvider} from './CheckoutElementsProvider';
import createElementComponent from '../../components/createElementComponent';
import {Elements} from '../../components/Elements';
import {useStripe} from '../../components/useStripe';
import {CheckoutFormProps, PaymentElementProps} from '../../types';
import * as mocks from '../../../test/mocks';
import makeDeferred from '../../../test/makeDeferred';

const providerCases = [
  {
    name: 'CheckoutFormProvider',
    Provider: CheckoutFormProvider,
    useCheckout: CheckoutContextModule.useCheckoutForm,
    initMethod: 'initCheckoutFormSdk' as const,
    createMethod: 'createForm' as const,
    elementType: 'paymentForm' as const,
    initialOptions: {layout: 'expanded' as const},
    updatedOptions: {layout: 'compact' as const},
  },
  {
    name: 'CheckoutElementsProvider',
    Provider: CheckoutElementsProvider,
    useCheckout: CheckoutContextModule.useCheckoutElements,
    initMethod: 'initCheckoutElementsSdk' as const,
    createMethod: 'createPaymentElement' as const,
    elementType: 'payment' as const,
    initialOptions: {layout: 'tabs' as const},
    updatedOptions: {layout: 'accordion' as const},
  },
];

providerCases.forEach(
  ({
    name,
    Provider,
    useCheckout,
    initMethod,
    createMethod,
    elementType,
    initialOptions,
    updatedOptions,
  }) => {
    describe(name, () => {
      // Element and StripeConsumer are memoized to exclude parent-driven renders;
      // context updates still propagate through React.memo.
      const Element = React.memo(
        createElementComponent(elementType, false) as React.FunctionComponent<{
          options?:
            | CheckoutFormProps['options']
            | PaymentElementProps['options'];
          onChange?: (event: unknown) => void;
        }>
      );
      const providerOptions = {clientSecret: 'cs_123'};

      const setup = () => {
        const stripe: any = mocks.mockStripe();
        const sdk = mocks.mockCheckoutSdk();
        const element = {...mocks.mockElement(), off: jest.fn()};
        const actions = mocks.mockCheckoutActions();
        const session = mocks.mockCheckoutSession();
        const loadActions = makeDeferred();
        stripe[initMethod].mockReturnValue(sdk);
        sdk[createMethod].mockReturnValue(element);
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

        return {
          stripe,
          sdk,
          element,
          session,
          loadActions,
          finishLoading: () => loadActions.resolve({type: 'success', actions}),
          changeSession: () => onChange(session),
        };
      };

      afterEach(() => {
        jest.restoreAllMocks();
      });

      describe.each([false, true])('StrictMode: %s', (strictMode) => {
        const Wrapper = strictMode ? React.StrictMode : React.Fragment;

        it.each(['sync', 'async'])(
          'skips SDK-only renders on session updates with %s Stripe',
          async (stripeMode) => {
            const {
              stripe,
              sdk,
              element,
              session,
              finishLoading,
              changeSession,
            } = setup();
            const stripePromise = makeDeferred();
            // This spy relies on ts-jest's CommonJS import property lookups.
            // Native ESM tests would need a different render probe.
            const contextHook = jest.spyOn(
              CheckoutContextModule,
              'useElementsOrCheckoutContextWithUseCase'
            );
            // Count actual Element renders, not just its parent's renders.
            const elementRenderCount = () =>
              contextHook.mock.calls.filter(([useCase]) =>
                useCase.startsWith('mounts ')
              ).length;
            const stripeRender = jest.fn();
            const StripeConsumer = React.memo(() => {
              stripeRender(useStripe());
              return null;
            });
            StripeConsumer.displayName = 'StripeConsumer';
            const SessionConsumer = () => {
              const result = useCheckout();
              const legacyResult = CheckoutContextModule.useCheckout();
              return (
                <>
                  <span data-testid="session">
                    {result.type === 'success'
                      ? result.checkout.currency
                      : result.type}
                  </span>
                  <span data-testid="legacy-session">
                    {legacyResult.type === 'success'
                      ? legacyResult.checkout.currency
                      : legacyResult.type}
                  </span>
                </>
              );
            };

            const view = render(
              <Wrapper>
                <Provider
                  stripe={
                    stripeMode === 'sync' ? stripe : stripePromise.promise
                  }
                  options={providerOptions}
                >
                  <Element />
                  <StripeConsumer />
                  <SessionConsumer />
                </Provider>
              </Wrapper>
            );

            if (stripeMode === 'async') {
              expect(stripeRender).toHaveBeenLastCalledWith(null);
              expect(element.mount).not.toHaveBeenCalled();
              await act(() => stripePromise.resolve(stripe));
            }

            // The Element must mount as soon as the SDK exists, without waiting
            // for loadActions to publish the first session.
            expect(element.mount).toHaveBeenCalledTimes(1);
            expect(stripeRender).toHaveBeenLastCalledWith(stripe);
            expect(view.getByTestId('session')).toHaveTextContent('loading');
            const initialElementRenders = elementRenderCount();
            const initialStripeRenders = stripeRender.mock.calls.length;

            await act(finishLoading);
            expect(view.getByTestId('session')).toHaveTextContent('usd');
            expect(view.getByTestId('legacy-session')).toHaveTextContent('usd');
            expect(elementRenderCount()).toBe(initialElementRenders);
            expect(stripeRender).toHaveBeenCalledTimes(initialStripeRenders);

            act(() => {
              // Session consumers must update even when the SDK reuses the object.
              session.currency = 'eur';
              changeSession();
            });
            expect(view.getByTestId('session')).toHaveTextContent('eur');
            expect(view.getByTestId('legacy-session')).toHaveTextContent('eur');
            expect(elementRenderCount()).toBe(initialElementRenders);
            expect(stripeRender).toHaveBeenCalledTimes(initialStripeRenders);
            expect(sdk[createMethod]).toHaveBeenCalledTimes(1);
            expect(element.mount).toHaveBeenCalledTimes(1);
            expect(element.update).not.toHaveBeenCalled();

            view.unmount();
            expect(element.destroy).toHaveBeenCalledTimes(1);
          }
        );

        it('still updates Element options and callbacks after a session change', async () => {
          const {stripe, element, finishLoading, changeSession} = setup();
          const onChange = jest.fn();
          const nextOnChange = jest.fn();
          let onElementChange: (event: unknown) => void = () => {
            throw new Error(
              'The Element change listener has not been attached'
            );
          };
          element.on.mockImplementation((event, listener) => {
            if (event === 'change') {
              onElementChange = listener;
            }
          });
          const tree = (
            options: typeof initialOptions | typeof updatedOptions,
            callback: typeof onChange
          ) => (
            <Wrapper>
              <Provider stripe={stripe} options={providerOptions}>
                <Element options={options} onChange={callback} />
              </Provider>
            </Wrapper>
          );
          const view = render(tree(initialOptions, onChange));
          await act(finishLoading);
          act(changeSession);

          const initialSubscriptions = element.on.mock.calls.length;
          act(() => onElementChange({complete: false}));
          expect(onChange).toHaveBeenCalledWith({complete: false});

          view.rerender(tree(updatedOptions, nextOnChange));
          expect(element.update).toHaveBeenCalledWith(updatedOptions);
          act(() => onElementChange({complete: true}));
          expect(nextOnChange).toHaveBeenCalledWith({complete: true});
          expect(onChange).toHaveBeenCalledTimes(1);
          expect(element.on).toHaveBeenCalledTimes(initialSubscriptions);
          expect(element.off).not.toHaveBeenCalled();
          expect(element.mount).toHaveBeenCalledTimes(1);
        });

        it('keeps Stripe available but does not create new Elements after an initialization error', async () => {
          const {stripe, sdk, element, loadActions} = setup();
          const stripeRender = jest.fn();
          const StripeConsumer = () => {
            stripeRender(useStripe());
            return null;
          };
          const SessionConsumer = () => <span>{useCheckout().type}</span>;
          const tree = (showConsumers: boolean) => (
            <Wrapper>
              <Provider stripe={stripe} options={providerOptions}>
                <SessionConsumer />
                {showConsumers && (
                  <>
                    <StripeConsumer />
                    <Element />
                  </>
                )}
              </Provider>
            </Wrapper>
          );
          const view = render(tree(false));
          await act(() =>
            loadActions.reject(new Error('Unable to load checkout'))
          );
          expect(view.getByText('error')).toBeInTheDocument();

          view.rerender(tree(true));
          expect(stripeRender).toHaveBeenLastCalledWith(stripe);
          expect(sdk[createMethod]).not.toHaveBeenCalled();
          expect(element.mount).not.toHaveBeenCalled();
        });
      });

      it('renders the server wrapper without initializing a supplied Stripe instance', () => {
        const {stripe} = setup();
        const ServerElement = createElementComponent(elementType, true);
        const stripeRender = jest.fn();
        const StripeConsumer = () => {
          stripeRender(useStripe());
          return null;
        };
        expect(
          renderToString(
            <Provider stripe={stripe} options={providerOptions}>
              <ServerElement id="checkout-element" />
              <StripeConsumer />
            </Provider>
          )
        ).toContain('<div id="checkout-element"></div>');
        expect(stripeRender).toHaveBeenLastCalledWith(null);
        expect(stripe[initMethod]).not.toHaveBeenCalled();
      });

      it.each(['stripe', 'element'])(
        'rejects mixed providers for %s consumers even before initialization',
        (consumer) => {
          jest.spyOn(console, 'error').mockImplementation(() => {});
          const StripeConsumer = () => {
            useStripe();
            return null;
          };
          expect(() =>
            render(
              <Elements stripe={null}>
                <Provider stripe={null} options={providerOptions}>
                  {consumer === 'stripe' ? <StripeConsumer /> : <Element />}
                </Provider>
              </Elements>
            )
          ).toThrow('in both a checkout provider and <Elements> provider');
        }
      );
    });
  }
);
