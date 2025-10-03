import React from 'react';
import {render} from '@testing-library/react';
import FinancialAccountDisclosure from './FinancialAccountDisclosure';
import { StripeError, StripeErrorType } from '@stripe/stripe-js';
import {mockStripe as baseMockStripe} from '../../test/mocks';

const apiError: StripeErrorType = 'api_error';

const mockStripeJs = (htmlElement: HTMLElement | undefined = document.createElement('div'), error: StripeError | undefined = undefined) => {
  return {
    ...baseMockStripe(),
    createFinancialAccountDisclosure: jest.fn(() =>
      Promise.resolve({
        htmlElement,
        error,
      })
    ),
  };
};

describe('FinancialAccountDisclosure', () => {
  let mockStripe: any;

  beforeEach(() => {
    mockStripe = mockStripeJs();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });


  it('should render', () => {
    render(<FinancialAccountDisclosure stripe={mockStripe} />);
  });

  it('should render when there is an error', () => {
    const error: StripeError = {type: apiError, message: 'This is a test error'};
    mockStripe = mockStripeJs(undefined, error);
    render(<FinancialAccountDisclosure stripe={mockStripe} />);
  });

  it('should render with an onLoad callback', () => {
    const onLoad = jest.fn();
    render(<FinancialAccountDisclosure stripe={mockStripe} onLoad={onLoad} />);
    expect(onLoad).toHaveBeenCalled();
  });

  it('should render with an onError callback', () => {
    const onError = jest.fn();
    render(<FinancialAccountDisclosure stripe={mockStripe} onError={onError} />);
  });

  it('should render with options', () => {
    const options = {businessName: 'Test Business', learnMoreLink: 'https://test.com'};
    render(<FinancialAccountDisclosure stripe={mockStripe} options={options} />);
  });
});