import type { ChatAgentTypeEnum, PermissionActionEnum, PrincipalTypeEnum } from './common';
import type { TagSummary } from './tag';

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

export interface PrincipalWithRolesResponse {
  principal_id: string;
  principal_type: PrincipalTypeEnum;
  roles: PermissionActionEnum[];
  mail?: string | null;
  display_name?: string | null;
  principal_name?: string | null;
  description?: string | null;
}

export interface ResourcePrincipalsResponse {
  resource_id: string;
  resource_type: string;
  tenant_id: string;
  principals: PrincipalWithRolesResponse[];
}

export type ChatAgentPrincipalsResponse = ResourcePrincipalsResponse;
export type AutonomousAgentPrincipalsResponse = ResourcePrincipalsResponse;
export type ChatWidgetPrincipalsResponse = ResourcePrincipalsResponse;
export type ConversationPrincipalsResponse = ResourcePrincipalsResponse;
export type CredentialPrincipalsResponse = ResourcePrincipalsResponse;
export type CustomGroupPrincipalsResponse = ResourcePrincipalsResponse;
