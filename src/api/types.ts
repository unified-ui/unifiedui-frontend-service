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
} as const;

export type TenantPermissionEnum = typeof TenantPermissionEnum[keyof typeof TenantPermissionEnum];

export const PermissionActionEnum = {
  ADMIN: 'ADMIN',
  WRITE: 'WRITE',
  READ: 'READ',
} as const;

export type PermissionActionEnum = typeof PermissionActionEnum[keyof typeof PermissionActionEnum];

export const PrincipalTypeEnum = {
  USER: 'USER',
  GROUP: 'GROUP',
  CUSTOM_GROUP: 'CUSTOM_GROUP',
} as const;

export type PrincipalTypeEnum = typeof PrincipalTypeEnum[keyof typeof PrincipalTypeEnum];

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
  created_by: string;
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
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateApplicationRequest {
  name: string;
  description?: string;
}

export interface UpdateApplicationRequest {
  name?: string;
  description?: string;
}

export interface SetApplicationPermissionRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  permission: PermissionActionEnum;
}

export interface ApplicationPermissionResponse {
  application_id: string;
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  permission: PermissionActionEnum;
}

export interface ApplicationPrincipalsResponse {
  application_id: string;
  principals: PrincipalPermissionsResponse[];
}

export interface PrincipalPermissionsResponse {
  application_id?: string;
  autonomous_agent_id?: string;
  conversation_id?: string;
  credential_id?: string;
  custom_group_id?: string;
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  permissions: ApplicationPermissionResponse[];
}

// ========== Autonomous Agent Types ==========

export interface AutonomousAgentResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateAutonomousAgentRequest {
  name: string;
  description?: string;
}

export interface UpdateAutonomousAgentRequest {
  name?: string;
  description?: string;
}

export interface SetAutonomousAgentPermissionRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  permission: PermissionActionEnum;
}

export interface AutonomousAgentPermissionResponse {
  autonomous_agent_id: string;
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  permission: PermissionActionEnum;
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
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateConversationRequest {
  name: string;
  description?: string;
}

export interface UpdateConversationRequest {
  name?: string;
  description?: string;
}

export interface SetConversationPermissionRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  permission: PermissionActionEnum;
}

export interface ConversationPermissionResponse {
  conversation_id: string;
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  permission: PermissionActionEnum;
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
  credential_type: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateCredentialRequest {
  name: string;
  description?: string;
  credential_type: string;
  secret_value: string;
}

export interface UpdateCredentialRequest {
  name?: string;
  description?: string;
  secret_value?: string;
}

export interface SetCredentialPermissionRequest {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  permission: PermissionActionEnum;
}

export interface CredentialPermissionResponse {
  credential_id: string;
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  permission: PermissionActionEnum;
}

export interface CredentialPrincipalsResponse {
  credential_id: string;
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
  created_by: string;
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

export interface SearchParams {
  search?: string;
  top?: number;
  next_link?: string;
}
