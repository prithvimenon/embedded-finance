import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createUserEventContext,
  getUserEventName,
  trackUserEvent,
  useUserEventTracking,
} from './userTracking';

describe('getUserEventName', () => {
  it('returns data-user-event attribute value', () => {
    const el = document.createElement('div');
    el.setAttribute('data-user-event', 'test-journey');
    expect(getUserEventName(el)).toBe('test-journey');
  });

  it('returns null when attribute is missing', () => {
    const el = document.createElement('div');
    expect(getUserEventName(el)).toBeNull();
  });
});

describe('createUserEventContext', () => {
  it('creates context with required fields', () => {
    const before = Date.now();
    const ctx = createUserEventContext('click-button', 'click');
    const after = Date.now();

    expect(ctx.actionName).toBe('click-button');
    expect(ctx.eventType).toBe('click');
    expect(ctx.timestamp).toBeGreaterThanOrEqual(before);
    expect(ctx.timestamp).toBeLessThanOrEqual(after);
    expect(ctx.element).toBeUndefined();
    expect(ctx.metadata).toBeUndefined();
  });

  it('includes optional element and metadata', () => {
    const el = document.createElement('button');
    const meta = { key: 'value' };
    const ctx = createUserEventContext('action', 'click', el, meta);

    expect(ctx.element).toBe(el);
    expect(ctx.metadata).toEqual(meta);
  });
});

describe('trackUserEvent', () => {
  it('does nothing when no userEventsHandler is provided', () => {
    // Should not throw
    trackUserEvent({ actionName: 'test' });
  });

  it('calls userEventsHandler with context', () => {
    const handler = vi.fn();
    trackUserEvent({
      actionName: 'test-action',
      eventType: 'click',
      userEventsHandler: handler,
    });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        actionName: 'test-action',
        eventType: 'click',
      })
    );
  });

  it('uses "programmatic" as default eventType', () => {
    const handler = vi.fn();
    trackUserEvent({
      actionName: 'test',
      userEventsHandler: handler,
    });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'programmatic' })
    );
  });

  it('calls lifecycle onEnter if provided', () => {
    const handler = vi.fn();
    const onEnter = vi.fn();
    trackUserEvent({
      actionName: 'test',
      userEventsHandler: handler,
      userEventsLifecycle: { onEnter },
    });

    expect(onEnter).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledOnce();
  });

  it('silently handles errors in handler', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handler = vi.fn().mockImplementation(() => {
      throw new Error('handler error');
    });

    // Should not throw
    trackUserEvent({
      actionName: 'test',
      userEventsHandler: handler,
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error tracking user event:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});

describe('useUserEventTracking', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('does nothing when no handler is provided', () => {
    // Should not throw
    renderHook(() =>
      useUserEventTracking({
        containerId: 'test-container',
      })
    );
  });

  it('attaches event listeners to container', () => {
    const handler = vi.fn();
    const button = document.createElement('button');
    button.setAttribute('data-user-event', 'test-button');
    container.appendChild(button);

    renderHook(() =>
      useUserEventTracking({
        containerId: 'test-container',
        userEventsHandler: handler,
      })
    );

    button.click();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        actionName: 'test-button',
        eventType: 'click',
      })
    );
  });

  it('ignores clicks on elements without data-user-event', () => {
    const handler = vi.fn();
    const button = document.createElement('button');
    container.appendChild(button);

    renderHook(() =>
      useUserEventTracking({
        containerId: 'test-container',
        userEventsHandler: handler,
      })
    );

    button.click();
    expect(handler).not.toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {
    const handler = vi.fn();
    const button = document.createElement('button');
    button.setAttribute('data-user-event', 'test');
    container.appendChild(button);

    const { unmount } = renderHook(() =>
      useUserEventTracking({
        containerId: 'test-container',
        userEventsHandler: handler,
      })
    );

    unmount();
    button.click();
    expect(handler).not.toHaveBeenCalled();
  });

  it('does nothing when container is not found', () => {
    const handler = vi.fn();
    // Should not throw
    renderHook(() =>
      useUserEventTracking({
        containerId: 'nonexistent-container',
        userEventsHandler: handler,
      })
    );
  });
});
