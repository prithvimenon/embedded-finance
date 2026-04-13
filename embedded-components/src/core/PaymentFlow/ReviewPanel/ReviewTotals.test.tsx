import { describe, expect, it } from 'vitest';
import { render, screen } from '@test-utils';

import { ReviewTotals } from './ReviewTotals';

describe('ReviewTotals', () => {
  it('renders fee items and total with currency formatting', () => {
    render(
      <ReviewTotals
        items={[
          { label: 'Amount', value: 250 },
          { label: 'Processing Fee', value: 2.5 },
        ]}
        total={252.5}
        currency="USD"
      />
    );

    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('$250.00')).toBeInTheDocument();
    expect(screen.getByText('Processing Fee')).toBeInTheDocument();
    expect(screen.getByText('$2.50')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$252.50')).toBeInTheDocument();
  });

  it('returns null when there are no fee items', () => {
    render(
      <ReviewTotals
        items={[{ label: 'Amount', value: 250 }]}
        total={250}
        currency="USD"
      />
    );

    // ReviewTotals filters for items with "fee" in the label; no fee = renders nothing
    // The wrapper provider may inject global styles, so check that no meaningful content is rendered
    expect(screen.queryByText('Total')).not.toBeInTheDocument();
    expect(screen.queryByText('Amount')).not.toBeInTheDocument();
  });

  it('renders with non-USD currency', () => {
    render(
      <ReviewTotals
        items={[
          { label: 'Amount', value: 100 },
          { label: 'Wire Fee', value: 25 },
        ]}
        total={125}
        currency="GBP"
      />
    );

    expect(screen.getByText('Total')).toBeInTheDocument();
    // GBP formatted
    expect(screen.getByText('\u00A3125.00')).toBeInTheDocument();
  });

  it('applies custom className to the container', () => {
    const { container } = render(
      <ReviewTotals
        items={[
          { label: 'Amount', value: 100 },
          { label: 'Service Fee', value: 5 },
        ]}
        total={105}
        className="eb-mt-4"
      />
    );

    const wrapper = container.querySelector('.eb-mt-4');
    expect(wrapper).toBeInTheDocument();
  });
});
