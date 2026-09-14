import type {Meta, StoryObj} from '@storybook/react';

import {defaultParameter} from '../../.storybook/constants';
import IBAN from './4-IBAN';

const meta: Meta<typeof IBAN> = {
  title: 'react-stripe-js/Class Components/IBAN',
  component: IBAN,
  parameters: defaultParameter,
};

export default meta;

type Story = StoryObj<typeof IBAN>;

export const Default: Story = {};
