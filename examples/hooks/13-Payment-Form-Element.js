import React from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {
  CheckoutForm,
  CheckoutFormProvider,
  useCheckout,
} from '../../src/checkout';

import '../styles/common.css';

const CheckoutPaymentForm = ({layout}) => {
  const checkoutState = useCheckout();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await checkoutState.checkout.confirm({
        returnUrl: window.location.href,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (event) => {
    console.log('CheckoutForm change:', event);
  };

  const handleConfirm = (event) => {
    console.log('CheckoutForm confirm:', event);
  };

  const handleCancel = (event) => {
    console.log('CheckoutForm cancel:', event);
  };

  const handleReady = (element) => {
    console.log('CheckoutForm ready:', element);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CheckoutForm
        options={{layout}}
        onChange={handleChange}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onReady={handleReady}
      />
    </form>
  );
};

const THEMES = ['stripe', 'flat', 'night'];
const LAYOUTS = ['expanded', 'compact'];

const App = () => {
  const [pk, setPK] = React.useState(
    window.sessionStorage.getItem('react-stripe-js-pk') || ''
  );
  const [clientSecret, setClientSecret] = React.useState('');

  React.useEffect(() => {
    window.sessionStorage.setItem('react-stripe-js-pk', pk || '');
  }, [pk]);

  const [stripePromise, setStripePromise] = React.useState();
  const [theme, setTheme] = React.useState('stripe');
  const [layout, setLayout] = React.useState('expanded');

  const handleSubmit = (e) => {
    e.preventDefault();
    setStripePromise(
      loadStripe(pk, {
        betas: ['custom_checkout_habanero_1'],
      })
    );
  };

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  const handleLayoutChange = (e) => {
    setLayout(e.target.value);
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
            value={clientSecret}
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
          <CheckoutPaymentForm layout={layout} />
        </CheckoutFormProvider>
      )}
    </>
  );
};

export default App;
