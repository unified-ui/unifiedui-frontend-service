// ========== Common Types ==========

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
  EXTERNAL_APPS_ADMIN: 'EXTERNAL_APPS_ADMIN',
  EXTERNAL_APPS_CREATOR: 'EXTERNAL_APPS_CREATOR',
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

// ========== Standard Widget Types (In-Chat) ==========

export const StandardWidgetId = {
  YES_NO: 'yesno',
  SURVEY: 'survey',
} as const;

export type StandardWidgetId = typeof StandardWidgetId[keyof typeof StandardWidgetId];

export interface YesNoWidgetData {
  yesLabel?: string;
  noLabel?: string;
}

export interface SurveyQuestion {
  question: string;
  options: string[];
  recommendation?: string;
}

export interface SurveyWidgetData {
  title: string;
  questions: SurveyQuestion[];
}

export const WorkflowTypeEnum = {
  N8N: 'N8N',
} as const;

export type WorkflowTypeEnum = typeof WorkflowTypeEnum[keyof typeof WorkflowTypeEnum];

// ========== Workflow Config Types ==========

export interface N8NWorkflowConfig {
  api_version: string;
  workflow_endpoint: string;
  api_api_key_credential_id: string;
  webhook_url?: string;
  default_body?: Record<string, unknown>;
  default_query_params?: Record<string, string>;
}

export const FavoriteResourceTypeEnum = {
  CHAT_AGENT: 'chat-agents',
  AUTONOMOUS_AGENT: 'workflows',
  CHAT_WIDGET: 'chat-widgets',
  CONVERSATION: 'conversations',
  EXTERNAL_APP: 'external-apps',
} as const;

export type FavoriteResourceTypeEnum = typeof FavoriteResourceTypeEnum[keyof typeof FavoriteResourceTypeEnum];

// ========== Environment Type Enum ==========

export const EnvironmentTypeEnum = {
  SANDBOX: 'SANDBOX',
  PRODUCTION: 'PRODUCTION',
} as const;

export type EnvironmentTypeEnum = typeof EnvironmentTypeEnum[keyof typeof EnvironmentTypeEnum];

// ========== Organization Role Enum ==========

export const OrganizationRoleEnum = {
  ORGANISATION_GLOBAL_ADMIN: 'ORGANISATION_GLOBAL_ADMIN',
  ORGANISATION_TENANT_ADMIN: 'ORGANISATION_TENANT_ADMIN',
  ORGANISATION_TENANT_CREATOR: 'ORGANISATION_TENANT_CREATOR',
} as const;

export type OrganizationRoleEnum = typeof OrganizationRoleEnum[keyof typeof OrganizationRoleEnum];

// ========== Credential Type Enum ==========

export const CredentialTypeEnum = {
  API_KEY: 'API_KEY',
  BASIC_AUTH: 'BASIC_AUTH',
  OPENAPI_CONNECTION: 'OPENAPI_CONNECTION',
  AI_MODEL_PROVIDER: 'AI_MODEL_PROVIDER',
  ENTRA_ID_APP_REGISTRATION: 'ENTRA_ID_APP_REGISTRATION',
} as const;

export type CredentialTypeEnum = typeof CredentialTypeEnum[keyof typeof CredentialTypeEnum];

// ========== Tool Type Enum ==========

export const ToolTypeEnum = {
  MCP_SERVER: 'MCP_SERVER',
  OPENAPI_DEFINITION: 'OPENAPI_DEFINITION',
} as const;

export type ToolTypeEnum = typeof ToolTypeEnum[keyof typeof ToolTypeEnum];

// ========== N8N Chat Agent Config Types ==========

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
  chat_history_count?: number; // 1-100, default 30
  chat_url: string;
  workflow_endpoint: string;
  api_api_key_credential_id: string;
  chat_auth_credential_id?: string;
}

// ========== Microsoft Foundry Chat Agent Config Types ==========

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

