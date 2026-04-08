import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useIPAddress } from './useIPAddress';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
};

describe('useIPAddress', () => {
  it('returns "1.1.1.1" in test environment after query resolves', async () => {
    const { result } = renderHook(() => useIPAddress(), {
      wrapper: createWrapper(),
    });

    // Initially placeholderData provides '0.0.0.0'
    expect(result.current.data).toBe('0.0.0.0');

    // Wait for the queryFn to resolve with the test value
    await waitFor(() => {
      expect(result.current.data).toBe('1.1.1.1');
    });
  });

  it('has placeholderData of "0.0.0.0" before query resolves', () => {
    const { result } = renderHook(() => useIPAddress(), {
      wrapper: createWrapper(),
    });

    // placeholderData ensures we always have a value
    expect(result.current.data).toBe('0.0.0.0');
  });
});
