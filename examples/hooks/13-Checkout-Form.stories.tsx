import type {Meta, StoryObj} from '@storybook/react';

import {defaultParameter} from '../../.storybook/constants';
import CheckoutForm from './13-Checkout-Form';

const meta: Meta<typeof CheckoutForm> = {
  title: 'react-stripe-js/Hooks/Checkout Form Element',
  component: CheckoutForm,
  parameters: defaultParameter,
};

export default meta;

type Story = StoryObj<typeof CheckoutForm>;

export const Default: Story = {};
