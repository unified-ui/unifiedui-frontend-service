// ========== Common Types ==========

export const TenantPermissionEnum = {
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
  DEVELOPMENT_PLATFORMS_ADMIN: 'DEVELOPMENT_PLATFORMS_ADMIN',
  DEVELOPMENT_PLATFORMS_CREATOR: 'DEVELOPMENT_PLATFORMS_CREATOR',
  CHAT_WIDGETS_ADMIN: 'CHAT_WIDGETS_ADMIN',
  CHAT_WIDGETS_CREATOR: 'CHAT_WIDGETS_CREATOR',
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

export const FavoriteResourceTypeEnum = {
  APPLICATION: 'application',
  AUTONOMOUS_AGENT: 'autonomous_agent',
  CONVERSATION: 'conversation',
  DEVELOPMENT_PLATFORM: 'development_platform',
} as const;

export type FavoriteResourceTypeEnum = typeof FavoriteResourceTypeEnum[keyof typeof FavoriteResourceTypeEnum];

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

export interface PrincipalsResponse {
  tenant_id: string;
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  roles: TenantRole[];
}

export interface TenantPrincipalsResponse {
  tenant_id: string;
  principals: PrincipalsResponse[];
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

export interface ApplicationPermissionResponse {
  id: string;
  application_id: string;
  tenant_id: string;
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: PermissionActionEnum;
  created_at: string;
  updated_at: string;
}

export interface PrincipalPermissionsResponse {
  application_id?: string;
  tenant_id?: string;
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  roles: PermissionActionEnum[];
}

export interface ApplicationPrincipalsResponse {
  application_id: string;
  tenant_id?: string;
  principals: PrincipalPermissionsResponse[];
}

// ========== Autonomous Agent Types ==========

export interface AutonomousAgentResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  config: Record<string, unknown>;
  is_active: boolean;
  tags: TagSummary[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateAutonomousAgentRequest {
  name: string;
  description?: string;
  config?: Record<string, unknown>;
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

export interface AutonomousAgentPermissionResponse {
  id: string;
  autonomous_agent_id: string;
  tenant_id: string;
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: PermissionActionEnum;
  created_at: string;
  updated_at: string;
}

export interface AutonomousAgentPrincipalsResponse {
  autonomous_agent_id: string;
  principals: PrincipalPermissionsResponse[];
}

// ========== Conversation Types ==========

export interface ConversationResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateConversationRequest {
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

export interface ConversationPermissionResponse {
  id: string;
  conversation_id: string;
  tenant_id: string;
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: PermissionActionEnum;
  created_at: string;
  updated_at: string;
}

export interface ConversationPrincipalsResponse {
  conversation_id: string;
  principals: PrincipalPermissionsResponse[];
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

export interface CredentialPermissionResponse {
  id: string;
  credential_id: string;
  tenant_id: string;
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: PermissionActionEnum;
  created_at: string;
  updated_at: string;
}

export interface CredentialPrincipalsResponse {
  credential_id: string;
  principals: PrincipalPermissionsResponse[];
}

// ========== Development Platform Types ==========

export interface DevelopmentPlatformResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  type?: string;
  iframe_url: string;
  config: Record<string, unknown>;
  is_active: boolean;
  tags: TagSummary[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateDevelopmentPlatformRequest {
  name: string;
  description?: string;
  type?: string;
  iframe_url: string;
  config?: Record<string, unknown>;
  is_active?: boolean;
}

export interface UpdateDevelopmentPlatformRequest {
  name?: string;
  description?: string;
  type?: string;
  iframe_url?: string;
  config?: Record<string, unknown>;
  is_active?: boolean;
}

export interface SetDevelopmentPlatformPermissionRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: PermissionActionEnum;
}

export interface DevelopmentPlatformPermissionResponse {
  id: string;
  development_platform_id: string;
  tenant_id: string;
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: PermissionActionEnum;
  created_at: string;
  updated_at: string;
}

export interface DevelopmentPlatformPrincipalsResponse {
  development_platform_id: string;
  principals: PrincipalPermissionsResponse[];
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

export interface ChatWidgetPermissionResponse {
  id: string;
  chat_widget_id: string;
  tenant_id: string;
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  role: PermissionActionEnum;
  created_at: string;
  updated_at: string;
}

export interface ChatWidgetPrincipalsResponse {
  chat_widget_id: string;
  principals: PrincipalPermissionsResponse[];
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
  permission: PermissionActionEnum;
}

export interface DeletePrincipalRoleRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  permission: PermissionActionEnum;
}

export interface CustomGroupPrincipalsResponse {
  custom_group_id: string;
  principals: PrincipalPermissionsResponse[];
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
