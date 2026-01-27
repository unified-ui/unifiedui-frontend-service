// ========== Common Types ==========

export const TenantPermissionEnum = {
  READER: 'READER',
  GLOBAL_ADMIN: 'GLOBAL_ADMIN',
  APPLICATIONS_ADMIN: 'APPLICATIONS_ADMIN',
  APPLICATIONS_CREATOR: 'APPLICATIONS_CREATOR',
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

export const ApplicationTypeEnum = {
  N8N: 'N8N',
  MICROSOFT_FOUNDRY: 'MICROSOFT_FOUNDRY',
  REST_API: 'REST_API',
} as const;

export type ApplicationTypeEnum = typeof ApplicationTypeEnum[keyof typeof ApplicationTypeEnum];

export const ChatWidgetTypeEnum = {
  IFRAME: 'IFRAME',
  FORM: 'FORM',
} as const;

export type ChatWidgetTypeEnum = typeof ChatWidgetTypeEnum[keyof typeof ChatWidgetTypeEnum];

export const AutonomousAgentTypeEnum = {
  N8N: 'N8N',
} as const;

export type AutonomousAgentTypeEnum = typeof AutonomousAgentTypeEnum[keyof typeof AutonomousAgentTypeEnum];

// ========== Autonomous Agent Config Types ==========

export interface N8NAutonomousAgentConfig {
  api_version: string;
  workflow_endpoint: string;
  api_api_key_credential_id: string;
}

export const FavoriteResourceTypeEnum = {
  APPLICATION: 'applications',
  AUTONOMOUS_AGENT: 'autonomous-agents',
  CONVERSATION: 'conversations',
} as const;

export type FavoriteResourceTypeEnum = typeof FavoriteResourceTypeEnum[keyof typeof FavoriteResourceTypeEnum];

// ========== Credential Type Enum ==========

export const CredentialTypeEnum = {
  API_KEY: 'API_KEY',
  BASIC_AUTH: 'BASIC_AUTH',
  OPENAPI_CONNECTION: 'OPENAPI_CONNECTION',
} as const;

export type CredentialTypeEnum = typeof CredentialTypeEnum[keyof typeof CredentialTypeEnum];

// ========== Tool Type Enum ==========

export const ToolTypeEnum = {
  MCP_SERVER: 'MCP_SERVER',
  OPENAPI_DEFINITION: 'OPENAPI_DEFINITION',
} as const;

export type ToolTypeEnum = typeof ToolTypeEnum[keyof typeof ToolTypeEnum];

// ========== N8N Application Config Types ==========

export const N8NApiVersionEnum = {
  V1: 'v1',
} as const;

export type N8NApiVersionEnum = typeof N8NApiVersionEnum[keyof typeof N8NApiVersionEnum];

export const N8NWorkflowTypeEnum = {
  N8N_CHAT_AGENT_WORKFLOW: 'N8N_CHAT_AGENT_WORKFLOW',
} as const;

export type N8NWorkflowTypeEnum = typeof N8NWorkflowTypeEnum[keyof typeof N8NWorkflowTypeEnum];

export interface N8NApplicationConfig {
  api_version: N8NApiVersionEnum;
  workflow_type: N8NWorkflowTypeEnum;
  use_unified_chat_history: boolean;
  chat_history_count?: number; // 1-100, default 30
  chat_url: string;
  workflow_endpoint: string;
  api_api_key_credential_id: string;
  chat_auth_credential_id?: string;
}

// ========== Microsoft Foundry Application Config Types ==========

export const FoundryAgentTypeEnum = {
  AGENT: 'AGENT',
  MULTI_AGENT: 'MULTI_AGENT',
} as const;

export type FoundryAgentTypeEnum = typeof FoundryAgentTypeEnum[keyof typeof FoundryAgentTypeEnum];

export const FoundryApiVersionEnum = {
  V2025_11_15_PREVIEW: '2025-11-15-preview',
} as const;

export type FoundryApiVersionEnum = typeof FoundryApiVersionEnum[keyof typeof FoundryApiVersionEnum];

export interface FoundryApplicationConfig {
  agent_type: FoundryAgentTypeEnum;
  api_version: FoundryApiVersionEnum;
  project_endpoint: string;
  agent_name: string;
}

// ========== Agent Service Types ==========

// Message Types
export const MessageType = {
  USER: 'user',
  ASSISTANT: 'assistant',
} as const;

export type MessageType = typeof MessageType[keyof typeof MessageType];

export const MessageStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type MessageStatus = typeof MessageStatus[keyof typeof MessageStatus];

export interface StatusTrace {
  status: string;
  timestamp: string;
  message?: string;
}

export interface AssistantMetadata {
  model?: string;
  tokensInput?: number;
  tokensOutput?: number;
  latencyMs?: number;
  agentType?: string;
  /** External message ID from the backend (e.g., Foundry message ID) for trace mapping */
  extMessageId?: string;
  custom?: Record<string, unknown>;
}

export interface MessageResponse {
  id: string;
  type: MessageType;
  conversationId: string;
  applicationId: string;
  content: string;
  userId?: string;
  userMessageId?: string;
  status?: MessageStatus;
  errorMessage?: string;
  statusTraces?: StatusTrace[];
  metadata?: AssistantMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface GetMessagesResponse {
  messages: MessageResponse[];
}

export interface MessageContent {
  content: string;
  attachments?: string[];
}

export interface InvokeConfig {
  chatHistoryMessageCount?: number;
  contextData?: Record<string, string>;
}

export interface SendMessageRequest {
  conversationId?: string;
  applicationId: string;
  message: MessageContent;
  invokeConfig?: InvokeConfig;
  extConversationId?: string; // External conversation ID for Foundry
}

export interface SendMessageResponse {
  userMessageId: string;
  assistantMessageId: string;
  conversationId: string;
}

// ========== Trace Types (Full Hierarchical Traces) ==========

export const TraceContextType = {
  CONVERSATION: 'conversation',
  AUTONOMOUS_AGENT: 'autonomous_agent',
} as const;

export type TraceContextType = typeof TraceContextType[keyof typeof TraceContextType];

export const TraceNodeType = {
  AGENT: 'agent',
  TOOL: 'tool',
  LLM: 'llm',
  CHAIN: 'chain',
  RETRIEVER: 'retriever',
  WORKFLOW: 'workflow',
  FUNCTION: 'function',
  HTTP: 'http',
  CODE: 'code',
  CONDITIONAL: 'conditional',
  LOOP: 'loop',
  CUSTOM: 'custom',
} as const;

export type TraceNodeType = typeof TraceNodeType[keyof typeof TraceNodeType];

export const TraceNodeStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  CANCELLED: 'cancelled',
} as const;

export type TraceNodeStatus = typeof TraceNodeStatus[keyof typeof TraceNodeStatus];

/** Node data IO (input/output) - flexible to accommodate various backends */
export interface TraceNodeDataIO {
  text?: string;
  arguments?: Record<string, unknown>;
  extraData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  /** Allow additional arbitrary fields */
  [key: string]: unknown;
}

/** Node data containing input and output */
export interface TraceNodeData {
  input?: TraceNodeDataIO | null;
  output?: TraceNodeDataIO | null;
}

/** A single node in the trace tree (can be hierarchical) */
export interface TraceNodeResponse {
  id: string;
  name: string;
  type: TraceNodeType | string;
  referenceId?: string;
  startAt?: string;
  endAt?: string;
  duration?: number; // Duration in seconds
  status: TraceNodeStatus | string;
  error?: string;
  logs?: string[];
  data?: TraceNodeData;
  nodes?: TraceNodeResponse[]; // Sub-nodes (hierarchical)
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

/** Full trace response from agent-service */
export interface FullTraceResponse {
  id: string;
  tenantId: string;
  applicationId?: string;
  conversationId?: string;
  autonomousAgentId?: string;
  contextType: TraceContextType | string;
  referenceId?: string;
  referenceName?: string;
  referenceMetadata?: Record<string, unknown>;
  logs?: Array<string | Record<string, unknown>>;
  nodes: TraceNodeResponse[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

/** Response for listing traces */
export interface FullTracesListResponse {
  traces: FullTraceResponse[];
  total: number;
}

// ========== Legacy Trace Types (for message-level traces) ==========
export interface TraceMetadata {
  model?: string;
  tokensInput?: number;
  tokensOutput?: number;
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  custom?: Record<string, unknown>;
}

export interface TraceResponse {
  id: string;
  messageId: string;
  agentId: string;
  parentTraceId?: string;
  type: string;
  name: string;
  status: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  metadata?: TraceMetadata;
}

export interface GetTracesResponse {
  traces: TraceResponse[];
  total: number;
}

export interface UpdateTraceRequest {
  traceId: string;
  conversationId: string;
  messageId: string;
  parentTraceId?: string;
  type: string;
  name: string;
  status: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  metadata?: TraceMetadata;
}

export interface BatchUpdateTracesRequest {
  traces: UpdateTraceRequest[];
}

export interface UpdateTracesResponse {
  updated: number;
  created: number;
}

// SSE Event Types
export const SSEStreamMessageType = {
  STREAM_START: 'STREAM_START',
  TEXT_STREAM: 'TEXT_STREAM',
  STREAM_NEW_MESSAGE: 'STREAM_NEW_MESSAGE',
  STREAM_END: 'STREAM_END',
  MESSAGE_COMPLETE: 'MESSAGE_COMPLETE',
  ERROR: 'ERROR',
} as const;

export type SSEStreamMessageType = typeof SSEStreamMessageType[keyof typeof SSEStreamMessageType];

export interface SSEStreamMessage {
  type: SSEStreamMessageType;
  content?: string;
  config?: {
    messageId?: string;
    conversationId?: string;
    code?: string;
    message?: string | MessageResponse;
    details?: string;
  };
}

export interface SSEMessageEvent {
  content: string;
  messageId?: string;
  done: boolean;
}

export interface SSETraceEvent {
  traceId: string;
  type: string;
  name: string;
  status: string;
  data?: unknown;
}

export interface SSEErrorEvent {
  code: string;
  message: string;
  details?: string;
}

export type SSEEventType = 'message' | 'trace' | 'error' | 'done';

export interface SSEEvent {
  type: SSEEventType;
  data: SSEStreamMessage | SSETraceEvent | SSEErrorEvent | null;
}

// ========== Tag Types ==========

export interface TagSummary {
  id: number;
  name: string;
}

export interface TagResponse {
  id: number;
  tenant_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface TagListResponse {
  tags: TagResponse[];
  total: number;
}

/** Response type for resource-specific tag endpoints (e.g., /applications/tags) */
export type ResourceTypeTagsResponse = TagSummary[];

export interface ResourceTagsResponse {
  resource_id: string;
  resource_type: string;
  tags: TagSummary[];
}

/** Parameters for resource-specific tag list endpoints */
export interface ResourceTagListParams {
  name?: string;
  skip?: number;
  limit?: number;
}

export interface CreateTagRequest {
  name: string;
}

export interface SetResourceTagsRequest {
  tags: string[];
}

// ========== Common Response Types ==========

export interface QuickListItemResponse {
  id: string;
  name: string;
}

// ========== Principal Types ==========

export interface PrincipalResponse {
  tenant_id: string;
  principal_id: string;
  principal_type: string; // 'IDENTITY_USER' | 'IDENTITY_GROUP' | 'CUSTOM_GROUP'
  mail?: string;
  display_name: string;
  principal_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface RefreshPrincipalRequest {
  tenant_id: string;
  type: 'IDENTITY_USER' | 'IDENTITY_GROUP';
}

// ========== Identity Types ==========

export interface IdentityUser {
  id: string;
  identity_provider: string;
  identity_tenant_id: string;
  display_name: string;
  firstname: string;
  lastname: string;
  mail: string;
}

export interface IdentityGroup {
  id: string;
  display_name: string;
  description?: string;
}

export interface IdentityUserResponse {
  value: IdentityUser;
}

export interface IdentityGroupResponse {
  value: IdentityGroup;
}

export interface IdentityUsersResponse {
  value: IdentityUser[];
  next_link?: string;
}

export interface IdentityGroupsResponse {
  value: IdentityGroup[];
  next_link?: string;
}

export interface TenantRole {
  role: TenantPermissionEnum;
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  display_name: string;
}

export interface TenantWithRoles {
  tenant: TenantResponse;
  roles: string[];
}

export interface MeResponse {
  id: string;
  identity_provider: string;
  identity_tenant_id: string;
  display_name: string;
  firstname: string;
  lastname: string;
  mail: string;
  tenants: TenantWithRoles[];
  groups: IdentityGroup[];
  custom_groups: unknown[];
}

// ========== Tenant Types ==========

export interface TenantResponse {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateTenantRequest {
  name: string;
  description?: string;
}

export interface UpdateTenantRequest {
  name?: string;
  description?: string;
}

export interface SetPrincipalRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: TenantPermissionEnum;
}

export interface DeletePrincipalRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: TenantPermissionEnum;
}

// Role detail with creation info
export interface TenantRoleDetail {
  role: TenantPermissionEnum;
  display_name?: string;
  created_at?: string;
}

// Single principal in tenant principals response
export interface TenantPrincipalDetail {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  display_name?: string;
  principal_name?: string;
  mail?: string;
  description?: string;
  is_active: boolean;
  roles: TenantRoleDetail[];
}

export interface PrincipalsResponse {
  tenant_id: string;
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  is_active: boolean;
  roles: string[];
}

export interface TenantPrincipalsResponse {
  tenant_id: string;
  principals: TenantPrincipalDetail[];
}

// ========== Application Types ==========

export interface ApplicationResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  type: ApplicationTypeEnum;
  config: Record<string, unknown>;
  is_active: boolean;
  tags: TagSummary[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateApplicationRequest {
  name: string;
  description?: string;
  type: ApplicationTypeEnum;
  config?: Record<string, unknown>;
  is_active?: boolean;
}

export interface UpdateApplicationRequest {
  name?: string;
  description?: string;
  type?: ApplicationTypeEnum;
  config?: Record<string, unknown>;
  is_active?: boolean;
}

export interface SetApplicationPermissionRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: PermissionActionEnum;
}

// ========== Unified Principal Response Types ==========

/**
 * Unified response for a principal with their roles on a resource.
 * Used by all resource types (application, autonomous_agent, chat_widget, 
 * conversation, credential, custom_group).
 */
export interface PrincipalWithRolesResponse {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  roles: PermissionActionEnum[];
  mail?: string | null;
  display_name?: string | null;
  principal_name?: string | null;
  description?: string | null;
}

/**
 * Unified response for listing all principals with their roles on a resource.
 * Used by all resource types.
 */
export interface ResourcePrincipalsResponse {
  resource_id: string;
  resource_type: string;
  tenant_id: string;
  principals: PrincipalWithRolesResponse[];
}

// Legacy type aliases for backward compatibility
export type ApplicationPrincipalsResponse = ResourcePrincipalsResponse;
export type AutonomousAgentPrincipalsResponse = ResourcePrincipalsResponse;
export type ChatWidgetPrincipalsResponse = ResourcePrincipalsResponse;
export type ConversationPrincipalsResponse = ResourcePrincipalsResponse;
export type CredentialPrincipalsResponse = ResourcePrincipalsResponse;
export type CustomGroupPrincipalsResponse = ResourcePrincipalsResponse;

// ========== Autonomous Agent Types ==========

export interface AutonomousAgentResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  type: AutonomousAgentTypeEnum;
  config: Record<string, unknown>;
  is_active: boolean;
  last_full_import?: string;
  tags: TagSummary[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateAutonomousAgentRequest {
  name: string;
  description?: string;
  type: AutonomousAgentTypeEnum;
  config: Record<string, unknown>;
  is_active?: boolean;
}

export interface UpdateAutonomousAgentRequest {
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
  is_active?: boolean;
}

export interface SetAutonomousAgentPermissionRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: PermissionActionEnum;
}

export interface AutonomousAgentKeyResponse {
  key: string;
  key_number: number;
}

// ========== Conversation Types ==========

export interface ConversationResponse {
  id: string;
  tenant_id: string;
  application_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  ext_conversation_id?: string; // External conversation ID (e.g., Foundry conversation ID)
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateConversationRequest {
  application_id: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateConversationRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface SetConversationPermissionRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: PermissionActionEnum;
}

// ========== Credential Types ==========

export interface CredentialResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  type: string;
  source: string;
  credential_uri: string;
  is_active: boolean;
  tags: TagSummary[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateCredentialRequest {
  name: string;
  description?: string;
  credential_type: string;
  secret_value: string;
  source?: string;
  metadata?: Record<string, unknown>;
  is_active?: boolean;
}

export interface UpdateCredentialRequest {
  name?: string;
  description?: string;
  secret_value?: string;
  source?: string;
  metadata?: Record<string, unknown>;
  is_active?: boolean;
}

export interface SetCredentialPermissionRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: PermissionActionEnum;
}

export interface CredentialSecretResponse {
  credential_id: string;
  secret_value: string;
}

// ========== Chat Widget Types ==========

export interface ChatWidgetResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  type?: ChatWidgetTypeEnum;
  config: Record<string, unknown>;
  is_active: boolean;
  tags: TagSummary[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateChatWidgetRequest {
  name: string;
  description?: string;
  type?: ChatWidgetTypeEnum;
  config: Record<string, unknown>;
  is_active?: boolean;
}

export interface UpdateChatWidgetRequest {
  name?: string;
  description?: string;
  type?: ChatWidgetTypeEnum;
  config?: Record<string, unknown>;
  is_active?: boolean;
}

export interface SetChatWidgetPermissionRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: PermissionActionEnum;
}

// ========== Custom Group Types ==========

export interface CustomGroupResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateCustomGroupRequest {
  name: string;
  description?: string;
}

export interface UpdateCustomGroupRequest {
  name?: string;
  description?: string;
}

export interface SetPrincipalRoleRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: PermissionActionEnum;
}

export interface DeletePrincipalRoleRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: PermissionActionEnum;
}

// ========== Tool Types ==========

export interface ToolResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  type: ToolTypeEnum;
  config: Record<string, unknown>;
  credential_id?: string;
  is_active: boolean;
  tags: TagSummary[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateToolRequest {
  name: string;
  description?: string;
  type: ToolTypeEnum;
  config?: Record<string, unknown>;
  credential_id?: string;
  is_active?: boolean;
}

export interface UpdateToolRequest {
  name?: string;
  description?: string;
  type?: ToolTypeEnum;
  config?: Record<string, unknown>;
  credential_id?: string;
  is_active?: boolean;
}

export interface SetToolPermissionRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: PermissionActionEnum;
}

// ========== User Favorites Types ==========

export interface UserFavoriteResponse {
  tenant_id: string;
  user_id: string;
  resource_id: string;
  resource_type: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface UserFavoritesListResponse {
  favorites: UserFavoriteResponse[];
  total: number;
}

// ========== Health Check Types ==========

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
}

// ========== Query Parameters ==========

export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface FilterParams {
  name_filter?: string;
  is_active?: number;
  tags?: string;
  type_filter?: string;
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

/** Query parameters for tenant principals endpoint */
export interface TenantPrincipalsQueryParams {
  skip?: number;
  limit?: number;
  search?: string;
  roles?: string; // comma-separated roles
  is_active?: boolean;
  order_by?: 'display_name';
  order_direction?: 'asc' | 'desc';
}
