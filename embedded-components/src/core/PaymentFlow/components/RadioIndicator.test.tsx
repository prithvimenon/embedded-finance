import { render } from '@testing-library/react';

import { RadioIndicator } from './RadioIndicator';

describe('RadioIndicator', () => {
  it('renders an unselected radio indicator', () => {
    const { container } = render(<RadioIndicator isSelected={false} />);

    const indicator = container.firstChild as HTMLElement;
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('eb-border-muted-foreground/50');
    expect(indicator).toHaveClass('eb-bg-background');
    // Should not render the filled circle
    expect(indicator.querySelector('svg')).toBeNull();
  });

  it('renders a selected radio indicator', () => {
    const { container } = render(<RadioIndicator isSelected />);

    const indicator = container.firstChild as HTMLElement;
    expect(indicator).toHaveClass('eb-border-primary');
    expect(indicator).toHaveClass('eb-bg-primary/5');
    // Should render the filled circle (Circle SVG)
    expect(indicator.querySelector('svg')).toBeInTheDocument();
  });

  it('renders a disabled radio indicator with reduced opacity', () => {
    const { container } = render(
      <RadioIndicator isSelected={false} disabled />
    );

    const indicator = container.firstChild as HTMLElement;
    expect(indicator).toHaveClass('eb-opacity-50');
  });

  it('renders a disabled selected radio indicator', () => {
    const { container } = render(
      <RadioIndicator isSelected disabled />
    );

    const indicator = container.firstChild as HTMLElement;
    expect(indicator).toHaveClass('eb-opacity-50');
    expect(indicator).toHaveClass('eb-border-primary');
    // Still shows the dot even when disabled
    expect(indicator.querySelector('svg')).toBeInTheDocument();
  });

  it('renders a locked radio indicator', () => {
    const { container } = render(
      <RadioIndicator isSelected={false} locked />
    );

    const indicator = container.firstChild as HTMLElement;
    expect(indicator).toHaveClass('eb-border-muted-foreground/30');
    expect(indicator).toHaveClass('eb-bg-transparent');
    expect(indicator).toHaveClass('eb-opacity-50');
    // Should not render the filled circle when locked
    expect(indicator.querySelector('svg')).toBeNull();
  });

  it('does not show dot when locked even if isSelected is true', () => {
    const { container } = render(
      <RadioIndicator isSelected locked />
    );

    const indicator = container.firstChild as HTMLElement;
    // locked takes precedence - no dot shown
    expect(indicator.querySelector('svg')).toBeNull();
    expect(indicator).toHaveClass('eb-border-muted-foreground/30');
  });

  it('renders with sm size variant', () => {
    const { container } = render(
      <RadioIndicator isSelected={false} size="sm" />
    );

    const indicator = container.firstChild as HTMLElement;
    expect(indicator).toHaveClass('eb-size-4');
  });

  it('renders with default md size variant', () => {
    const { container } = render(<RadioIndicator isSelected={false} />);

    const indicator = container.firstChild as HTMLElement;
    expect(indicator).toHaveClass('eb-size-5');
  });

  it('applies custom className', () => {
    const { container } = render(
      <RadioIndicator isSelected={false} className="custom-radio" />
    );

    const indicator = container.firstChild as HTMLElement;
    expect(indicator).toHaveClass('custom-radio');
  });

  it('has aria-hidden attribute', () => {
    const { container } = render(<RadioIndicator isSelected={false} />);

    const indicator = container.firstChild as HTMLElement;
    expect(indicator).toHaveAttribute('aria-hidden', 'true');
  });
});
