import React from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {
  CheckoutForm,
  CheckoutFormProvider,
  useCheckout,
} from '../../src/checkout';

import '../styles/common.css';

const CheckoutFormExample = ({layout}) => {
  const checkoutState = useCheckout();

  if (checkoutState.type === 'error') {
    return <div>Error: {checkoutState.error.message}</div>;
  }

  const onConfirm = (event) => {
    if (checkoutState.type === 'success') {
      checkoutState.checkout.confirm({formConfirmEvent: event});
    }
  };

  return <CheckoutForm options={{layout}} onConfirm={onConfirm} />;
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
          <CheckoutFormExample layout={layout} />
        </CheckoutFormProvider>
      )}
    </>
  );
};

export default App;
