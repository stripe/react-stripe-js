module.exports = {
  stories: ['./example.stories.js'],
  reactOptions: {
    strictMode: true,
  },
  webpackFinal: async (config) => {
    config.module.rules.push({
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: require.resolve('ts-loader'),
          options: {
            transpileOnly: true,
          },
        },
      ],
    });
    config.resolve.extensions.push('.ts', '.tsx');
    return config;
  },
};
