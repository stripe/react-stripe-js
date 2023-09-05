import React from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {
  PaymentElement,
  useStripe,
  CustomCheckoutProvider,
  useCustomCheckout,
  AddressElement,
} from '../../src';

import '../styles/common.css';

const CustomerDetails = () => {
  const {
    phoneNumber,
    updatePhoneNumber,
    email,
    updateEmail,
  } = useCustomCheckout();

  const handlePhoneNumberChange = (event) => {
    updatePhoneNumber(event.target.value);
  };

  const handleEmailChange = (event) => {
    updateEmail(event.target.value);
  };

  return (
    <div>
      <h3>Customer Details</h3>
      <label htmlFor="phoneNumber">Phone Number</label>
      <input
        id="phoneNumber"
        name="phoneNumber"
        type="text"
        autoComplete="off"
        onChange={handlePhoneNumberChange}
        value={phoneNumber || ''}
      />
      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        onChange={handleEmailChange}
        value={email || ''}
      />
    </div>
  );
};

const CheckoutForm = () => {
  const customCheckout = useCustomCheckout();
  const [status, setStatus] = React.useState();
  const [loading, setLoading] = React.useState(false);
  const stripe = useStripe();

  React.useEffect(() => {
    const {confirmationRequirements} = customCheckout || {};
    setStatus(
      confirmationRequirements && confirmationRequirements.length > 0
        ? `Missing: ${confirmationRequirements.join(', ')}`
        : ''
    );
  }, [customCheckout, setStatus]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !customCheckout) {
      return;
    }

    const {canConfirm, confirm} = customCheckout;
    if (!canConfirm) {
      return;
    }

    try {
      setLoading(true);
      await confirm({return_url: window.location.href});
      setLoading(false);
    } catch (err) {
      console.error(err);
      setStatus(err.message);
    }
  };

  const buttonDisabled =
    !stripe || !customCheckout || !customCheckout.canConfirm || loading;

  return (
    <form onSubmit={handleSubmit}>
      <CustomerDetails />
      <h3>Payment Dettails</h3>
      <PaymentElement />
      <h3>Billing Details</h3>
      <AddressElement options={{mode: 'billing'}} />
      <button type="submit" disabled={buttonDisabled}>
        {loading ? 'Processing...' : 'Pay'}
      </button>
      {status && <p>{status}</p>}
    </form>
  );
};

const THEMES = ['stripe', 'flat', 'night'];

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setStripePromise(
      loadStripe(pk, {
        betas: ['custom_checkout_beta_1'],
      })
    );
  };

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  const handleUnload = () => {
    setStripePromise(null);
    setClientSecret(null);
  };

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
          Publishable key{' '}
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
      </form>
      {stripePromise && clientSecret && (
        <CustomCheckoutProvider
          stripe={stripePromise}
          options={{clientSecret, elementsOptions: {appearance: {theme}}}}
        >
          <CheckoutForm />
        </CustomCheckoutProvider>
      )}
    </>
  );
};

export default App;
