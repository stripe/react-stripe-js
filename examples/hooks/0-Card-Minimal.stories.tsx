import type {Meta, StoryObj} from '@storybook/react';

import {defaultParameter} from '../../.storybook/constants';
import CardMinimal from './0-Card-Minimal';

const meta: Meta<typeof CardMinimal> = {
  title: 'react-stripe-js/Hooks/Card Minimal',
  component: CardMinimal,
  parameters: defaultParameter,
};

export default meta;

type Story = StoryObj<typeof CardMinimal>;

export const Default: Story = {};
