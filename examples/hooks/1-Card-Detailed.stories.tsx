import type {Meta, StoryObj} from '@storybook/react';

import {defaultParameter} from '../../.storybook/constants';
import CardDetailed from './1-Card-Detailed';

const meta: Meta<typeof CardDetailed> = {
  title: 'react-stripe-js/Hooks/Card Detailed',
  component: CardDetailed,
  parameters: defaultParameter,
};

export default meta;

type Story = StoryObj<typeof CardDetailed>;

export const Default: Story = {};
