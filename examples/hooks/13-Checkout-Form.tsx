import type {ChangeEventHandler, SubmitEventHandler} from 'react';
import {useEffect, useState} from 'react';
import {Appearance, loadStripe, Stripe} from '@stripe/stripe-js';
import {
  CheckoutForm,
  CheckoutFormProps,
  CheckoutFormProvider,
  useCheckoutForm,
} from '../../src/checkout';

import '../styles/common.css';

type CheckoutFormLayout = NonNullable<CheckoutFormProps['options']>['layout'];

type CheckoutFormExampleProps = {
  layout: CheckoutFormLayout;
};

const CheckoutFormExample = ({layout}: CheckoutFormExampleProps) => {
  const checkoutState = useCheckoutForm();

  if (checkoutState.type === 'error') {
    return <div>Error: {checkoutState.error.message}</div>;
  }

  const onConfirm: CheckoutFormProps['onConfirm'] = (event) => {
    if (checkoutState.type === 'success') {
      checkoutState.checkout.confirm({formConfirmEvent: event});
    }
  };

  return <CheckoutForm options={{layout}} onConfirm={onConfirm} />;
};

const THEMES = ['stripe', 'flat', 'night'];
const LAYOUTS = ['expanded', 'compact'];

const App = () => {
  const [pk, setPK] = useState(
    window.sessionStorage.getItem('react-stripe-js-pk') || ''
  );
  const [clientSecret, setClientSecret] = useState<string | null>('');

  useEffect(() => {
    window.sessionStorage.setItem('react-stripe-js-pk', pk || '');
  }, [pk]);

  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>();
  const [theme, setTheme] = useState<Appearance['theme']>('stripe');
  const [layout, setLayout] = useState<CheckoutFormLayout>('expanded');

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    setStripePromise(
      loadStripe(pk, {
        betas: ['custom_checkout_habanero_1'],
      })
    );
  };

  const handleThemeChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setTheme(e.target.value as any);
  };

  const handleLayoutChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setLayout(e.target.value as any);
  };

  const handleUnload = () => {
    setStripePromise(null);
    setClientSecret(null);
  };

  console.log(stripePromise, clientSecret);

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label>
          CheckoutSession client_secret
          <input
            value={clientSecret || ''}
            onChange={(e) => setClientSecret(e.target.value)}
          />
        </label>
        <label>
          Publishable key
          <input value={pk} onChange={(e) => setPK(e.target.value)} />
        </label>
        <button style={{marginRight: 10}} type="submit">
          Load
        </button>
        <button type="button" onClick={handleUnload}>
          Unload
        </button>
        <label>
          Theme
          <select onChange={handleThemeChange}>
            {THEMES.map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </label>
        <label>
          Layout
          <select onChange={handleLayoutChange} value={layout}>
            {LAYOUTS.map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </label>
      </form>
      {stripePromise && clientSecret && (
        <CheckoutFormProvider
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {theme},
          }}
        >
          <CheckoutFormExample layout={layout} />
        </CheckoutFormProvider>
      )}
    </>
  );
};

export default App;
