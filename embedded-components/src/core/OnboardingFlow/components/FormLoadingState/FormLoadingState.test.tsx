import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormLoadingState } from './FormLoadingState';

describe('FormLoadingState', () => {
  it('renders without crashing', () => {
    const { container } = render(<FormLoadingState />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders the spinner icon', () => {
    const { container } = render(<FormLoadingState />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('renders the message when provided', () => {
    render(<FormLoadingState message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeTruthy();
  });

  it('renders without message text when not provided', () => {
    render(<FormLoadingState />);
    const p = document.querySelector('p');
    expect(p?.textContent).toBe('');
  });
});
