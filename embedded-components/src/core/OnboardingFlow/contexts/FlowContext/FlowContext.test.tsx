import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useFlowContext } from './FlowContext';

describe('FlowContext', () => {
  it('returns default context values when used outside provider', () => {
    const { result } = renderHook(() => useFlowContext());
    expect(result.current.currentScreenId).toBe('overview');
    expect(result.current.editingPartyIds).toEqual({});
    expect(result.current.staticScreens).toEqual([]);
    expect(result.current.sections).toEqual([]);
    expect(result.current.sessionData).toEqual({});
    expect(result.current.previouslyCompleted).toBe(false);
    expect(result.current.isFormSubmitting).toBe(false);
  });

  it('default goTo throws error', () => {
    const { result } = renderHook(() => useFlowContext());
    expect(() => result.current.goTo('overview')).toThrow(
      'goTo() must be used within FlowProvider'
    );
  });

  it('default goBack throws error', () => {
    const { result } = renderHook(() => useFlowContext());
    expect(() => result.current.goBack()).toThrow(
      'goBack() must be used within FlowProvider'
    );
  });

  it('default saveFormValue throws error', () => {
    const { result } = renderHook(() => useFlowContext());
    expect(() =>
      result.current.saveFormValue('organizationName', 'test')
    ).toThrow('saveFormValue() must be used within FlowProvider');
  });
});
