import React from 'react';
import {render} from '@testing-library/react';
import {StripeErrorType} from '@stripe/stripe-js';
import {TreasuryDisclosure} from './TreasuryDisclosure';
import {mockStripe as baseMockStripe} from '../../test/mocks';

const apiError: StripeErrorType = 'api_error';

const mockSuccessfulStripeJsCall = () => {
  return {
    ...baseMockStripe(),
    createTreasuryDisclosure: jest.fn(() =>
      Promise.resolve({
        htmlElement: document.createElement('div'),
      })
    ),
  };
};

const mockStripeJsWithError = () => {
  return {
    ...baseMockStripe(),
    createTreasuryDisclosure: jest.fn(() =>
      Promise.resolve({
        error: {
          type: apiError,
          message: 'This is a test error',
        },
      })
    ),
  };
};

describe('TreasuryDisclosure', () => {
  let mockStripe: any;

  beforeEach(() => {
    mockStripe = mockSuccessfulStripeJsCall();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render', () => {
    render(<TreasuryDisclosure stripe={mockStripe} />);
  });

  it('should render with options', () => {
    const options = {
      businessName: 'Test Business',
      learnMoreLink: 'https://test.com',
    };
    render(<TreasuryDisclosure stripe={mockStripe} options={options} />);
  });

  it('should render when there is an error', () => {
    mockStripe = mockStripeJsWithError();
    render(<TreasuryDisclosure stripe={mockStripe} />);
  });

  it('should render with an onLoad callback', async () => {
    const onLoad = jest.fn();
    render(<TreasuryDisclosure stripe={mockStripe} onLoad={onLoad} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onLoad).toHaveBeenCalled();
  });

  it('should not call onLoad if there is an error', async () => {
    const onLoad = jest.fn();
    mockStripe = mockStripeJsWithError();
    render(<TreasuryDisclosure stripe={mockStripe} onLoad={onLoad} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onLoad).not.toHaveBeenCalled();
  });

  it('should render with an onError callback', async () => {
    const onError = jest.fn();
    mockStripe = mockStripeJsWithError();
    render(<TreasuryDisclosure stripe={mockStripe} onError={onError} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onError).toHaveBeenCalled();
  });

  it('should not call onError if there is no error', async () => {
    const onError = jest.fn();
    render(<TreasuryDisclosure stripe={mockStripe} onError={onError} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onError).not.toHaveBeenCalled();
  });
});
