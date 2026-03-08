export interface N8NAutonomousAgentConfig {
  api_version: string;
  workflow_endpoint: string;
  api_api_key_credential_id: string;
}

export const N8NApiVersionEnum = {
  V1: 'v1',
} as const;

export type N8NApiVersionEnum = typeof N8NApiVersionEnum[keyof typeof N8NApiVersionEnum];

export const N8NWorkflowTypeEnum = {
  N8N_CHAT_AGENT_WORKFLOW: 'N8N_CHAT_AGENT_WORKFLOW',
} as const;

export type N8NWorkflowTypeEnum = typeof N8NWorkflowTypeEnum[keyof typeof N8NWorkflowTypeEnum];

export interface N8NChatAgentConfig {
  api_version: N8NApiVersionEnum;
  workflow_type: N8NWorkflowTypeEnum;
  use_unified_chat_history: boolean;
  chat_history_count?: number;
  chat_url: string;
  workflow_endpoint: string;
  api_api_key_credential_id: string;
  chat_auth_credential_id?: string;
}

export const FoundryAgentTypeEnum = {
  AGENT: 'AGENT',
  MULTI_AGENT: 'MULTI_AGENT',
} as const;

export type FoundryAgentTypeEnum = typeof FoundryAgentTypeEnum[keyof typeof FoundryAgentTypeEnum];

export const FoundryApiVersionEnum = {
  V2025_11_15_PREVIEW: '2025-11-15-preview',
} as const;

export type FoundryApiVersionEnum = typeof FoundryApiVersionEnum[keyof typeof FoundryApiVersionEnum];

export interface FoundryChatAgentConfig {
  agent_type: FoundryAgentTypeEnum;
  api_version: FoundryApiVersionEnum;
  project_endpoint: string;
  agent_name: string;
}
