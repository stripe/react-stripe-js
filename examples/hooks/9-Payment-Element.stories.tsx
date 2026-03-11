import type {Meta, StoryObj} from '@storybook/react';

import {defaultParameter} from '../../.storybook/constants';
import PaymentElement from './9-Payment-Element';

const meta: Meta<typeof PaymentElement> = {
  title: 'react-stripe-js/Hooks/Payment Element',
  component: PaymentElement,
  parameters: defaultParameter,
};

export default meta;

type Story = StoryObj<typeof PaymentElement>;

export const Default: Story = {};
