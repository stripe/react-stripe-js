// This example shows how to use all 5 Issuing Elements with React Stripe.js.
// https://stripe.com/docs/issuing/elements
//
// Written in TypeScript to validate that all exported types are correct.
//
// The flow for Issuing Elements requires a nonce + ephemeral key handshake:
//   1. Client: stripe.createEphemeralKeyNonce({issuingCard}) -> nonce
//   2. Server: POST /v1/ephemeral_keys with nonce + issuingCard -> secret
//   3. Client: render elements with {issuingCard, nonce, ephemeralKeySecret}

import React, {useState, useCallback} from 'react';
import {
  loadStripe,
  Stripe,
  StripeElementStyle,
  StripeIssuingCardNumberDisplayElement,
  StripeIssuingCardCvcDisplayElement,
  StripeIssuingCardExpiryDisplayElement,
  StripeIssuingCardPinDisplayElement,
  StripeIssuingCardCopyButtonElement,
  StripeIssuingCardNumberDisplayElementOptions,
  StripeIssuingCardCvcDisplayElementOptions,
  StripeIssuingCardExpiryDisplayElementOptions,
  StripeIssuingCardPinDisplayElementOptions,
  StripeIssuingCardCopyButtonElementOptions,
} from '@stripe/stripe-js';
import {
  Elements,
  useStripe,
  useElements,
  IssuingCardNumberDisplayElement,
  IssuingCardCvcDisplayElement,
  IssuingCardExpiryDisplayElement,
  IssuingCardPinDisplayElement,
  IssuingCardCopyButtonElement,
} from '../../src';

import '../styles/common.css';

const DISPLAY_ELEMENT_STYLE: StripeElementStyle = {
  base: {
    color: '#424770',
    fontSize: '16px',
    fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
    fontSmoothing: 'antialiased',
    letterSpacing: '0.025em',
    '::placeholder': {
      color: '#aab7c4',
    },
  },
};

const DISPLAY_ELEMENT_STYLE_ALT: StripeElementStyle = {
  base: {
    color: '#1a1a2e',
    fontSize: '20px',
    fontFamily: '"Courier New", Courier, monospace',
    fontWeight: 'bold',
    letterSpacing: '0.1em',
  },
};

interface IssuingElementsDemoProps {
  issuingCard: string;
  nonce: string;
  ephemeralKeySecret: string;
}