// ========== REST API Chat Agent Config Types ==========

export const RestApiAuthTypeEnum = {
  ANONYMOUS: 'ANONYMOUS',
  BASIC_AUTH: 'BASIC_AUTH',
  API_KEY: 'API_KEY',
  ENTRA_ID_USER_TOKEN: 'ENTRA_ID_USER_TOKEN',
  ENTRA_ID_APP_REGISTRATION: 'ENTRA_ID_APP_REGISTRATION',
} as const;

export type RestApiAuthTypeEnum = typeof RestApiAuthTypeEnum[keyof typeof RestApiAuthTypeEnum];

export interface RestApiChatAgentConfig {
  auth_type: RestApiAuthTypeEnum;
  invoke_endpoint: string;
  credential_id?: string | null;
  api_key_header_name?: string;
  use_unified_chat_history: boolean;
  chat_history_count?: number;
  create_conversation_endpoint?: string | null;
}

// ========== Agent Service Types ==========

// Message Types
export const MessageType = {
  USER: 'user',
  ASSISTANT: 'assistant',
  REASONING: 'reasoning',
  TOOL_CALL: 'tool_call',
  TOOL_RESULT: 'tool_result',
  PLAN: 'plan',
  SUB_AGENT: 'sub_agent',
} as const;

export type MessageType = typeof MessageType[keyof typeof MessageType];

export const MessageStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type MessageStatus = typeof MessageStatus[keyof typeof MessageStatus];

export interface StatusTrace {
  type: string;
  name?: string;
  content?: string;
  data?: Record<string, unknown>;
  timestamp: string;
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
  chatAgentId: string;
  content: string;
  userId?: string;
  userMessageId?: string;
  status?: MessageStatus;
  errorMessage?: string;
  statusTraces?: StatusTrace[];
  metadata?: AssistantMetadata;
  attachmentsMetadata?: AttachmentMetadata[];
  extra?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileCategory: string;
  fileId?: string;
}

