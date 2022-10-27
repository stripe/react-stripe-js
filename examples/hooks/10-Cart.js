// This example shows you how to set up React Stripe.js and use Elements.
// Learn how to use the Cart Element to store your customers purchases using the official Stripe docs.
// https://stripe.com/docs/elements/cart-element

import React from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {
  CartElement,
  Elements,
  useCartElement,
  useCartElementState,
} from '../../src';

import '../styles/common.css';

const ProductPage = ({options, productId}) => {
  const cartElement = useCartElement();
  const cartElementState = useCartElementState();

  const handleReady = (event) => {
    console.log(event?.lineItems?.count);
  };

  const handleChange = (event) => {
    console.log(event?.lineItems?.count);
  };

  const handleCheckout = (event) => {
    console.log(event);
    if (!cartElement) return;
    // redirect to Checkout page would go here
    cartElement.cancelCheckout('Error message here');
  };

  const handleLineItemClick = (event) => {
    // calling preventDefault blocks native link redirect
    event.preventDefault();
    console.log(event.url);
  };

  const handleShow = () => {
    if (!cartElement) return;
    cartElement.show();
  };

  const handleAddLineItem = () => {
    if (!cartElement) return;
    cartElement.addLineItem({product: productId});
  };

  return (
    <div>
      <button type="button" onClick={handleAddLineItem}>
        Add line item
      </button>
      <button type="button" onClick={handleShow}>
        View cart ({cartElementState?.lineItems?.count || 0})
      </button>
      <CartElement
        options={options}
        onReady={handleReady}
        onChange={handleChange}
        onCheckout={handleCheckout}
        onLineItemClick={handleLineItemClick}
      />
    </div>
  );
};

const THEMES = ['stripe', 'flat', 'none'];

const App = () => {
  const [pk, setPK] = React.useState(
    window.sessionStorage.getItem('react-stripe-js-pk') || ''
  );
  const [clientSecret, setClientSecret] = React.useState(
    window.sessionStorage.getItem('react-stripe-js-client-secret') || ''
  );
  const [productId, setProductId] = React.useState(
    window.sessionStorage.getItem('react-stripe-js-product-id') || ''
  );

  React.useEffect(() => {
    window.sessionStorage.setItem('react-stripe-js-pk', pk || '');
  }, [pk]);

  React.useEffect(() => {
    window.sessionStorage.setItem(
      'react-stripe-js-client-secret',
      clientSecret || ''
    );
  }, [clientSecret]);

  React.useEffect(() => {
    window.sessionStorage.setItem(
      'react-stripe-js-product-id',
      productId || ''
    );
  }, [productId]);

  const [stripePromise, setStripePromise] = React.useState();
  const [theme, setTheme] = React.useState('stripe');

  const handleSubmit = (e) => {
    e.preventDefault();
    setStripePromise(loadStripe(pk, {betas: ['cart_beta_1']}));
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
          Publishable key{' '}
          <input value={pk} onChange={(e) => setPK(e.target.value)} />
        </label>
        <label>
          Cart Session client_secret
          <input
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
          />
        </label>
        <label>
          Product ID{' '}
          <input
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          />
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
        <Elements stripe={stripePromise} options={{appearance: {theme}}}>
          <ProductPage options={{clientSecret}} productId={productId} />
        </Elements>
      )}
    </>
  );
};

export default App;
