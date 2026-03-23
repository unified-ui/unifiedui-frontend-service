import { useState, useCallback } from 'react';

const MAX_HISTORY = 50;

export interface UndoRedoActions<T> {
  state: T;
  set: (next: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (initial: T) => void;
}

export function useUndoRedo<T>(initialState: T): UndoRedoActions<T> {
  const [state, setState] = useState<T>(initialState);
  const [undoStack, setUndoStack] = useState<T[]>([]);
  const [redoStack, setRedoStack] = useState<T[]>([]);

  const set = useCallback((next: T) => {
    setState((prev) => {
      setUndoStack((stack) => [...stack.slice(-(MAX_HISTORY - 1)), prev]);
      setRedoStack([]);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      setUndoStack((stack) => {
        if (stack.length === 0) return stack;
        const previous = stack[stack.length - 1];
        setRedoStack((rs) => [...rs, prev]);
        setState(previous);
        return stack.slice(0, -1);
      });
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      setRedoStack((stack) => {
        if (stack.length === 0) return stack;
        const next = stack[stack.length - 1];
        setUndoStack((us) => [...us, prev]);
        setState(next);
        return stack.slice(0, -1);
      });
      return prev;
    });
  }, []);

  const reset = useCallback((initial: T) => {
    setState(initial);
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    state,
    set,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    reset,
  };
}
