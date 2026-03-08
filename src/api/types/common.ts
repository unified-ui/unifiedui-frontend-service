export const TenantPermissionEnum = {
  READER: 'READER',
  TENANT_GLOBAL_ADMIN: 'TENANT_GLOBAL_ADMIN',
  CHAT_AGENTS_ADMIN: 'CHAT_AGENTS_ADMIN',
  CHAT_AGENTS_CREATOR: 'CHAT_AGENTS_CREATOR',
  AUTONOMOUS_AGENTS_ADMIN: 'AUTONOMOUS_AGENTS_ADMIN',
  AUTONOMOUS_AGENTS_CREATOR: 'AUTONOMOUS_AGENTS_CREATOR',
  CONVERSATIONS_ADMIN: 'CONVERSATIONS_ADMIN',
  CONVERSATIONS_CREATOR: 'CONVERSATIONS_CREATOR',
  CREDENTIALS_ADMIN: 'CREDENTIALS_ADMIN',
  CREDENTIALS_CREATOR: 'CREDENTIALS_CREATOR',
  CUSTOM_GROUP_CREATOR: 'CUSTOM_GROUP_CREATOR',
  CUSTOM_GROUPS_ADMIN: 'CUSTOM_GROUPS_ADMIN',
  CHAT_WIDGETS_ADMIN: 'CHAT_WIDGETS_ADMIN',
  CHAT_WIDGETS_CREATOR: 'CHAT_WIDGETS_CREATOR',
  REACT_AGENT_ADMIN: 'REACT_AGENT_ADMIN',
  REACT_AGENT_CREATOR: 'REACT_AGENT_CREATOR',
  TENANT_AI_MODELS_ADMIN: 'TENANT_AI_MODELS_ADMIN',
} as const;

export type TenantPermissionEnum = typeof TenantPermissionEnum[keyof typeof TenantPermissionEnum];

export const PermissionActionEnum = {
  ADMIN: 'ADMIN',
  WRITE: 'WRITE',
  READ: 'READ',
} as const;

export type PermissionActionEnum = typeof PermissionActionEnum[keyof typeof PermissionActionEnum];

export const PrincipalTypeEnum = {
  IDENTITY_USER: 'IDENTITY_USER',
  IDENTITY_GROUP: 'IDENTITY_GROUP',
  CUSTOM_GROUP: 'CUSTOM_GROUP',
} as const;

export type PrincipalTypeEnum = typeof PrincipalTypeEnum[keyof typeof PrincipalTypeEnum];

export const ChatAgentTypeEnum = {
  N8N: 'N8N',
  MICROSOFT_FOUNDRY: 'MICROSOFT_FOUNDRY',
  REST_API: 'REST_API',
  REACT_AGENT: 'REACT_AGENT',
} as const;

export type ChatAgentTypeEnum = typeof ChatAgentTypeEnum[keyof typeof ChatAgentTypeEnum];

export const ChatWidgetTypeEnum = {
  IFRAME: 'IFRAME',
  FORM: 'FORM',
} as const;

export type ChatWidgetTypeEnum = typeof ChatWidgetTypeEnum[keyof typeof ChatWidgetTypeEnum];

export const AutonomousAgentTypeEnum = {
  N8N: 'N8N',
} as const;

export type AutonomousAgentTypeEnum = typeof AutonomousAgentTypeEnum[keyof typeof AutonomousAgentTypeEnum];

export const FavoriteResourceTypeEnum = {
  CHAT_AGENT: 'chat-agents',
  AUTONOMOUS_AGENT: 'autonomous-agents',
  CHAT_WIDGET: 'chat-widgets',
  CONVERSATION: 'conversations',
} as const;

export type FavoriteResourceTypeEnum = typeof FavoriteResourceTypeEnum[keyof typeof FavoriteResourceTypeEnum];

export const EnvironmentTypeEnum = {
  SANDBOX: 'SANDBOX',
  PRODUCTION: 'PRODUCTION',
} as const;

export type EnvironmentTypeEnum = typeof EnvironmentTypeEnum[keyof typeof EnvironmentTypeEnum];

export const OrganizationRoleEnum = {
  ORGANISATION_GLOBAL_ADMIN: 'ORGANISATION_GLOBAL_ADMIN',
  ORGANISATION_TENANT_ADMIN: 'ORGANISATION_TENANT_ADMIN',
  ORGANISATION_TENANT_CREATOR: 'ORGANISATION_TENANT_CREATOR',
} as const;

export type OrganizationRoleEnum = typeof OrganizationRoleEnum[keyof typeof OrganizationRoleEnum];

export const CredentialTypeEnum = {
  API_KEY: 'API_KEY',
  BASIC_AUTH: 'BASIC_AUTH',
  OPENAPI_CONNECTION: 'OPENAPI_CONNECTION',
} as const;

export type CredentialTypeEnum = typeof CredentialTypeEnum[keyof typeof CredentialTypeEnum];

export const ToolTypeEnum = {
  MCP_SERVER: 'MCP_SERVER',
  OPENAPI_DEFINITION: 'OPENAPI_DEFINITION',
} as const;

export type ToolTypeEnum = typeof ToolTypeEnum[keyof typeof ToolTypeEnum];

export interface QuickListItemResponse {
  id: string;
  name: string;
}

export interface ConversationQuickListItemResponse {
  id: string;
  name: string;
  chat_agent_id: string;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface FilterParams {
  name?: string;
  is_active?: number;
  tags?: string;
  type?: string;
  provider?: string;
}

export interface SearchParams {
  search?: string;
  top?: number;
  next_link?: string;
}

export interface OrderParams {
  order_by?: string;
  order_direction?: 'asc' | 'desc';
}
