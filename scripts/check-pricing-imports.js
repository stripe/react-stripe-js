/* eslint-env node */

const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} = require('node:fs');
const {createRequire} = require('node:module');
const {tmpdir} = require('node:os');
const {dirname, join, resolve} = require('node:path');

const root = resolve(__dirname, '..');
const fixture = mkdtempSync(join(tmpdir(), 'react-stripe-pricing-'));
const expectedExports = [
  'PricingProvider',
  'useCurrencySelection',
  'usePricingToken',
  'useResolvedPrice',
];

try {
  const [pack] = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--pack-destination', fixture], {
      cwd: root,
      encoding: 'utf8',
    })
  );
  for (const entry of [
    'pricing.js',
    'pricing.d.ts',
    'dist/pricing.js',
    'dist/pricing.esm.mjs',
    'dist/pricing.d.ts',
    'dist/pricing.esm.d.mts',
  ]) {
    assert(
      pack.files.some(({path}) => path === entry),
      `Missing packed entry: ${entry}`
    );
  }

  const packageDir = join(
    fixture,
    'node_modules',
    '@stripe',
    'react-stripe-js'
  );
  mkdirSync(packageDir, {recursive: true});
  execFileSync('tar', [
    '-xzf',
    join(fixture, pack.filename),
    '-C',
    packageDir,
    '--strip-components',
    '1',
  ]);
  for (const entry of ['dist/pricing.js', 'dist/pricing.esm.mjs']) {
    assert.doesNotMatch(
      readFileSync(join(packageDir, entry), 'utf8'),
      /regenerator|@babel\/runtime/,
      `Pricing must not depend on a generator runtime: ${entry}`
    );
  }
  for (const dependency of ['react', 'react-dom', 'prop-types']) {
    symlinkSync(
      dirname(require.resolve(`${dependency}/package.json`)),
      join(fixture, 'node_modules', dependency),
      'dir'
    );
  }

  const requireFixture = createRequire(join(fixture, 'consumer.cjs'));
  const pricing = requireFixture('@stripe/react-stripe-js/pricing');
  assert.deepEqual(Object.keys(pricing).sort(), expectedExports);
  for (const value of Object.values(pricing))
    assert.equal(typeof value, 'function');
  assert.deepEqual(
    Object.keys(requireFixture(join(packageDir, 'pricing.js'))).sort(),
    expectedExports
  );

  const React = requireFixture('react');
  const {renderToString} = requireFixture('react-dom/server');
  const Consumer = () => {
    assert.equal(pricing.useResolvedPrice('price_123').loading, true);
    const currency = pricing.useCurrencySelection();
    assert.equal(currency.loading, true);
    assert.equal(typeof currency.setSelectedCurrency, 'function');
    assert.equal(
      typeof pricing.usePricingToken().createPricingToken,
      'function'
    );
    return React.createElement('p', null, 'Loading');
  };
  assert.equal(
    renderToString(
      React.createElement(
        pricing.PricingProvider,
        {stripe: null, options: {pricingPolicy: 'policy_123'}},
        React.createElement(Consumer)
      )
    ),
    '<p>Loading</p>'
  );

  const esmConsumer = join(fixture, 'consumer.mjs');
  writeFileSync(
    esmConsumer,
    [
      "import assert from 'node:assert/strict';",
      "import React from 'react';",
      "import {renderToString} from 'react-dom/server';",
      "import * as pricing from '@stripe/react-stripe-js/pricing';",
      `assert.deepEqual(Object.keys(pricing).sort(), ${JSON.stringify(
        expectedExports
      )});`,
      "for (const value of Object.values(pricing)) assert.equal(typeof value, 'function');",
      'const Consumer = () => {',
      "  assert.equal(pricing.useResolvedPrice('price_123').loading, true);",
      '  assert.equal(pricing.useCurrencySelection().loading, true);',
      "  assert.equal(typeof pricing.usePricingToken().createPricingToken, 'function');",
      "  return React.createElement('p', null, 'Loading');",
      '};',
      "assert.equal(renderToString(React.createElement(pricing.PricingProvider, {stripe: null, options: {pricingPolicy: 'policy_123'}}, React.createElement(Consumer))), '<p>Loading</p>');",
    ].join('\n')
  );
  execFileSync(process.execPath, [esmConsumer], {stdio: 'inherit'});
  process.stdout.write(
    'Packed pricing CommonJS, ESM, and legacy entrypoints passed.\n'
  );
} finally {
  rmSync(fixture, {recursive: true, force: true});
}
