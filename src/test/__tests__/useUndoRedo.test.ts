import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from '../../pages/WidgetDesignerPage/useUndoRedo';

describe('useUndoRedo', () => {
  it('should initialize with the given state', () => {
    const { result } = renderHook(() => useUndoRedo('initial'));
    expect(result.current.state).toBe('initial');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should update state with set', () => {
    const { result } = renderHook(() => useUndoRedo('a'));
    act(() => result.current.set('b'));
    expect(result.current.state).toBe('b');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should undo to previous state', () => {
    const { result } = renderHook(() => useUndoRedo('a'));
    act(() => result.current.set('b'));
    act(() => result.current.set('c'));
    act(() => result.current.undo());
    expect(result.current.state).toBe('b');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);
  });

  it('should redo after undo', () => {
    const { result } = renderHook(() => useUndoRedo('a'));
    act(() => result.current.set('b'));
    act(() => result.current.undo());
    act(() => result.current.redo());
    expect(result.current.state).toBe('b');
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should clear redo stack on new set', () => {
    const { result } = renderHook(() => useUndoRedo('a'));
    act(() => result.current.set('b'));
    act(() => result.current.set('c'));
    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);
    act(() => result.current.set('d'));
    expect(result.current.canRedo).toBe(false);
    expect(result.current.state).toBe('d');
  });

  it('should not change state when undo stack is empty', () => {
    const { result } = renderHook(() => useUndoRedo('a'));
    act(() => result.current.undo());
    expect(result.current.state).toBe('a');
  });

  it('should not change state when redo stack is empty', () => {
    const { result } = renderHook(() => useUndoRedo('a'));
    act(() => result.current.redo());
    expect(result.current.state).toBe('a');
  });

  it('should reset state and clear stacks', () => {
    const { result } = renderHook(() => useUndoRedo('a'));
    act(() => result.current.set('b'));
    act(() => result.current.set('c'));
    act(() => result.current.reset('x'));
    expect(result.current.state).toBe('x');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should handle multiple undo operations', () => {
    const { result } = renderHook(() => useUndoRedo('a'));
    act(() => result.current.set('b'));
    act(() => result.current.set('c'));
    act(() => result.current.set('d'));
    act(() => result.current.undo());
    act(() => result.current.undo());
    act(() => result.current.undo());
    expect(result.current.state).toBe('a');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('should work with complex objects', () => {
    const { result } = renderHook(() => useUndoRedo({ count: 0 }));
    act(() => result.current.set({ count: 1 }));
    act(() => result.current.set({ count: 2 }));
    act(() => result.current.undo());
    expect(result.current.state).toEqual({ count: 1 });
  });

  it('should limit undo stack to 50 entries', () => {
    const { result } = renderHook(() => useUndoRedo(0));
    for (let i = 1; i <= 60; i++) {
      act(() => result.current.set(i));
    }
    let undoCount = 0;
    while (result.current.canUndo) {
      act(() => result.current.undo());
      undoCount++;
    }
    expect(undoCount).toBeLessThanOrEqual(50);
  });
});
