import type { EnvironmentTypeEnum, PrincipalTypeEnum, TenantPermissionEnum } from './common';

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

export interface TenantRoleDetail {
  role: TenantPermissionEnum;
  display_name?: string;
  created_at?: string;
}

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

export interface TenantPrincipalsQueryParams {
  skip?: number;
  limit?: number;
  search?: string;
  roles?: string;
  is_active?: boolean;
  order_by?: 'display_name';
  order_direction?: 'asc' | 'desc';
}
