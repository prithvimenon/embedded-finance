import { act, renderHook, waitFor } from '@testing-library/react';

import { FlowContextProvider, useFlowContext } from './FlowContext';

/**
 * Helper to render the useFlowContext hook inside a FlowContextProvider
 */
function renderFlowContext(
  props?: Partial<{
    initialView: 'main' | 'payee-type' | 'link-account' | 'success';
    initialData: Record<string, unknown>;
    isSubmitting: boolean;
    resetKey: string | number;
  }>
) {
  return renderHook(() => useFlowContext(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <FlowContextProvider {...props}>{children}</FlowContextProvider>
    ),
  });
}

describe('FlowContext', () => {
  describe('useFlowContext outside provider', () => {
    it('throws an error when used outside FlowContextProvider', () => {
      // Suppress console.error for the expected error
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        renderHook(() => useFlowContext());
      }).toThrow('useFlowContext must be used within a FlowContextProvider');
      spy.mockRestore();
    });
  });

  describe('initial state', () => {
    it('has correct default initial state', () => {
      const { result } = renderFlowContext();

      expect(result.current.currentView).toBe('main');
      expect(result.current.canGoBack).toBe(false);
      expect(result.current.formData).toEqual({
        amount: '',
        currency: 'USD',
      });
      expect(result.current.expandedPanels).toEqual([]);
      expect(result.current.validationErrors).toEqual([]);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isComplete).toBe(false);
    });

    it('accepts custom initialView', () => {
      const { result } = renderFlowContext({ initialView: 'success' });
      expect(result.current.currentView).toBe('success');
    });

    it('accepts custom initialData merged with defaults', () => {
      const { result } = renderFlowContext({
        initialData: { payeeId: 'payee-1', amount: '50.00' },
      });
      expect(result.current.formData.payeeId).toBe('payee-1');
      expect(result.current.formData.amount).toBe('50.00');
      expect(result.current.formData.currency).toBe('USD');
    });
  });

  describe('PUSH_VIEW', () => {
    it('pushes a new view onto the stack', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.pushView('payee-type');
      });

      expect(result.current.currentView).toBe('payee-type');
      expect(result.current.canGoBack).toBe(true);
    });

    it('pushes a view with additional form data', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.pushView('payee-type', { payeeId: 'payee-1' });
      });

      expect(result.current.currentView).toBe('payee-type');
      expect(result.current.formData.payeeId).toBe('payee-1');
    });

    it('stacks multiple views', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.pushView('payee-type');
      });
      act(() => {
        result.current.pushView('link-account');
      });

      expect(result.current.currentView).toBe('link-account');
      expect(result.current.canGoBack).toBe(true);
    });
  });

  describe('POP_VIEW', () => {
    it('pops the current view and goes back', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.pushView('payee-type');
      });
      act(() => {
        result.current.popView();
      });

      expect(result.current.currentView).toBe('main');
      expect(result.current.canGoBack).toBe(false);
    });

    it('returns to main when stack is empty', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.popView();
      });

      expect(result.current.currentView).toBe('main');
      expect(result.current.canGoBack).toBe(false);
    });

    it('pops correctly through multiple views', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.pushView('payee-type');
      });
      act(() => {
        result.current.pushView('link-account');
      });
      act(() => {
        result.current.popView();
      });

      expect(result.current.currentView).toBe('payee-type');
      expect(result.current.canGoBack).toBe(true);
    });
  });

  describe('REPLACE_VIEW', () => {
    it('replaces the current view without adding to stack', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.replaceView('success');
      });

      expect(result.current.currentView).toBe('success');
      expect(result.current.canGoBack).toBe(false);
    });

    it('replaces the current view with additional form data', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.replaceView('success', {
          paymentMethod: 'ACH',
        });
      });

      expect(result.current.currentView).toBe('success');
      expect(result.current.formData.paymentMethod).toBe('ACH');
    });
  });

  describe('SET_FORM_DATA', () => {
    it('updates form data', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.setFormData({ payeeId: 'payee-1' });
      });

      expect(result.current.formData.payeeId).toBe('payee-1');
      expect(result.current.formData.amount).toBe('');
    });

    it('merges form data', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.setFormData({ payeeId: 'payee-1' });
      });
      act(() => {
        result.current.setFormData({ amount: '100.00' });
      });

      expect(result.current.formData.payeeId).toBe('payee-1');
      expect(result.current.formData.amount).toBe('100.00');
    });
  });

  describe('TOGGLE_PANEL', () => {
    it('expands a panel', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.togglePanel('panel-1');
      });

      expect(result.current.expandedPanels).toEqual(['panel-1']);
      expect(result.current.isPanelExpanded('panel-1')).toBe(true);
      expect(result.current.isPanelExpanded('panel-2')).toBe(false);
    });

    it('collapses a panel when toggled again', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.togglePanel('panel-1');
      });
      act(() => {
        result.current.togglePanel('panel-1');
      });

      expect(result.current.expandedPanels).toEqual([]);
      expect(result.current.isPanelExpanded('panel-1')).toBe(false);
    });

    it('supports multiple expanded panels', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.togglePanel('panel-1');
      });
      act(() => {
        result.current.togglePanel('panel-2');
      });

      expect(result.current.expandedPanels).toEqual(['panel-1', 'panel-2']);
      expect(result.current.isPanelExpanded('panel-1')).toBe(true);
      expect(result.current.isPanelExpanded('panel-2')).toBe(true);
    });
  });

  describe('SET_VALIDATION_ERRORS / CLEAR_VALIDATION_ERRORS', () => {
    it('sets validation errors', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.setValidationErrors(['payee', 'amount']);
      });

      expect(result.current.validationErrors).toEqual(['payee', 'amount']);
    });

    it('clears validation errors', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.setValidationErrors(['payee', 'amount']);
      });
      act(() => {
        result.current.clearValidationErrors();
      });

      expect(result.current.validationErrors).toEqual([]);
    });
  });

  describe('SET_SUBMITTING', () => {
    it('starts with isSubmitting=true when external prop is true', () => {
      const { result } = renderFlowContext({ isSubmitting: true });

      expect(result.current.isSubmitting).toBe(true);
    });

    it('syncs external isSubmitting prop from false to true', async () => {
      let isSubmitting = false;
      const { result, rerender } = renderHook(() => useFlowContext(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <FlowContextProvider isSubmitting={isSubmitting}>
            {children}
          </FlowContextProvider>
        ),
      });

      expect(result.current.isSubmitting).toBe(false);

      isSubmitting = true;
      rerender({});

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });
    });

    it('syncs external isSubmitting prop from true to false', async () => {
      let isSubmitting = true;
      const { result, rerender } = renderHook(() => useFlowContext(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <FlowContextProvider isSubmitting={isSubmitting}>
            {children}
          </FlowContextProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      isSubmitting = false;
      rerender({});

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });
  });

  describe('isComplete computation', () => {
    it('returns false when no fields are filled', () => {
      const { result } = renderFlowContext();
      expect(result.current.isComplete).toBe(false);
    });

    it('returns false when only some required fields are filled', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.setFormData({
          payeeId: 'payee-1',
          paymentMethod: 'ACH',
        });
      });

      expect(result.current.isComplete).toBe(false);
    });

    it('returns true when all required fields are filled (payeeId + paymentMethod + fromAccountId + amount > 0)', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.setFormData({
          payeeId: 'payee-1',
          paymentMethod: 'ACH',
          fromAccountId: 'account-1',
          amount: '100.00',
        });
      });

      expect(result.current.isComplete).toBe(true);
    });

    it('returns true when unsavedRecipient is used instead of payeeId', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.setFormData({
          unsavedRecipient: {
            displayName: 'John Doe',
            accountNumber: '****7890',
            routingNumber: '123456789',
            enabledPaymentMethods: ['ACH'],
            transactionRecipient: {} as never,
          },
          paymentMethod: 'ACH',
          fromAccountId: 'account-1',
          amount: '50.00',
        });
      });

      expect(result.current.isComplete).toBe(true);
    });

    it('returns false when amount is 0', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.setFormData({
          payeeId: 'payee-1',
          paymentMethod: 'ACH',
          fromAccountId: 'account-1',
          amount: '0',
        });
      });

      expect(result.current.isComplete).toBe(false);
    });

    it('returns false when amount is empty', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.setFormData({
          payeeId: 'payee-1',
          paymentMethod: 'ACH',
          fromAccountId: 'account-1',
          amount: '',
        });
      });

      expect(result.current.isComplete).toBe(false);
    });

    it('returns false when amount exceeds available balance', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.setFormData({
          payeeId: 'payee-1',
          paymentMethod: 'ACH',
          fromAccountId: 'account-1',
          amount: '1000.00',
          availableBalance: 500,
        });
      });

      expect(result.current.isComplete).toBe(false);
    });

    it('returns true when amount is within available balance', () => {
      const { result } = renderFlowContext();

      act(() => {
        result.current.setFormData({
          payeeId: 'payee-1',
          paymentMethod: 'ACH',
          fromAccountId: 'account-1',
          amount: '100.00',
          availableBalance: 500,
        });
      });

      expect(result.current.isComplete).toBe(true);
    });
  });

  describe('RESET', () => {
    it('resets state when resetKey changes', () => {
      let resetKey = 'key-1';
      const { result, rerender } = renderHook(() => useFlowContext(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <FlowContextProvider resetKey={resetKey}>
            {children}
          </FlowContextProvider>
        ),
      });

      // Set some state
      act(() => {
        result.current.setFormData({
          payeeId: 'payee-1',
          amount: '100.00',
        });
      });
      act(() => {
        result.current.pushView('payee-type');
      });

      expect(result.current.formData.payeeId).toBe('payee-1');
      expect(result.current.currentView).toBe('payee-type');

      // Change resetKey
      resetKey = 'key-2';
      rerender({});

      expect(result.current.formData).toEqual({
        amount: '',
        currency: 'USD',
      });
      expect(result.current.currentView).toBe('main');
      expect(result.current.canGoBack).toBe(false);
    });
  });
});
