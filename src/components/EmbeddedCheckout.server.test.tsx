/**
 * @jest-environment node
 */

import React from 'react';
import {renderToString} from 'react-dom/server';

import * as EmbeddedCheckoutSessionProviderModule from './EmbeddedCheckoutSessionProvider';
import {EmbeddedCheckout} from './EmbeddedCheckout';

const {EmbeddedCheckoutSessionProvider} = EmbeddedCheckoutSessionProviderModule;

describe('EmbeddedCheckout on the server (without stripe and clientSecret props)', () => {
  beforeEach(() => {
    jest.spyOn(React, 'useLayoutEffect');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('passes id to the wrapping DOM element', () => {
    const result = renderToString(
      <EmbeddedCheckoutSessionProvider
        stripe={null}
        options={{clientSecret: null}}
      >
        <EmbeddedCheckout id="foo" />
      </EmbeddedCheckoutSessionProvider>
    );

    expect(result).toBe('<div id="foo"></div>');
  });

  it('passes className to the wrapping DOM element', () => {
    const result = renderToString(
      <EmbeddedCheckoutSessionProvider
        stripe={null}
        options={{clientSecret: null}}
      >
        <EmbeddedCheckout className="bar" />
      </EmbeddedCheckoutSessionProvider>
    );
    expect(result).toEqual('<div class="bar"></div>');
  });

  it('throws when Embedded Checkout is mounted outside of EmbeddedCheckoutSessionProvider context', () => {
    // Prevent the console.errors to keep the test output clean
    jest.spyOn(console, 'error');
    (console.error as any).mockImplementation(() => {});

    expect(() => renderToString(<EmbeddedCheckout />)).toThrow(
      '<EmbeddedCheckout> must be used within <EmbeddedCheckoutSessionProvider>'
    );
  });

  it('does not call useLayoutEffect', () => {
    renderToString(
      <EmbeddedCheckoutSessionProvider
        stripe={null}
        options={{clientSecret: null}}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutSessionProvider>
    );

    expect(React.useLayoutEffect).not.toHaveBeenCalled();
  });
});
