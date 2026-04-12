import { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { SandboxRequest, SandboxResponse, SandboxAction } from './sandboxProtocol';

type FieldValue = string | number | boolean | string[] | [number, number] | File | null;

interface PendingCall {
  resolve: (result: { returnValue: unknown; actions: SandboxAction[] }) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const SANDBOX_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script>
window.addEventListener('message', function(e) {
  var msg = e.data;
  if (!msg || msg.type !== 'execute') return;
  var actions = [];
  var sandboxActions = { setFieldValue: function(id, val) { actions.push({ method: 'setFieldValue', args: [id, val] }); } };
  try {
    var fn = new Function('fields', 'actions', 'context',
      msg.code + '\\nreturn typeof onFormLoad === "function" ? onFormLoad(fields, actions, context) : typeof onBeforeSubmit === "function" ? onBeforeSubmit(fields, actions, context) : typeof onFieldChange === "function" ? onFieldChange(context.fieldId, fields, actions) : undefined;'
    );
    var result = fn(msg.fields, sandboxActions, msg.context);
    e.source.postMessage({ id: msg.id, type: 'result', returnValue: result, actions: actions }, '*');
  } catch (err) {
    e.source.postMessage({ id: msg.id, type: 'error', message: String(err && err.message || err) }, '*');
  }
});
</script></body></html>`;

const TIMEOUT_MS = 3000;

export interface FormSandboxHandle {
  execute: (
    code: string,
    fields: Record<string, unknown>,
    context: Record<string, unknown>,
  ) => Promise<unknown>;
}

interface FormSandboxProps {
  onSetFieldValue: (id: string, val: FieldValue) => void;
}

export const FormSandbox = forwardRef<FormSandboxHandle, FormSandboxProps>(
  ({ onSetFieldValue }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const pendingRef = useRef<Map<string, PendingCall>>(new Map());
    const idCounter = useRef(0);

    useEffect(() => {
      const handler = (event: MessageEvent) => {
        const data = event.data as SandboxResponse | undefined;
        if (!data || !data.id) return;
        const pending = pendingRef.current.get(data.id);
        if (!pending) return;
        pendingRef.current.delete(data.id);
        clearTimeout(pending.timer);

        if (data.type === 'error') {
          pending.resolve({ returnValue: undefined, actions: [] });
          return;
        }

        for (const action of data.actions) {
          if (action.method === 'setFieldValue') {
            onSetFieldValue(action.args[0] as string, action.args[1] as FieldValue);
          }
        }
        pending.resolve({ returnValue: data.returnValue, actions: data.actions });
      };

      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    }, [onSetFieldValue]);

    const execute = useCallback((
      code: string,
      fields: Record<string, unknown>,
      context: Record<string, unknown>,
    ): Promise<unknown> => {
      return new Promise((resolve) => {
        const iframe = iframeRef.current;
        if (!iframe?.contentWindow) {
          resolve(undefined);
          return;
        }

        const id = `sb-${++idCounter.current}`;
        const timer = setTimeout(() => {
          pendingRef.current.delete(id);
          resolve(undefined);
        }, TIMEOUT_MS);

        pendingRef.current.set(id, { resolve: (r) => resolve(r.returnValue), reject: () => resolve(undefined), timer });

        const msg: SandboxRequest = { id, type: 'execute', code, fields, context };
        iframe.contentWindow.postMessage(msg, '*');
      });
    }, []);

    useImperativeHandle(ref, () => ({ execute }), [execute]);

    useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const blob = new Blob([SANDBOX_HTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      iframe.src = url;
      return () => URL.revokeObjectURL(url);
    }, []);

    return (
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts"
        style={{ display: 'none', width: 0, height: 0, border: 'none' }}
        title="sandbox"
      />
    );
  },
);

FormSandbox.displayName = 'FormSandbox';
