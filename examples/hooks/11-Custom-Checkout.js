import React from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {
  PaymentElement,
  useStripe,
  CheckoutProvider,
  useCheckout,
  AddressElement,
} from '../../src';

import '../styles/common.css';

const CustomerDetails = ({phoneNumber, setPhoneNumber, email, setEmail}) => {
  const handlePhoneNumberChange = (event) => {
    setPhoneNumber(event.target.value);
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
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
  const checkout = useCheckout();
  const [status, setStatus] = React.useState();
  const [loading, setLoading] = React.useState(false);
  const stripe = useStripe();
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [email, setEmail] = React.useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !checkout) {
      return;
    }

    try {
      setLoading(true);
      await checkout.confirm({
        email,
        phoneNumber,
        returnUrl: window.location.href,
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setStatus(err.message);
    }
  };

  const buttonDisabled = !stripe || !checkout || loading;

  return (
    <form onSubmit={handleSubmit}>
      <CustomerDetails
        email={email}
        setEmail={setEmail}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
      />
      <h3>Payment Details</h3>
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
        betas: ['custom_checkout_beta_6'],
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
        <CheckoutProvider
          stripe={stripePromise}
          options={{
            fetchClientSecret: async () => clientSecret,
            elementsOptions: {appearance: {theme}},
          }}
        >
          <CheckoutForm />
        </CheckoutProvider>
      )}
    </>
  );
};

export default App;
