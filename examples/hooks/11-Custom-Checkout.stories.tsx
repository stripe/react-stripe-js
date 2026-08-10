import type {Meta, StoryObj} from '@storybook/react';

import {defaultParameter} from '../../.storybook/constants';
import CustomCheckout from './11-Custom-Checkout';

const meta: Meta<typeof CustomCheckout> = {
  title: 'react-stripe-js/Hooks/Custom Checkout',
  component: CustomCheckout,
  parameters: defaultParameter,
};

export default meta;

type Story = StoryObj<typeof CustomCheckout>;

export const Default: Story = {};
