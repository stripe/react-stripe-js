const path = require('path');

module.exports = {
  stories: ['./example.stories.js'],
  addons: [
    {
      name: '@storybook/preset-typescript',
      options: {include: [path.resolve(__dirname, '..')]},
    },
  ],
};
