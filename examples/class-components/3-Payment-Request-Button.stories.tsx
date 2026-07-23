import type {Meta, StoryObj} from '@storybook/react';

import {defaultParameter} from '../../.storybook/constants';
import PaymentRequestButton from './3-Payment-Request-Button';

const meta: Meta<typeof PaymentRequestButton> = {
  title: 'react-stripe-js/Class Components/Payment Request Button',
  component: PaymentRequestButton,
  parameters: defaultParameter,
};

export default meta;

type Story = StoryObj<typeof PaymentRequestButton>;

export const Default: Story = {};
