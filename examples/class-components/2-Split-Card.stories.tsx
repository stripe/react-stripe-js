import type {Meta, StoryObj} from '@storybook/react';

import {defaultParameter} from '../../.storybook/constants';
import SplitCard from './2-Split-Card';

const meta: Meta<typeof SplitCard> = {
  title: 'react-stripe-js/Class Components/Split Card',
  component: SplitCard,
  parameters: defaultParameter,
};

export default meta;

type Story = StoryObj<typeof SplitCard>;

export const Default: Story = {};