// Demonstrates all 5 Issuing Elements with full configuration
const IssuingElementsDemo: React.FC<IssuingElementsDemoProps> = ({
  issuingCard,
  nonce,
  ephemeralKeySecret,
}) => {
  const elements = useElements();
  const [readyElements, setReadyElements] = useState<Record<string, boolean>>(
    {}
  );
  const [useAltStyle, setUseAltStyle] = useState(false);

  const style: StripeElementStyle = useAltStyle
    ? DISPLAY_ELEMENT_STYLE_ALT
    : DISPLAY_ELEMENT_STYLE;

  // Type-safe onReady handlers for each display element type
  const onNumberReady = useCallback(
    (element: StripeIssuingCardNumberDisplayElement) => {
      console.log('[number ready]', element);
      // Verify element-specific methods are available
      element.update({style: {base: {color: '#000'}}});
      setReadyElements((prev) => ({...prev, number: true}));
    },
    []
  );

  const onCvcReady = useCallback(
    (element: StripeIssuingCardCvcDisplayElement) => {
      console.log('[cvc ready]', element);
      setReadyElements((prev) => ({...prev, cvc: true}));
    },
    []
  );

  const onExpiryReady = useCallback(
    (element: StripeIssuingCardExpiryDisplayElement) => {
      console.log('[expiry ready]', element);
      setReadyElements((prev) => ({...prev, expiry: true}));
    },
    []
  );

  const onPinReady = useCallback(
    (element: StripeIssuingCardPinDisplayElement) => {
      console.log('[pin ready]', element);
      setReadyElements((prev) => ({...prev, pin: true}));
    },
    []
  );

  const onCopyReady = useCallback(
    (element: StripeIssuingCardCopyButtonElement) => {
      console.log('[copy ready]', element);
      setReadyElements((prev) => ({...prev, copy: true}));
    },
    []
  );

  // Type-safe onClick handler for copy button
  const onCopyClick = useCallback(
    (event: {elementType: 'issuingCardCopyButton'}) => {
      console.log('[CopyButton click]', event.elementType);
    },
    []
  );

  // Type-safe getElement calls
  const handleGetElement = useCallback(() => {
    if (!elements) return;

    const numberEl: StripeIssuingCardNumberDisplayElement | null = elements.getElement(
      IssuingCardNumberDisplayElement
    );
    const cvcEl: StripeIssuingCardCvcDisplayElement | null = elements.getElement(
      IssuingCardCvcDisplayElement
    );
    const expiryEl: StripeIssuingCardExpiryDisplayElement | null = elements.getElement(
      IssuingCardExpiryDisplayElement
    );
    const pinEl: StripeIssuingCardPinDisplayElement | null = elements.getElement(
      IssuingCardPinDisplayElement
    );
    const copyEl: StripeIssuingCardCopyButtonElement | null = elements.getElement(
      IssuingCardCopyButtonElement
    );

    console.log('[getElement results]', {
      number: numberEl,
      cvc: cvcEl,
      expiry: expiryEl,
      pin: pinEl,
      copy: copyEl,
    });
  }, [elements]);

  // Type-safe options for display elements
  const numberOptions: StripeIssuingCardNumberDisplayElementOptions = {
    issuingCard,
    nonce,
    ephemeralKeySecret,
    style,
  };

  const cvcOptions: StripeIssuingCardCvcDisplayElementOptions = {
    issuingCard,
    nonce,
    ephemeralKeySecret,
    style,
  };

  const expiryOptions: StripeIssuingCardExpiryDisplayElementOptions = {
    issuingCard,
    nonce,
    ephemeralKeySecret,
    style,
  };

  const pinOptions: StripeIssuingCardPinDisplayElementOptions = {
    issuingCard,
    nonce,
    ephemeralKeySecret,
    style,
  };

  // Type-safe options for each copy button variant
  const toCopyValues: Array<StripeIssuingCardCopyButtonElementOptions['toCopy']> = [
    'number',
    'cvc',
    'expiry',
    'pin',
  ];

  return (
    <div>
      <h2>Issuing Elements Demo</h2>

      <div style={{marginBottom: 20}}>
        <button type="button" onClick={() => setUseAltStyle((v) => !v)}>
          Toggle Style ({useAltStyle ? 'Alt' : 'Default'})
        </button>
        <button
          type="button"
          onClick={handleGetElement}
          style={{marginLeft: 10}}
        >
          Test getElement()
        </button>
      </div>

      {/* Card Number Display */}
      <section style={{marginBottom: 20}}>
        <h3>
          Card Number Display{' '}
          {readyElements.number && (
            <span style={{color: 'green'}}>(Ready)</span>
          )}
        </h3>
        <IssuingCardNumberDisplayElement
          id="issuing-card-number"
          className="issuing-element"
          options={numberOptions}
          onReady={onNumberReady}
        />
      </section>

      {/* Card CVC Display */}
      <section style={{marginBottom: 20}}>
        <h3>
          Card CVC Display{' '}
          {readyElements.cvc && <span style={{color: 'green'}}>(Ready)</span>}
        </h3>
        <IssuingCardCvcDisplayElement
          id="issuing-card-cvc"
          className="issuing-element"
          options={cvcOptions}
          onReady={onCvcReady}
        />
      </section>

      {/* Card Expiry Display */}
      <section style={{marginBottom: 20}}>
        <h3>
          Card Expiry Display{' '}
          {readyElements.expiry && (
            <span style={{color: 'green'}}>(Ready)</span>
          )}
        </h3>
        <IssuingCardExpiryDisplayElement
          id="issuing-card-expiry"
          className="issuing-element"
          options={expiryOptions}
          onReady={onExpiryReady}
        />
      </section>

      {/* Card PIN Display */}
      <section style={{marginBottom: 20}}>
        <h3>
          Card PIN Display{' '}
          {readyElements.pin && <span style={{color: 'green'}}>(Ready)</span>}
        </h3>
        <IssuingCardPinDisplayElement
          id="issuing-card-pin"
          className="issuing-element"
          options={pinOptions}
          onReady={onPinReady}
        />
      </section>

      {/* Copy Buttons - all four toCopy variants */}
      <section style={{marginBottom: 20}}>
        <h3>Copy Buttons</h3>
        {toCopyValues.map((target) => {
          const copyOptions: StripeIssuingCardCopyButtonElementOptions = {
            toCopy: target,
            style,
          };
          return (
            <div key={target} style={{marginBottom: 8}}>
              <span style={{display: 'inline-block', width: 80}}>
                {target}:
              </span>
              <div
                style={{
                  display: 'inline-block',
                  width: 80,
                  height: 30,
                  position: 'relative',
                }}
              >
                <IssuingCardCopyButtonElement
                  options={copyOptions}
                  onReady={onCopyReady}
                  onClick={onCopyClick}
                />
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

interface NonceGeneratorProps {
  stripe: Stripe;
  issuingCard: string;
  onComplete: (credentials: {
    nonce: string;
    ephemeralKeySecret: string;
  }) => void;
}

// Step 1 generates the nonce client-side, Step 2 lets user provide the
// ephemeral key secret created server-side with that nonce.
const NonceGenerator: React.FC<NonceGeneratorProps> = ({
  stripe,
  issuingCard,
  onComplete,
}) => {
  const [nonce, setNonce] = useState<string | null>(null);
  const [ephemeralKeySecret, setEphemeralKeySecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerateNonce = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await stripe.createEphemeralKeyNonce({
        issuingCard,
      });
      if (result.error) {
        setError(result.error.message || 'Unknown error');
      } else {
        setNonce(result.nonce);
      }
    } catch (e) {
      setError(e.message);
    }
    setGenerating(false);
  };

  const handleLoadElements = () => {
    if (nonce && ephemeralKeySecret) {
      onComplete({nonce, ephemeralKeySecret});
    }
  };

  return (
    <div
      style={{
        marginTop: 20,
        padding: 20,
        background: '#fff',
        borderRadius: 4,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        maxWidth: 800,
      }}
    >
      <h3>Step 1: Generate Nonce</h3>
      <p style={{fontSize: 14, color: '#666'}}>
        This calls <code>stripe.createEphemeralKeyNonce()</code> to register the
        card in the Stripe.js cache and produce a nonce.
      </p>
      <button
        type="button"
        onClick={handleGenerateNonce}
        disabled={generating || !issuingCard}
      >
        {generating ? 'Generating...' : 'Generate Nonce'}
      </button>

      {error && <p style={{color: 'red'}}>{error}</p>}

      {nonce && (
        <>
          <p>
            <strong>Nonce:</strong>{' '}
            <code style={{fontSize: 12, wordBreak: 'break-all'}}>{nonce}</code>
          </p>

          <h3>Step 2: Create Ephemeral Key</h3>
          <p style={{fontSize: 14, color: '#666'}}>
            Run this on your server (or terminal) to create the ephemeral key
            with the nonce, then paste the secret below:
          </p>
          <pre
            style={{
              background: '#f4f4f4',
              padding: 10,
              borderRadius: 4,
              fontSize: 12,
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {`curl https://api.stripe.com/v1/ephemeral_keys \\
  -u YOUR_SECRET_KEY: \\
  -H "Stripe-Version: 2025-03-31.basil" \\
  -d "issuing_card=${issuingCard}" \\
  -d "nonce=${nonce}"`}
          </pre>
          <label>
            Ephemeral Key Secret (from the response&apos;s &quot;secret&quot;
            field)
            <input
              value={ephemeralKeySecret}
              onChange={(e) => setEphemeralKeySecret(e.target.value)}
              placeholder="ek_test_..."
              style={{width: '100%'}}
            />
          </label>
          <button
            type="button"
            onClick={handleLoadElements}
            disabled={!ephemeralKeySecret}
            style={{marginTop: 10}}
          >
            Load Issuing Elements
          </button>
        </>
      )}
    </div>
  );
};

interface SetupFlowProps {
  issuingCard: string;
  onComplete: (credentials: {
    nonce: string;
    ephemeralKeySecret: string;
  }) => void;
}

// Wrapper that has access to the stripe instance via useStripe()
const SetupFlow: React.FC<SetupFlowProps> = ({issuingCard, onComplete}) => {
  const stripe = useStripe();

  if (!stripe) {
    return <p>Loading Stripe...</p>;
  }

  return (
    <NonceGenerator
      stripe={stripe}
      issuingCard={issuingCard}
      onComplete={onComplete}
    />
  );
};

const App: React.FC = () => {
  const [pk, setPK] = useState(
    window.sessionStorage.getItem('react-stripe-js-pk') || ''
  );
  const [issuingCard, setIssuingCard] = useState(
    window.sessionStorage.getItem('react-stripe-js-issuing-card') || ''
  );
  const [stripePromise, setStripePromise] = useState<ReturnType<
    typeof loadStripe
  > | null>(null);
  const [credentials, setCredentials] = useState<{
    nonce: string;
    ephemeralKeySecret: string;
  } | null>(null);

  React.useEffect(() => {
    window.sessionStorage.setItem('react-stripe-js-pk', pk || '');
  }, [pk]);

  React.useEffect(() => {
    window.sessionStorage.setItem(
      'react-stripe-js-issuing-card',
      issuingCard || ''
    );
  }, [issuingCard]);

  const handleLoad = (e: React.FormEvent) => {
    e.preventDefault();
    setCredentials(null);
    setStripePromise(loadStripe(pk));
  };

  const handleUnload = () => {
    setStripePromise(null);
    setCredentials(null);
  };

  return (
    <div
      style={{
        maxWidth: 800,
        margin: '20px',
        fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
      }}
    >
      <form onSubmit={handleLoad} style={{margin: 0}}>
        <label>
          Publishable key
          <input value={pk} onChange={(e) => setPK(e.target.value)} />
        </label>
        <label>
          Issuing Card ID (e.g. ic_abc123)
          <input
            value={issuingCard}
            onChange={(e) => setIssuingCard(e.target.value)}
          />
        </label>
        <button type="submit" style={{marginRight: 10}}>
          Load Stripe
        </button>
        <button type="button" onClick={handleUnload}>
          Unload
        </button>
      </form>

      {stripePromise && !credentials && (
        <Elements stripe={stripePromise}>
          <SetupFlow issuingCard={issuingCard} onComplete={setCredentials} />
        </Elements>
      )}

      {stripePromise && credentials && (
        <Elements stripe={stripePromise}>
          <IssuingElementsDemo
            issuingCard={issuingCard}
            nonce={credentials.nonce}
            ephemeralKeySecret={credentials.ephemeralKeySecret}
          />
        </Elements>
      )}
    </div>
  );
};

export default App;
