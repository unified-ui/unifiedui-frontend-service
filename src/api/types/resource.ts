import type { AutonomousAgentTypeEnum, ChatWidgetTypeEnum, PermissionActionEnum, PrincipalTypeEnum, ToolTypeEnum } from './common';
import type { TagSummary } from './tag';

export interface AutonomousAgentResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  type: AutonomousAgentTypeEnum;
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

export interface CreateAutonomousAgentRequest {
  name: string;
  description?: string;
  type: AutonomousAgentTypeEnum;
  config: Record<string, unknown>;
  is_active?: boolean;
  allow_api_keys?: boolean;
}

export interface UpdateAutonomousAgentRequest {
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
  is_active?: boolean;
  allow_api_keys?: boolean;
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

export interface ConversationResponse {
  id: string;
  tenant_id: string;
  chat_agent_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  ext_conversation_id?: string;
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
