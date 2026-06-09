import React from 'react';
import {render} from '@testing-library/react';
import {FinancialAccountDisclosure} from './FinancialAccountDisclosure';
import {StripeErrorType} from '@stripe/stripe-js';
import {mockStripe as baseMockStripe} from '../../test/mocks';

const apiError: StripeErrorType = 'api_error';

const mockSuccessfulStripeJsCall = () => {
  return {
    ...baseMockStripe(),
    createFinancialAccountDisclosure: jest.fn(() =>
      Promise.resolve({
        htmlElement: document.createElement('div'),
      })
    ),
  };
};

const mockStripeJsWithError = () => {
  return {
    ...baseMockStripe(),
    createFinancialAccountDisclosure: jest.fn(() =>
      Promise.resolve({
        error: {
          type: apiError,
          message: 'This is a test error',
        },
      })
    ),
  };
};

describe('FinancialAccountDisclosure', () => {
  let mockStripe: any;

  beforeEach(() => {
    mockStripe = mockSuccessfulStripeJsCall();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render', () => {
    render(<FinancialAccountDisclosure stripe={mockStripe} />);
  });

  it('should render with options', () => {
    const options = {
      businessName: 'Test Business',
      learnMoreLink: 'https://test.com',
    };
    render(
      <FinancialAccountDisclosure stripe={mockStripe} options={options} />
    );
  });

  it('should render when there is an error', () => {
    mockStripe = mockStripeJsWithError();
    render(<FinancialAccountDisclosure stripe={mockStripe} />);
  });

  it('should render with an onLoad callback', async () => {
    const onLoad = jest.fn();
    render(<FinancialAccountDisclosure stripe={mockStripe} onLoad={onLoad} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onLoad).toHaveBeenCalled();
  });

  it('should not call onLoad if there is an error', async () => {
    const onLoad = jest.fn();
    mockStripe = mockStripeJsWithError();
    render(<FinancialAccountDisclosure stripe={mockStripe} onLoad={onLoad} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onLoad).not.toHaveBeenCalled();
  });

  it('should render with an onError callback', async () => {
    const onError = jest.fn();
    mockStripe = mockStripeJsWithError();
    render(
      <FinancialAccountDisclosure stripe={mockStripe} onError={onError} />
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onError).toHaveBeenCalled();
  });

  it('should not call onError if there is no error', async () => {
    const onError = jest.fn();
    render(
      <FinancialAccountDisclosure stripe={mockStripe} onError={onError} />
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onError).not.toHaveBeenCalled();
  });
});
