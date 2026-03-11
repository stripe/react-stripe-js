import type {StorybookConfig} from '@storybook/react-webpack5';
import type {Configuration} from 'webpack';
import {fileURLToPath} from 'url';
import {dirname, resolve} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  stories: ['./example.stories.tsx'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {fastRefresh: true, builder: {lazyCompilation: true}},
  },
  addons: [],
  webpackFinal: async (config: Configuration) => {
    // Add babel-loader rule for JSX/TS files in .storybook, examples, and src directories
    // Use unshift to add this rule before Storybook's internal rules
    config.module?.rules?.unshift({
      test: /\.(jsx?|tsx?)$/,
      include: [
        resolve(__dirname, '../src'),
        resolve(__dirname, '../.storybook'),
        resolve(__dirname, '../examples'),
      ],
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-react', {runtime: 'automatic'}],
            '@babel/preset-env',
            '@babel/preset-typescript',
          ],
          plugins: [
            [
              '@babel/plugin-transform-runtime',
              {
                regenerator: true,
              },
            ],
          ],
        },
      },
    });
    return config;
  },
};

export default config;
