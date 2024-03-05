import {babel} from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import ts from 'rollup-plugin-ts';
import pkg from './package.json';

const PLUGINS = [
  commonjs(),
  ts(),
  nodeResolve(),
  babel({
    extensions: ['.ts', '.js', '.tsx', '.jsx'],
  }),
  replace({
    'process.env.NODE_ENV': JSON.stringify('production'),
    _VERSION: JSON.stringify(pkg.version),
    preventAssignment: true,
  }),
];

export default [
  {
    input: 'src/index.ts',
    external: ['react', 'prop-types'],
    output: [
      {file: pkg.main, format: 'cjs'},
      {file: pkg.module, format: 'es'},
    ],
    plugins: PLUGINS,
  },
  // UMD build with inline PropTypes
  {
    input: 'src/index.ts',
    external: ['react'],
    output: [
      {
        name: 'ReactStripe',
        file: pkg.browser,
        format: 'umd',
        globals: {
          react: 'React',
        },
      },
    ],
    plugins: PLUGINS,
  },
  // Minified UMD Build without PropTypes
  {
    input: 'src/index.ts',
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
    plugins: [...PLUGINS, terser()],
  },
];
