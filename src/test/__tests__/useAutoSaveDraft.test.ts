import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSaveDraft } from '../../pages/WidgetDesignerPage/useAutoSaveDraft';
import type { WidgetFormSchema } from '../../pages/WidgetDesignerPage/types';

const makeSchema = (title = 'Test'): WidgetFormSchema => ({
  version: 2,
  settings: {
    title,
    description: '',
    submitButtonText: 'Submit',
    successMessage: '',
    enableTabs: false,
    showProgressBar: false,
    validateOnTabChange: false,
  },
  tabs: [{ id: 'tab_1', label: 'Tab 1', fieldIds: [] }],
  fields: [],
  dataSources: [],
  scripts: {},
});

const store: Record<string, string> = {};

const mockLocalStorage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, val: string) => { store[key] = val; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
  get length() { return Object.keys(store).length; },
  key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
};

describe('useAutoSaveDraft', () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return no draft when nothing is stored', () => {
    const schema = makeSchema();
    const { result } = renderHook(() =>
      useAutoSaveDraft('widget-1', schema, schema, false),
    );
    expect(result.current.hasDraft).toBe(false);
    expect(result.current.draftTimestamp).toBeNull();
  });

  it('should detect stored draft on load', () => {
    const timestamp = Date.now();
    const draft = { schema: makeSchema('Draft'), timestamp };
    store['widget-designer-draft:widget-1'] = JSON.stringify(draft);

    const schema = makeSchema();
    const { result } = renderHook(() =>
      useAutoSaveDraft('widget-1', schema, schema, false),
    );
    expect(result.current.hasDraft).toBe(true);
    expect(result.current.draftTimestamp).toBe(timestamp);
  });

  it('should not detect draft while loading', () => {
    const draft = { schema: makeSchema('Draft'), timestamp: Date.now() };
    store['widget-designer-draft:widget-1'] = JSON.stringify(draft);

    const schema = makeSchema();
    const { result } = renderHook(() =>
      useAutoSaveDraft('widget-1', schema, schema, true),
    );
    expect(result.current.hasDraft).toBe(false);
  });

  it('should restore draft and return schema', () => {
    const draftSchema = makeSchema('Restored');
    const draft = { schema: draftSchema, timestamp: Date.now() };
    store['widget-designer-draft:widget-1'] = JSON.stringify(draft);

    const schema = makeSchema();
    const { result } = renderHook(() =>
      useAutoSaveDraft('widget-1', schema, schema, false),
    );

    let restored: WidgetFormSchema | null = null;
    act(() => {
      restored = result.current.restoreDraft();
    });
    expect(restored).toEqual(draftSchema);
    expect(result.current.hasDraft).toBe(false);
  });

  it('should discard draft', () => {
    const draft = { schema: makeSchema('Draft'), timestamp: Date.now() };
    store['widget-designer-draft:widget-1'] = JSON.stringify(draft);

    const schema = makeSchema();
    const { result } = renderHook(() =>
      useAutoSaveDraft('widget-1', schema, schema, false),
    );
    expect(result.current.hasDraft).toBe(true);

    act(() => {
      result.current.discardDraft();
    });
    expect(result.current.hasDraft).toBe(false);
    expect(store['widget-designer-draft:widget-1']).toBeUndefined();
  });

  it('should clear draft', () => {
    const draft = { schema: makeSchema('Draft'), timestamp: Date.now() };
    store['widget-designer-draft:widget-1'] = JSON.stringify(draft);

    const schema = makeSchema();
    const { result } = renderHook(() =>
      useAutoSaveDraft('widget-1', schema, schema, false),
    );

    act(() => {
      result.current.clearDraft();
    });
    expect(store['widget-designer-draft:widget-1']).toBeUndefined();
  });

  it('should auto-save when schema changes', () => {
    const saved = makeSchema('Original');
    const modified = makeSchema('Modified');

    renderHook(
      ({ schema }) => useAutoSaveDraft('widget-1', schema, saved, false),
      { initialProps: { schema: modified } },
    );

    expect(store['widget-designer-draft:widget-1']).toBeDefined();
    const parsed = JSON.parse(store['widget-designer-draft:widget-1']);
    expect(parsed.schema.settings.title).toBe('Modified');
  });

  it('should clean expired drafts on mount', () => {
    const expired = Date.now() - 8 * 24 * 60 * 60 * 1000;
    store['widget-designer-draft:old'] = JSON.stringify({
      schema: makeSchema(),
      timestamp: expired,
    });
    store['widget-designer-draft:recent'] = JSON.stringify({
      schema: makeSchema(),
      timestamp: Date.now(),
    });

    const schema = makeSchema();
    renderHook(() => useAutoSaveDraft('widget-1', schema, schema, false));

    expect(store['widget-designer-draft:old']).toBeUndefined();
    expect(store['widget-designer-draft:recent']).toBeDefined();
  });

  it('should return null when restoring without widgetId', () => {
    const schema = makeSchema();
    const { result } = renderHook(() =>
      useAutoSaveDraft(undefined, schema, schema, false),
    );
    let restored: WidgetFormSchema | null = null;
    act(() => {
      restored = result.current.restoreDraft();
    });
    expect(restored).toBeNull();
  });
});
