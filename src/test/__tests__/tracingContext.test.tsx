import { describe, it, expect, beforeAll } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { TracingProvider, useTracing } from '../../components/tracing/TracingContext';
import type { FullTraceResponse } from '../../api/types';

beforeAll(() => {
  if (typeof window.localStorage?.getItem !== 'function') {
    const store = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
        setItem: (key: string, value: string) => { store.set(key, String(value)); },
        removeItem: (key: string) => { store.delete(key); },
        clear: () => { store.clear(); },
        key: (index: number) => Array.from(store.keys())[index] ?? null,
        get length() { return store.size; },
      },
    });
  }
});

const makeTrace = (
  id: string,
  createdAt: string,
  nodeIds: string[]
): FullTraceResponse => ({
  id,
  tenantId: 'tenant-1',
  contextType: 'conversation',
  referenceId: id,
  referenceName: 'N8N Workflow Execution',
  conversationId: 'conv-1',
  nodes: nodeIds.map((nid) => ({
    id: nid,
    name: nid,
    type: 'workflow',
    status: 'completed',
  })),
  createdAt,
  updatedAt: createdAt,
});

const wrapperFor = (traces: FullTraceResponse[]) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <TracingProvider traces={traces}>{children}</TracingProvider>;
  };

describe('TracingContext', () => {
  it('returns the single trace as combinedTrace when only one trace exists', () => {
    const traces = [makeTrace('t1', '2026-01-01T00:00:00Z', ['a', 'b'])];
    const { result } = renderHook(() => useTracing(), { wrapper: wrapperFor(traces) });

    expect(result.current.combinedTrace?.id).toBe('t1');
    expect(result.current.combinedTrace?.nodes.map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('merges multiple traces into one combinedTrace ordered by createdAt', () => {
    const traces = [
      makeTrace('t2', '2026-01-02T00:00:00Z', ['c', 'd']),
      makeTrace('t1', '2026-01-01T00:00:00Z', ['a', 'b']),
    ];
    const { result } = renderHook(() => useTracing(), { wrapper: wrapperFor(traces) });

    expect(result.current.combinedTrace?.nodes.map((n) => n.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('selectNode finds a node in a non-default trace and switches selectedTrace', () => {
    const traces = [
      makeTrace('t1', '2026-01-01T00:00:00Z', ['a', 'b']),
      makeTrace('t2', '2026-01-02T00:00:00Z', ['c', 'd']),
    ];
    const { result } = renderHook(() => useTracing(), { wrapper: wrapperFor(traces) });

    act(() => {
      result.current.selectNode('d');
    });

    expect(result.current.selectedNode?.id).toBe('d');
    expect(result.current.selectedTrace?.id).toBe('t2');
  });

  it('selectNode(null) clears the selection', () => {
    const traces = [makeTrace('t1', '2026-01-01T00:00:00Z', ['a'])];
    const { result } = renderHook(() => useTracing(), { wrapper: wrapperFor(traces) });

    act(() => {
      result.current.selectNode('a');
    });
    expect(result.current.selectedNode?.id).toBe('a');

    act(() => {
      result.current.selectNode(null);
    });
    expect(result.current.selectedNode).toBeNull();
  });
});
