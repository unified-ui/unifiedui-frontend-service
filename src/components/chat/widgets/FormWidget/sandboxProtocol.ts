export interface SandboxRequest {
  id: string;
  type: 'execute';
  code: string;
  fields: Record<string, unknown>;
  context: Record<string, unknown>;
}

export interface SandboxResponseSuccess {
  id: string;
  type: 'result';
  returnValue: unknown;
  actions: SandboxAction[];
}

export interface SandboxResponseError {
  id: string;
  type: 'error';
  message: string;
}

export type SandboxResponse = SandboxResponseSuccess | SandboxResponseError;

export interface SandboxAction {
  method: 'setFieldValue';
  args: [string, unknown];
}

export const SANDBOX_ORIGIN = 'null';
export const SANDBOX_CHANNEL = 'widget-sandbox';
