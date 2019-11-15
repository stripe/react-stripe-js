// @noflow
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';
import replace from 'rollup-plugin-replace';
import pkg from './package.json';

export default [
  {
    input: 'src/index.js',
    external: ['react'],
    output: [
      {file: pkg.main, format: 'cjs'},
      {file: pkg.module, format: 'es'},
      {
        name: 'ReactStripe',
        file: pkg.browser,
        format: 'umd',
        globals: {
          react: 'React',
        },
      },
    ],
    plugins: [
      babel({
        exclude: 'node_modules/**',
      }),
      resolve(),
      commonjs(),
    ],
  },
  // Minified UMD Build without PropTypes
  {
    input: 'src/index.js',
    external: ['react'],
    output: [
      {
        name: 'ReactStripe',
        file: pkg['browser:min'],
        format: 'umd',
        globals: {
          react: 'React',
        },
      },
    ],
    plugins: [
      babel({
        exclude: 'node_modules/**',
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      resolve(),
      commonjs(),
      terser(),
    ],
  },
];
