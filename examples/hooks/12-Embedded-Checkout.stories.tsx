import type {Meta, StoryObj} from '@storybook/react';

import {defaultParameter} from '../../.storybook/constants';
import EmbeddedCheckout from './12-Embedded-Checkout';

const meta: Meta<typeof EmbeddedCheckout> = {
  title: 'react-stripe-js/Hooks/Embedded Checkout',
  component: EmbeddedCheckout,
  parameters: defaultParameter,
};

export default meta;

type Story = StoryObj<typeof EmbeddedCheckout>;

export const Default: Story = {};
