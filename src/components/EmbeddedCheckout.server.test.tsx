/**
 * @jest-environment node
 */

import React from 'react';
import {renderToString} from 'react-dom/server';

import * as EmbeddedCheckoutProviderModule from './EmbeddedCheckoutProvider';
import {EmbeddedCheckout} from './EmbeddedCheckout';

const {EmbeddedCheckoutProvider} = EmbeddedCheckoutProviderModule;

describe('EmbeddedCheckout on the server (without stripe and clientSecret props)', () => {
  beforeEach(() => {
    jest.spyOn(React, 'useLayoutEffect');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('passes id to the wrapping DOM element', () => {
    const result = renderToString(
      <EmbeddedCheckoutProvider stripe={null} options={{clientSecret: null}}>
        <EmbeddedCheckout id="foo" />
      </EmbeddedCheckoutProvider>
    );

    expect(result).toBe('<div id="foo"></div>');
  });

  it('passes className to the wrapping DOM element', () => {
    const result = renderToString(
      <EmbeddedCheckoutProvider stripe={null} options={{clientSecret: null}}>
        <EmbeddedCheckout className="bar" />
      </EmbeddedCheckoutProvider>
    );
    expect(result).toEqual('<div class="bar"></div>');
  });

  it('throws when Embedded Checkout is mounted outside of EmbeddedCheckoutProvider context', () => {
    // Prevent the console.errors to keep the test output clean
    jest.spyOn(console, 'error');
    (console.error as any).mockImplementation(() => {});

    expect(() => renderToString(<EmbeddedCheckout />)).toThrow(
      '<EmbeddedCheckout> must be used within <EmbeddedCheckoutProvider>'
    );
  });

  it('does not call useLayoutEffect', () => {
    renderToString(
      <EmbeddedCheckoutProvider stripe={null} options={{clientSecret: null}}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    );

    expect(React.useLayoutEffect).not.toHaveBeenCalled();
  });
});
