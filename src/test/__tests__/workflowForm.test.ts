import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  isSafeHttpUrl,
  buildFormWaitingUrl,
  openWorkflowForm,
} from '../../utils/workflowForm';
import { WorkflowFormOpenModeEnum } from '../../api/types';

describe('isSafeHttpUrl', () => {
  it('accepts http and https urls', () => {
    expect(isSafeHttpUrl('http://localhost:5678/form/abc')).toBe(true);
    expect(isSafeHttpUrl('https://n8n.example.com/form/abc')).toBe(true);
  });

  it.each(['javascript:alert(1)', 'data:text/html,<h1>x</h1>', 'file:///etc/passwd', 'ftp://host/x'])(
    'rejects unsafe scheme %s',
    (url) => {
      expect(isSafeHttpUrl(url)).toBe(false);
    }
  );

  it('rejects empty and malformed values', () => {
    expect(isSafeHttpUrl('')).toBe(false);
    expect(isSafeHttpUrl(undefined)).toBe(false);
    expect(isSafeHttpUrl(null)).toBe(false);
    expect(isSafeHttpUrl('not-a-url')).toBe(false);
  });
});

describe('buildFormWaitingUrl', () => {
  it('builds the form-waiting url from the origin of the trigger url', () => {
    expect(buildFormWaitingUrl('http://localhost:5678/form/abc-123', 'exec-42')).toBe(
      'http://localhost:5678/form-waiting/exec-42'
    );
  });

  it('encodes the execution id', () => {
    expect(buildFormWaitingUrl('https://n8n.example.com/form/abc', 'a/b c')).toBe(
      'https://n8n.example.com/form-waiting/a%2Fb%20c'
    );
  });

  it('returns null for unsafe or missing input', () => {
    expect(buildFormWaitingUrl('javascript:alert(1)', 'exec-42')).toBeNull();
    expect(buildFormWaitingUrl(undefined, 'exec-42')).toBeNull();
    expect(buildFormWaitingUrl('http://localhost:5678/form/abc', '')).toBeNull();
  });
});

describe('openWorkflowForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens a tab by default', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    expect(openWorkflowForm('http://localhost:5678/form/abc', WorkflowFormOpenModeEnum.TAB)).toBe(true);
    expect(open).toHaveBeenCalledWith('http://localhost:5678/form/abc', '_blank', 'noopener,noreferrer');
  });

  it('opens a popup window in WINDOW mode', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    expect(openWorkflowForm('http://localhost:5678/form/abc', WorkflowFormOpenModeEnum.WINDOW)).toBe(true);
    expect(open).toHaveBeenCalledWith(
      'http://localhost:5678/form/abc',
      '_blank',
      'noopener,noreferrer,popup=yes,width=1024,height=800'
    );
  });

  it('does not open unsafe urls', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    expect(openWorkflowForm('javascript:alert(1)', WorkflowFormOpenModeEnum.TAB)).toBe(false);
    expect(open).not.toHaveBeenCalled();
  });
});
