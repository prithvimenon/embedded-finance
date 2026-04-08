import { render, screen } from '@testing-library/react';

import { ReviewPlaceholder, ReviewSection } from './ReviewSection';

describe('ReviewSection', () => {
  it('renders the title', () => {
    render(
      <ReviewSection title="From Account">
        <span>Checking ****1234</span>
      </ReviewSection>
    );

    expect(screen.getByText('From Account')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <ReviewSection title="To">
        <span>John Doe</span>
      </ReviewSection>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders with an icon', () => {
    render(
      <ReviewSection
        title="Amount"
        icon={<span data-testid="test-icon">$</span>}
      >
        <span>$100.00</span>
      </ReviewSection>
    );

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ReviewSection title="Method" className="custom-class">
        <span>ACH</span>
      </ReviewSection>
    );

    const section = container.firstChild;
    expect(section).toHaveClass('custom-class');
  });

  it('renders complex children', () => {
    render(
      <ReviewSection title="Details">
        <div>
          <span>Line 1</span>
          <span>Line 2</span>
        </div>
      </ReviewSection>
    );

    expect(screen.getByText('Line 1')).toBeInTheDocument();
    expect(screen.getByText('Line 2')).toBeInTheDocument();
  });
});

describe('ReviewPlaceholder', () => {
  it('renders default dash text', () => {
    render(<ReviewPlaceholder />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders custom text', () => {
    render(<ReviewPlaceholder text="Not selected" />);
    expect(screen.getByText('Not selected')).toBeInTheDocument();
  });

  it('has muted foreground styling', () => {
    const { container } = render(<ReviewPlaceholder />);
    const span = container.querySelector('span');
    expect(span).toHaveClass('eb-text-muted-foreground');
  });
});
