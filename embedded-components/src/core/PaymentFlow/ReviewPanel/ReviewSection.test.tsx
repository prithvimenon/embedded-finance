import { describe, expect, it } from 'vitest';
import { render, screen } from '@test-utils';

import { ReviewPlaceholder, ReviewSection } from './ReviewSection';

// --- ReviewSection tests ---

describe('ReviewSection', () => {
  it('renders title and children content', () => {
    render(
      <ReviewSection title="Amount">
        <span>$250.00</span>
      </ReviewSection>
    );

    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('$250.00')).toBeInTheDocument();
  });

  it('renders with an icon', () => {
    render(
      <ReviewSection title="Method" icon={<svg data-testid="icon" />}>
        <span>ACH</span>
      </ReviewSection>
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Method')).toBeInTheDocument();
    expect(screen.getByText('ACH')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ReviewSection title="Fee" className="eb-custom-class">
        <span>$2.50</span>
      </ReviewSection>
    );

    const section = container.querySelector('.eb-custom-class');
    expect(section).toBeInTheDocument();
  });
});

// --- ReviewPlaceholder tests ---

describe('ReviewPlaceholder', () => {
  it('renders default placeholder text', () => {
    render(<ReviewPlaceholder />);
    expect(screen.getByText('\u2014')).toBeInTheDocument();
  });

  it('renders custom placeholder text', () => {
    render(<ReviewPlaceholder text="Not selected" />);
    expect(screen.getByText('Not selected')).toBeInTheDocument();
  });
});
