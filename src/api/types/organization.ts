import type { EnvironmentTypeEnum, OrganizationRoleEnum, PrincipalTypeEnum } from './common';

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
