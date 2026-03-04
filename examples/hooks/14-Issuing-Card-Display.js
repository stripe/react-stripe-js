/**
 * Issuing Card Display Example
 * This example demonstrates how to display sensitive Issuing card data
 * using Issuing Elements in a PCI-compliant way.
 * @docs https://stripe.com/docs/issuing/elements
 */

import React, {useState, useEffect} from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {Elements, useStripe} from '../../src';
import {
  IssuingCardNumberDisplayElement,
  IssuingCardCvcDisplayElement,
  IssuingCardExpiryDisplayElement,
  IssuingCardCopyButtonElement,
} from '../../src';

const IssuingCardDisplay = () => {
  const stripe = useStripe();
  const [ephemeralKey, setEphemeralKey] = useState(null);
  const [nonce, setNonce] = useState(null);
  const [cardId] = useState('ic_1ITi6XKYfU8ZP6raDAXem8ql'); // Example card ID

  useEffect(() => {
    const setupEphemeralKey = async () => {
      if (!stripe) {
        return;
      }

      try {
        const nonceResult = await stripe.createEphemeralKeyNonce({
          issuingCard: cardId,
        });

        if (nonceResult.error) {
          console.error('Error creating nonce:', nonceResult.error);
          return;
        }

        const generatedNonce = nonceResult.nonce;
        setNonce(generatedNonce);

        // Note: This endpoint must authenticate the user and verify they have
        // permission to view this card's details
        const response = await fetch('/ephemeral-keys', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add your authentication headers here
            // 'Authorization': 'Bearer YOUR_AUTH_TOKEN'
          },
          body: JSON.stringify({
            card_id: cardId,
            nonce: generatedNonce,
          }),
        });

        const data = await response.json();
        setEphemeralKey(data.ephemeralKeySecret);
      } catch (error) {
        console.error('Error setting up ephemeral key:', error);
      }
    };

    setupEphemeralKey();

    // Note: Ephemeral keys expire after 15 minutes
    const refreshInterval = setInterval(setupEphemeralKey, 14 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [stripe, cardId]);

  if (!ephemeralKey || !nonce) {
    return <div>Loading card details...</div>;
  }

  const elementOptions = {
    issuingCard: cardId,
    nonce: nonce,
    ephemeralKeySecret: ephemeralKey,
    style: {
      base: {
        color: '#fff',
        fontSize: '16px',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      },
    },
  };

  return (
    <div style={{padding: '20px', maxWidth: '400px'}}>
      <h2>Your Virtual Card</h2>

      <div style={{marginBottom: '20px'}}>
        <label style={{display: 'block', marginBottom: '5px', color: '#666'}}>
          Card Number
        </label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#0a2540',
            padding: '10px',
            borderRadius: '4px',
          }}
        >
          <div style={{flex: 1}}>
            <IssuingCardNumberDisplayElement options={elementOptions} />
          </div>
          <div style={{marginLeft: '10px', width: '24px', height: '24px'}}>
            <IssuingCardCopyButtonElement
              options={{
                toCopy: 'number',
                style: {
                  base: {
                    fontSize: '12px',
                    lineHeight: '24px',
                  },
                },
              }}
              onClick={() => console.log('Card number copied!')}
            />
          </div>
        </div>
      </div>

      <div style={{display: 'flex', gap: '20px', marginBottom: '20px'}}>
        <div style={{flex: 1}}>
          <label style={{display: 'block', marginBottom: '5px', color: '#666'}}>
            Expiry Date
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#0a2540',
              padding: '10px',
              borderRadius: '4px',
            }}
          >
            <div style={{flex: 1}}>
              <IssuingCardExpiryDisplayElement options={elementOptions} />
            </div>
            <div style={{marginLeft: '10px', width: '24px', height: '24px'}}>
              <IssuingCardCopyButtonElement
                options={{
                  toCopy: 'expiry',
                  style: {
                    base: {
                      fontSize: '12px',
                      lineHeight: '24px',
                    },
                  },
                }}
                onClick={() => console.log('Expiry copied!')}
              />
            </div>
          </div>
        </div>

        <div style={{flex: 1}}>
          <label style={{display: 'block', marginBottom: '5px', color: '#666'}}>
            CVC
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#0a2540',
              padding: '10px',
              borderRadius: '4px',
            }}
          >
            <div style={{flex: 1}}>
              <IssuingCardCvcDisplayElement options={elementOptions} />
            </div>
            <div style={{marginLeft: '10px', width: '24px', height: '24px'}}>
              <IssuingCardCopyButtonElement
                options={{
                  toCopy: 'cvc',
                  style: {
                    base: {
                      fontSize: '12px',
                      lineHeight: '24px',
                    },
                  },
                }}
                onClick={() => console.log('CVC copied!')}
              />
            </div>
          </div>
        </div>
      </div>

      <p style={{fontSize: '12px', color: '#666'}}>
        Note: Card details are displayed securely through Stripe-hosted iframes.
        Sensitive data never touches your servers.
      </p>
    </div>
  );
};

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe('pk_test_6pRNASCoBOKtIshFeQd4XMUh');

const App = () => {
  return (
    <Elements stripe={stripePromise}>
      <IssuingCardDisplay />
    </Elements>
  );
};

export default App;
