// Modern CSF3 story format for Storybook 10
import React from 'react';
import type {Meta, StoryObj} from '@storybook/react';

// Import all hook examples
import HooksCardMinimal from '../examples/hooks/0-Card-Minimal';
import HooksCardDetailed from '../examples/hooks/1-Card-Detailed';
import HooksSplitCard from '../examples/hooks/2-Split-Card';
import HooksPaymentRequestButton from '../examples/hooks/3-Payment-Request-Button';
import HooksIBAN from '../examples/hooks/4-IBAN';
import HooksPaymentElement from '../examples/hooks/9-Payment-Element';
import HooksCustomCheckout from '../examples/hooks/11-Custom-Checkout';
import HooksEmbeddedCheckout from '../examples/hooks/12-Embedded-Checkout';
import HooksPaymentFormElement from '../examples/hooks/13-Payment-Form-Element';

// Import all class component examples
import ClassCardMinimal from '../examples/class-components/0-Card-Minimal';
import ClassCardDetailed from '../examples/class-components/1-Card-Detailed';
import ClassSplitCard from '../examples/class-components/2-Split-Card';
import ClassPaymentRequestButton from '../examples/class-components/3-Payment-Request-Button';
import ClassIBAN from '../examples/class-components/4-IBAN';

const meta: Meta = {
  title: 'react-stripe-js',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj;

// Hooks examples
export const HooksCardMinimalStory: Story = {
  render: () => <HooksCardMinimal />,
  name: 'Hooks / Card Minimal',
};

export const HooksCardDetailedStory: Story = {
  render: () => <HooksCardDetailed />,
  name: 'Hooks / Card Detailed',
};

export const HooksSplitCardStory: Story = {
  render: () => <HooksSplitCard />,
  name: 'Hooks / Split Card',
};

export const HooksPaymentRequestButtonStory: Story = {
  render: () => <HooksPaymentRequestButton />,
  name: 'Hooks / Payment Request Button',
};

export const HooksIBANStory: Story = {
  render: () => <HooksIBAN />,
  name: 'Hooks / IBAN',
};

export const HooksPaymentElementStory: Story = {
  render: () => <HooksPaymentElement />,
  name: 'Hooks / Payment Element',
};

export const HooksCustomCheckoutStory: Story = {
  render: () => <HooksCustomCheckout />,
  name: 'Hooks / Custom Checkout',
};

export const HooksEmbeddedCheckoutStory: Story = {
  render: () => <HooksEmbeddedCheckout />,
  name: 'Hooks / Embedded Checkout',
};

export const HooksPaymentFormElementStory: Story = {
  render: () => <HooksPaymentFormElement />,
  name: 'Hooks / Payment Form Element',
};

// Class component examples
export const ClassCardMinimalStory: Story = {
  render: () => <ClassCardMinimal />,
  name: 'Class Components / Card Minimal',
};

export const ClassCardDetailedStory: Story = {
  render: () => <ClassCardDetailed />,
  name: 'Class Components / Card Detailed',
};

export const ClassSplitCardStory: Story = {
  render: () => <ClassSplitCard />,
  name: 'Class Components / Split Card',
};

export const ClassPaymentRequestButtonStory: Story = {
  render: () => <ClassPaymentRequestButton />,
  name: 'Class Components / Payment Request Button',
};

export const ClassIBANStory: Story = {
  render: () => <ClassIBAN />,
  name: 'Class Components / IBAN',
};
