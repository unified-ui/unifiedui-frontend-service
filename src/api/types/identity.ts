import type { PrincipalTypeEnum, TenantPermissionEnum } from './common';
import type { TenantResponse } from './tenant';

export interface PrincipalResponse {
  tenant_id: string;
  principal_id: string;
  principal_type: string;
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
