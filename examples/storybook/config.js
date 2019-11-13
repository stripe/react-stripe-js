// @noflow
/* eslint-disable import/no-extraneous-dependencies, global-require */
import {configure} from '@storybook/react';

configure(() => {
  require('./example.stories');
}, module);
