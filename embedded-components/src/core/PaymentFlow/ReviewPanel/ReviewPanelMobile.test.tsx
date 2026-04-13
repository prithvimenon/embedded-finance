import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import type { MobileReviewConfig } from '../PaymentFlow.types';

import { ReviewPanelMobile } from './ReviewPanelMobile';

describe('ReviewPanelMobile', () => {
  const defaultConfig: MobileReviewConfig = {
    requireReviewBeforeSubmit: false,
    collapsedPreview: {
      title: 'Payment Summary',
      subtitle: 'Tap to review details',
      summary: 'ACH to Jane Smith',
    },
  };

  it('renders collapsed state with title, subtitle, and total', () => {
    render(
      <ReviewPanelMobile
        config={defaultConfig}
        total="$250.00"
        isComplete={false} // eslint-disable-line react/jsx-boolean-value
        footer={<button type="button">Submit</button>}
      >
        <div>Review content</div>
      </ReviewPanelMobile>
    );

    expect(screen.getByText('Payment Summary')).toBeInTheDocument();
    expect(screen.getByText('Tap to review details')).toBeInTheDocument();
    expect(screen.getByText('$250.00')).toBeInTheDocument();
  });

  it('shows review required indicator when requireReviewBeforeSubmit is true and complete', () => {
    const configRequired: MobileReviewConfig = {
      ...defaultConfig,
      requireReviewBeforeSubmit: true,
    };

    render(
      <ReviewPanelMobile
        config={configRequired}
        total="$250.00"
        isComplete
        footer={<button type="button">Submit</button>}
      >
        <div>Review content</div>
      </ReviewPanelMobile>
    );

    expect(
      screen.getByText('Please review before submitting')
    ).toBeInTheDocument();
  });

  it('expands to show children and footer when collapsed button is clicked', async () => {
    const onReviewViewed = vi.fn();
    const configWithCallback: MobileReviewConfig = {
      ...defaultConfig,
      onReviewViewed,
    };

    render(
      <ReviewPanelMobile
        config={configWithCallback}
        total="$250.00"
        isComplete
        footer={<button type="button">Confirm payment</button>}
      >
        <div>Detailed review content</div>
      </ReviewPanelMobile>
    );

    // Click the collapsed button to expand
    const collapseButton = screen.getByText('Payment Summary');
    await userEvent.click(collapseButton);

    expect(onReviewViewed).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Review Details')).toBeInTheDocument();
    expect(screen.getByText('Detailed review content')).toBeInTheDocument();
  });

  it('renders legal disclosure when provided', async () => {
    const configWithDisclosure: MobileReviewConfig = {
      ...defaultConfig,
      legalDisclosure: 'By submitting, you agree to the terms.',
    };

    render(
      <ReviewPanelMobile
        config={configWithDisclosure}
        total="$250.00"
        isComplete
        footer={<button type="button">Submit</button>}
      >
        <div>Content</div>
      </ReviewPanelMobile>
    );

    // Expand to see disclosure
    await userEvent.click(screen.getByText('Payment Summary'));

    expect(
      screen.getByText('By submitting, you agree to the terms.')
    ).toBeInTheDocument();
  });
});