export interface FileUploadResponse {
  id: string;
  tenant_id: string;
  file_name: string;
  file_size: number;
  content_type: string;
  storage_path: string;
  context_type: string;
  context_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface GetMessagesResponse {
  messages: MessageResponse[];
  hasMore: boolean;
}

export interface SearchMessagesResponse {
  messages: MessageResponse[];
}

export interface FileAttachment {
  type: 'image' | 'file' | 'audio';
  imageUrl?: string;
  fileData?: string;
  filename?: string;
  mimeType?: string;
  detail?: 'low' | 'high' | 'auto';
  fileId?: string;
}

export interface MessageContent {
  content: string;
  attachments?: string[];
  files?: FileAttachment[];
}

export interface InvokeConfig {
  chatHistoryMessageCount?: number;
  contextData?: Record<string, string>;
}

export interface SendMessageRequest {
  conversationId?: string;
  chatAgentId: string;
  message: MessageContent;
  invokeConfig?: InvokeConfig;
  extConversationId?: string; // External conversation ID for Foundry
  extra?: Record<string, unknown>;
}

export interface SendMessageResponse {
  userMessageId: string;
  assistantMessageId: string;
  conversationId: string;
}

// ========== Reaction Types ==========

export const ReactionType = {
  THUMBS_UP: 'thumbs_up',
  THUMBS_DOWN: 'thumbs_down',
} as const;

export type ReactionType = typeof ReactionType[keyof typeof ReactionType];

export interface ReactionResponse {
  id: string;
  tenantId: string;
  conversationId: string;
  messageId: string;
  userId: string;
  reaction: ReactionType;
  feedbackText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListReactionsResponse {
  reactions: ReactionResponse[];
}

export interface BulkReactionsResponse {
  reactions: Record<string, ReactionResponse[]>;
}

export interface UpsertReactionRequest {
  reaction: ReactionType;
  feedbackText?: string;
}

export interface EditMessageRequest {
  content: string;
}

// ========== Trace Types (Full Hierarchical Traces) ==========

export const TraceContextType = {
  CONVERSATION: 'conversation',
  AUTONOMOUS_AGENT: 'workflow',
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
  MEMORY: 'memory',
  VECTOR_STORE: 'vector_store',
  EMBEDDING: 'embedding',
  OUTPUT_PARSER: 'output_parser',
  DOCUMENT: 'document',
  TEXT_SPLITTER: 'text_splitter',
  APP: 'app',
  DATA_TRANSFORM: 'data_transform',
  QUEUE: 'queue',
  DATABASE: 'database',
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
  chatAgentId?: string;
  conversationId?: string;
  workflowId?: string;
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

/** Query parameters for listing traces */
export interface TracesListParams {
  skip?: number;
  limit?: number;
  order?: 'asc' | 'desc';
  order_by?: 'created_at' | 'updated_at';
  created_after?: string;
  created_before?: string;
  expand?: boolean;
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
  TITLE_GENERATION: 'TITLE_GENERATION',
  ERROR: 'ERROR',
  REASONING_START: 'REASONING_START',
  REASONING_STREAM: 'REASONING_STREAM',
  REASONING_END: 'REASONING_END',
  TOOL_CALL_START: 'TOOL_CALL_START',
  TOOL_CALL_STREAM: 'TOOL_CALL_STREAM',
  TOOL_CALL_END: 'TOOL_CALL_END',
  PLAN_START: 'PLAN_START',
  PLAN_STREAM: 'PLAN_STREAM',
  PLAN_COMPLETE: 'PLAN_COMPLETE',
  SUB_AGENT_START: 'SUB_AGENT_START',
  SUB_AGENT_STREAM: 'SUB_AGENT_STREAM',
  SUB_AGENT_END: 'SUB_AGENT_END',
  SYNTHESIS_START: 'SYNTHESIS_START',
  SYNTHESIS_STREAM: 'SYNTHESIS_STREAM',
  TRACE: 'TRACE',
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
    toolName?: string;
    toolInput?: string;
    toolResult?: string;
    callType?: string;
    agentName?: string;
    agentId?: string;
    traceId?: string;
    [key: string]: unknown;
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

/** Response type for resource-specific tag endpoints (e.g., /chat-agents/tags) */
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

export interface ConversationQuickListItemResponse {
  id: string;
  name: string;
  chat_agent_id: string;
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

export interface OrganizationContextResponse {
  id: string;
  name: string;
  slug: string;
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
  is_system_admin: boolean;
  organization?: OrganizationContextResponse;
  tenants: TenantWithRoles[];
  groups: IdentityGroup[];
  custom_groups: unknown[];
}

// ========== Tenant Types ==========

export interface TenantResponse {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  environment_type: EnvironmentTypeEnum;
  is_default: boolean;
  can_be_deleted: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateTenantRequest {
  name: string;
  description?: string;
  environment_type?: EnvironmentTypeEnum;
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

// ========== Organization Types ==========

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  identity_provider: string;
  identity_tenant_id: string;
  subscription_tier: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface OrganizationMemberRoleResponse {
  id: string;
  principal_id: string;
  principal_type: string;
  role: string;
  created_at: string;
}

export interface OrganizationPrincipalResponse {
  principal_id: string;
  principal_type: string;
  display_name?: string;
  principal_name?: string;
  mail?: string;
  roles: OrganizationMemberRoleResponse[];
}

export interface OrganizationPrincipalsQueryParams {
  skip?: number;
  limit?: number;
  search?: string;
  order_by?: 'display_name';
  order_direction?: 'asc' | 'desc';
}

export interface OrganizationPrincipalsResponse {
  organization_id: string;
  principals: OrganizationPrincipalResponse[];
  total_count: number;
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  description?: string;
  identity_provider: string;
  identity_tenant_id: string;
  subscription_tier?: string;
}

export interface SetOrganizationPrincipalRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: OrganizationRoleEnum;
}

export interface DeleteOrganizationPrincipalRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: OrganizationRoleEnum;
}

export interface CreateTenantInOrganizationRequest {
  name: string;
  description?: string;
  environment_type: EnvironmentTypeEnum;
  previous_stage_id?: string;
  is_default?: boolean;
}

export interface TenantWithOrganizationResponse {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  environment_type: EnvironmentTypeEnum;
  previous_stage_id?: string;
  is_default: boolean;
  can_be_deleted: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// ========== Chat Agent Types ==========

export interface ChatAgentResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  type: ChatAgentTypeEnum;
  config: Record<string, unknown>;
  is_active: boolean;
  embed_allowed_origins?: string;
  tags: TagSummary[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  my_permission?: string;
  current_version?: number;
  ai_model_ids?: string[];
  system_prompt?: string | null;
  tool_ids?: string[];
  security_prompt?: string | null;
  tool_use_prompt?: string | null;
  response_prompt?: string | null;
  greeting_messages?: string[];
}

export interface CreateChatAgentRequest {
  name: string;
  description?: string;
  type: ChatAgentTypeEnum;
  config?: Record<string, unknown>;
  is_active?: boolean;
  embed_allowed_origins?: string;
  current_version?: number;
  ai_model_ids?: string[];
  system_prompt?: string | null;
  tool_ids?: string[];
  security_prompt?: string | null;
  tool_use_prompt?: string | null;
  response_prompt?: string | null;
  greeting_messages?: string[];
}

export interface UpdateChatAgentRequest {
  name?: string;
  description?: string;
  type?: ChatAgentTypeEnum;
  config?: Record<string, unknown>;
  is_active?: boolean;
  embed_allowed_origins?: string;
  greeting_messages?: string[];
}

export interface SetChatAgentPermissionRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: PermissionActionEnum;
}

export interface UpdateReActAgentVersionRequest {
  ai_model_ids?: string[];
  system_prompt?: string | null;
  tool_ids?: string[];
  security_prompt?: string | null;
  tool_use_prompt?: string | null;
  response_prompt?: string | null;
  greeting_messages?: string[];
  config?: Record<string, unknown>;
}

export interface ReActAgentVersionResponse {
  id: string;
  chat_agent_id: string;
  version: number;
  ai_model_ids: string[];
  system_prompt: string | null;
  tool_ids: string[];
  security_prompt: string | null;
  tool_use_prompt: string | null;
  response_prompt: string | null;
  greeting_messages: string[];
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// ========== Unified Principal Response Types ==========

/**
 * Unified response for a principal with their roles on a resource.
 * Used by all resource types (chat_agent, workflow, chat_widget,
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
export type ChatAgentPrincipalsResponse = ResourcePrincipalsResponse;
export type WorkflowPrincipalsResponse = ResourcePrincipalsResponse;
export type ChatWidgetPrincipalsResponse = ResourcePrincipalsResponse;
export type ConversationPrincipalsResponse = ResourcePrincipalsResponse;
export type CredentialPrincipalsResponse = ResourcePrincipalsResponse;
export type CustomGroupPrincipalsResponse = ResourcePrincipalsResponse;

// ========== Workflow Types ==========

export interface WorkflowResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  type: WorkflowTypeEnum;
  config: Record<string, unknown>;
  is_active: boolean;
  allow_api_keys: boolean;
  last_full_import?: string;
  tags: TagSummary[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  my_permission?: string;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  type: WorkflowTypeEnum;
  config: Record<string, unknown>;
  is_active?: boolean;
  allow_api_keys?: boolean;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
  is_active?: boolean;
  allow_api_keys?: boolean;
}

export interface SetWorkflowPermissionRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: PermissionActionEnum;
}

export interface WorkflowKeyResponse {
  key: string;
  key_number: number;
}

export interface WorkflowRunResponse {
  id: string;
  finished: boolean;
  status: string;
  startedAt: string;
  stoppedAt?: string;
  mode: string;
  workflowName?: string;
  retryOf?: string;
  retrySuccessId?: string;
}

export interface WorkflowRunDetailResponse extends WorkflowRunResponse {
  data?: Record<string, unknown>;
  workflowData?: Record<string, unknown>;
}

export interface ListWorkflowRunsResponse {
  runs: WorkflowRunResponse[];
  nextCursor?: string | null;
}

export interface WorkflowRunRetryResponse {
  id?: string;
  retried: boolean;
  message?: string;
}

// ========== Conversation Types ==========

export interface ConversationResponse {
  id: string;
  tenant_id: string;
  chat_agent_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  ext_conversation_id?: string; // External conversation ID (e.g., Foundry conversation ID)
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  my_permission?: string;
}

export interface CreateConversationRequest {
  chat_agent_id: string;
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
  my_permission?: string;
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

export interface TestCredentialConnectionRequest {
  credential_type: string;
  tenant_id: string;
  client_id: string;
  client_secret: string;
  scopes?: string[];
}

export interface TestCredentialConnectionResponse {
  success: boolean;
  message: string;
  response_time_ms: number;
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
  my_permission?: string;
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
  my_permission?: string;
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

// ========== AI Model Types ==========

export const AIModelTypeEnum = {
  LLM_MODEL: 'LLM_MODEL',
  EMBEDDING_MODEL: 'EMBEDDING_MODEL',
} as const;

export type AIModelTypeEnum = typeof AIModelTypeEnum[keyof typeof AIModelTypeEnum];

export const AIModelProviderEnum = {
  AZURE_OPENAI: 'AZURE_OPENAI',
  OPENAI: 'OPENAI',
  ANTHROPIC: 'ANTHROPIC',
  GOOGLE_GENAI: 'GOOGLE_GENAI',
  OLLAMA: 'OLLAMA',
  MISTRAL: 'MISTRAL',
  GROQ: 'GROQ',
} as const;

export type AIModelProviderEnum = typeof AIModelProviderEnum[keyof typeof AIModelProviderEnum];

export const AIModelPurposeGroupEnum = {
  REACT_AGENT: 'REACT_AGENT',
  CONVERSATION_TITLE_GENERATION: 'CONVERSATION_TITLE_GENERATION',
  CONVERSATION_SUMMARIZATION: 'CONVERSATION_SUMMARIZATION',
  DESCRIPTION_GENERATION: 'DESCRIPTION_GENERATION',
  TRACE_ANALYSIS: 'TRACE_ANALYSIS',
  GENERAL: 'GENERAL',
} as const;

export type AIModelPurposeGroupEnum = typeof AIModelPurposeGroupEnum[keyof typeof AIModelPurposeGroupEnum];

export interface AIModelResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  type: AIModelTypeEnum;
  provider: AIModelProviderEnum;
  purpose_groups: AIModelPurposeGroupEnum[];
  config: Record<string, unknown>;
  credential_id?: string;
  priority: number;
  is_active: boolean;
  tags: TagSummary[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateAIModelRequest {
  name: string;
  description?: string;
  type: AIModelTypeEnum;
  provider: AIModelProviderEnum;
  purpose_groups?: AIModelPurposeGroupEnum[];
  config?: Record<string, unknown>;
  credential_id?: string;
  priority?: number;
  is_active?: boolean;
}

export interface UpdateAIModelRequest {
  name?: string;
  description?: string;
  purpose_groups?: AIModelPurposeGroupEnum[];
  config?: Record<string, unknown>;
  credential_id?: string;
  priority?: number;
  is_active?: boolean;
}

// ========== External App Types ==========

export interface ExternalAppResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  url: string;
  image_url?: string;
  image_file_id?: string;
  tags: TagSummary[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  my_permission?: string;
}

export interface CreateExternalAppRequest {
  name: string;
  description?: string;
  url: string;
  image_url?: string;
  image_file_id?: string;
}

export interface UpdateExternalAppRequest {
  name?: string;
  description?: string;
  url?: string;
  image_url?: string;
  image_file_id?: string;
}

// ========== AI Feature Types ==========

export interface GenerateDescriptionRequest {
  entity_type: string;
  entity_name: string;
  existing_description?: string;
  context?: Record<string, unknown>;
}

export interface GenerateDescriptionResponse {
  description: string;
}

export interface AnalyzeTraceRequest {
  trace_id?: string;
  node_id?: string;
  error: string;
  node_name: string;
  node_type: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface AnalyzeTraceResponse {
  analysis: string;
}

export interface SummarizeTraceRequest {
  trace_id?: string;
  detail_level: 'short' | 'medium' | 'long';
  nodes: Record<string, unknown>[];
}

export interface SummarizeTraceResponse {
  summary: string;
}

export interface TestModelRequest {
  provider: string;
  config: Record<string, unknown>;
  credential_id?: string;
}

export interface TestModelResponse {
  success: boolean;
  message: string;
  response_time_ms: number;
}

export const TestConnectionType = {
  N8N_CHAT_URL: 'N8N_CHAT_URL',
  N8N_WORKFLOW: 'N8N_WORKFLOW',
  N8N_WEBHOOK: 'N8N_WEBHOOK',
  FOUNDRY_AGENT: 'FOUNDRY_AGENT',
  REST_API_INVOKE: 'REST_API_INVOKE',
  REST_API_CONVERSATION: 'REST_API_CONVERSATION',
} as const;

export type TestConnectionType = typeof TestConnectionType[keyof typeof TestConnectionType];

export interface TestConnectionRequest {
  test_type: TestConnectionType;
  url: string;
  config?: Record<string, unknown>;
  credential_id?: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  response_time_ms: number;
}

export interface AICapabilitiesResponse {
  title_generation: boolean;
  description_generation: boolean;
  trace_analysis: boolean;
  summarization: boolean;
}

export interface TraceChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TraceChatRequest {
  trace: string;
  selected_node?: string;
  message: string;
  history?: TraceChatMessage[];
}

export interface TraceChatResponse {
  reply: string;
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

export interface UserFavoriteWithNameResponse {
  resource_id: string;
  resource_type: string;
  resource_name: string;
}

export interface UserFavoritesUnifiedResponse {
  favorites: UserFavoriteWithNameResponse[];
}

// ========== Health Check Types ==========

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
}

// ========== Dashboard Types ==========

export interface EntityStatsResponse {
  total: number;
  active: number;
  inactive: number;
}

export interface DashboardStatsResponse {
  chat_agents: EntityStatsResponse;
  workflows: EntityStatsResponse;
  conversations: EntityStatsResponse;
  external_apps: EntityStatsResponse;
}

// ========== Search Types ==========

export interface SearchResultItem {
  type: string;
  id: string;
  name: string;
  description?: string;
  match_field: string;
  is_active?: boolean;
  tags: string[];
  sub_type?: string;
}

export interface SearchResponse {
  results: SearchResultItem[];
  total: number;
  query: string;
}

export interface GlobalSearchParams {
  q: string;
  types?: string;
  limit?: number;
  offset?: number;
}

// ========== Recent Visits Types ==========

export interface RecentVisitResponse {
  id: string;
  tenant_id: string;
  user_id: string;
  resource_type: string;
  resource_id: string;
  resource_name: string;
  visited_at: string;
}

export interface RecentVisitListResponse {
  visits: RecentVisitResponse[];
  total: number;
}

export interface RecentVisitItem {
  resource_type: string;
  resource_id: string;
  resource_name: string;
}

export interface SyncRecentVisitsRequest {
  visits: RecentVisitItem[];
}

// ========== Query Parameters ==========

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

export interface FieldSelectParams {
  fields?: string;
  ids?: string;
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
