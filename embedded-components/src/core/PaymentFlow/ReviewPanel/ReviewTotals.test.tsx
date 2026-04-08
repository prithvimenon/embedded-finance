import { render, screen } from '@testing-library/react';

import { ReviewTotals } from './ReviewTotals';

describe('ReviewTotals', () => {
  it('renders nothing when no fee items are present', () => {
    const { container } = render(
      <ReviewTotals
        items={[{ label: 'Amount', value: 100 }]}
        total={100}
      />
    );

    // Should not render anything since no items have "fee" in label
    expect(container.firstChild).toBeNull();
  });

  it('renders when there are fee items', () => {
    render(
      <ReviewTotals
        items={[
          { label: 'Amount', value: 100 },
          { label: 'Transfer fee', value: 2.5 },
        ]}
        total={102.5}
      />
    );

    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Transfer fee')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('formats currency values correctly in USD', () => {
    render(
      <ReviewTotals
        items={[
          { label: 'Amount', value: 100 },
          { label: 'Wire fee', value: 25 },
        ]}
        total={125}
        currency="USD"
      />
    );

    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument();
    expect(screen.getByText('$125.00')).toBeInTheDocument();
  });

  it('supports different currency', () => {
    render(
      <ReviewTotals
        items={[
          { label: 'Amount', value: 50 },
          { label: 'Processing fee', value: 1 },
        ]}
        total={51}
        currency="EUR"
      />
    );

    // EUR formatting in en-US locale
    expect(screen.getByText('€50.00')).toBeInTheDocument();
    expect(screen.getByText('€1.00')).toBeInTheDocument();
    expect(screen.getByText('€51.00')).toBeInTheDocument();
  });

  it('defaults currency to USD', () => {
    render(
      <ReviewTotals
        items={[
          { label: 'Amount', value: 200 },
          { label: 'Service fee', value: 5 },
        ]}
        total={205}
      />
    );

    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument();
    expect(screen.getByText('$205.00')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ReviewTotals
        items={[
          { label: 'Amount', value: 100 },
          { label: 'ACH fee', value: 2 },
        ]}
        total={102}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies custom className to individual items', () => {
    render(
      <ReviewTotals
        items={[
          { label: 'Amount', value: 100 },
          { label: 'Fee', value: 5, className: 'item-custom' },
        ]}
        total={105}
      />
    );

    const feeRow = screen.getByText('Fee').closest('div');
    expect(feeRow).toHaveClass('item-custom');
  });

  it('renders multiple fee items correctly', () => {
    render(
      <ReviewTotals
        items={[
          { label: 'Amount', value: 500 },
          { label: 'Transfer fee', value: 10 },
          { label: 'Processing fee', value: 3 },
        ]}
        total={513}
      />
    );

    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Transfer fee')).toBeInTheDocument();
    expect(screen.getByText('Processing fee')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('$513.00')).toBeInTheDocument();
  });
});
