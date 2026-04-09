import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StepLayout } from './StepLayout';

describe('StepLayout', () => {
  it('renders title', () => {
    render(<StepLayout title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeTruthy();
  });

  it('renders description when provided', () => {
    render(<StepLayout title="Title" description="Test description" />);
    expect(screen.getByText('Test description')).toBeTruthy();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<StepLayout title="Title" />);
    const descP = container.querySelector('p.eb-text-sm.eb-font-normal');
    expect(descP).toBeNull();
  });

  it('renders string subTitle in a div', () => {
    render(<StepLayout title="Title" subTitle="Sub Title Text" />);
    expect(screen.getByText('Sub Title Text')).toBeTruthy();
  });

  it('renders ReactNode subTitle directly', () => {
    render(
      <StepLayout title="Title" subTitle={<span>Custom SubTitle</span>} />
    );
    expect(screen.getByText('Custom SubTitle')).toBeTruthy();
  });

  it('renders children', () => {
    render(
      <StepLayout title="Title">
        <div>Child Content</div>
      </StepLayout>
    );
    expect(screen.getByText('Child Content')).toBeTruthy();
  });

  it('renders spinner when showSpinner is true', () => {
    const { container } = render(<StepLayout title="Title" showSpinner />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('renders headerElement when provided', () => {
    render(
      <StepLayout
        title="Title"
        headerElement={<button type="button">Action</button>}
      />
    );
    expect(screen.getByText('Action')).toBeTruthy();
  });
});
