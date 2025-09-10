import React from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {useStripe} from '../../src';
import {
  PaymentElement,
  CheckoutProvider,
  useCheckout,
  BillingAddressElement,
} from '../../src/checkout';

import '../styles/common.css';

const CustomerDetails = ({phoneNumber, setPhoneNumber, email, setEmail}) => {
  const handlePhoneNumberChange = (event) => {
    setPhoneNumber(event.target.value);
  };
  const stripe = useStripe();

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
  const checkoutState = useCheckout();
  const [status, setStatus] = React.useState();
  const [loading, setLoading] = React.useState(false);
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [email, setEmail] = React.useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (checkoutState.type === 'loading') {
      return <div>Loading...</div>;
    } else if (checkoutState.type === 'error') {
      return <div>Error: {checkoutState.error.message}</div>;
    }

    try {
      setLoading(true);
      await checkoutState.checkout.confirm({
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

  const buttonDisabled = checkoutState.type !== 'success' || loading;

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
      <BillingAddressElement />
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
    setStripePromise(loadStripe(pk));
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
