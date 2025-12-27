import type {
  // Common Types
  PaginationParams,
  FilterParams,
  SearchParams,
  OrderParams,
  QuickListItemResponse,
  // Principal Types
  PrincipalResponse,
  RefreshPrincipalRequest,
  // Identity Types
  MeResponse,
  IdentityUsersResponse,
  IdentityGroupsResponse,
  // Tenant Types
  TenantResponse,
  CreateTenantRequest,
  UpdateTenantRequest,
  TenantPrincipalsResponse,
  SetPrincipalRequest,
  DeletePrincipalRequest,
  // Application Types
  ApplicationResponse,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  ApplicationPrincipalsResponse,
  SetApplicationPermissionRequest,
  // Autonomous Agent Types
  AutonomousAgentResponse,
  CreateAutonomousAgentRequest,
  UpdateAutonomousAgentRequest,
  AutonomousAgentPrincipalsResponse,
  SetAutonomousAgentPermissionRequest,
  // Conversation Types
  ConversationResponse,
  CreateConversationRequest,
  UpdateConversationRequest,
  ConversationPrincipalsResponse,
  SetConversationPermissionRequest,
  // Credential Types
  CredentialResponse,
  CreateCredentialRequest,
  UpdateCredentialRequest,
  CredentialPrincipalsResponse,
  SetCredentialPermissionRequest,
  // Development Platform Types
  DevelopmentPlatformResponse,
  CreateDevelopmentPlatformRequest,
  UpdateDevelopmentPlatformRequest,
  DevelopmentPlatformPrincipalsResponse,
  SetDevelopmentPlatformPermissionRequest,
  // Chat Widget Types
  ChatWidgetResponse,
  CreateChatWidgetRequest,
  UpdateChatWidgetRequest,
  ChatWidgetPrincipalsResponse,
  SetChatWidgetPermissionRequest,
  // Custom Group Types
  CustomGroupResponse,
  CreateCustomGroupRequest,
  UpdateCustomGroupRequest,
  CustomGroupPrincipalsResponse,
  SetPrincipalRoleRequest,
  DeletePrincipalRoleRequest,
  // Tag Types
  TagResponse,
  TagListResponse,
  ResourceTagsResponse,
  CreateTagRequest,
  SetResourceTagsRequest,
  // User Favorites Types
  UserFavoriteResponse,
  UserFavoritesListResponse,
  FavoriteResourceTypeEnum,
  // Misc Types
  HealthCheckResponse,
  PrincipalTypeEnum,
  PermissionActionEnum,
} from './types';

// ========== API Client Configuration ==========

export interface APIClientConfig {
  baseURL: string;
  getAccessToken: () => Promise<string | null>;
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}

// ========== API Client ==========

export class UnifiedUIAPIClient {
  private baseURL: string;
  private getAccessToken: () => Promise<string | null>;
  private onError?: (error: Error) => void;
  private onSuccess?: (message: string) => void;

  constructor(config: APIClientConfig) {
    this.baseURL = config.baseURL;
    this.getAccessToken = config.getAccessToken;
    this.onError = config.onError;
    this.onSuccess = config.onSuccess;
  }

  // ========== Helper Methods ==========

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    successMessage?: string,
    options?: { noCache?: boolean }
  ): Promise<T> {
    try {
      const token = await this.getAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Add X-Use-Cache header when noCache is true
      if (options?.noCache) {
        headers['X-Use-Cache'] = 'false';
      }

      const response = await fetch(`${this.baseURL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        if (successMessage && this.onSuccess) {
          this.onSuccess(successMessage);
        }
        return undefined as T;
      }

      const data = await response.json();

      if (successMessage && this.onSuccess) {
        this.onSuccess(successMessage);
      }

      return data;
    } catch (error) {
      if (this.onError && error instanceof Error) {
        this.onError(error);
      }
      throw error;
    }
  }

  private buildQueryString(params: Record<string, unknown> | PaginationParams | SearchParams): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // ========== Health Check ==========

  async getHealth(): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>('GET', '/api/v1/health');
  }

  // ========== Identity Endpoints ==========

  async getMe(): Promise<MeResponse> {
    return this.request<MeResponse>('GET', '/api/v1/identity/me');
  }

  async getUsers(params?: SearchParams): Promise<IdentityUsersResponse> {
    const query = this.buildQueryString(params || {});
    return this.request<IdentityUsersResponse>('GET', `/api/v1/identity/users${query}`);
  }

  async getGroups(params?: SearchParams): Promise<IdentityGroupsResponse> {
    const query = this.buildQueryString(params || {});
    return this.request<IdentityGroupsResponse>('GET', `/api/v1/identity/groups${query}`);
  }

  async refreshPrincipal(principalId: string, data: RefreshPrincipalRequest): Promise<PrincipalResponse> {
    return this.request<PrincipalResponse>('PUT', `/api/v1/identity/principals/${principalId}/refresh`, data, 'Principal refreshed successfully');
  }

  // ========== Tenant Endpoints ==========

  async listTenants(): Promise<TenantResponse[]> {
    return this.request<TenantResponse[]>('GET', '/api/v1/tenants');
  }

  async getTenant(tenantId: string): Promise<TenantResponse> {
    return this.request<TenantResponse>('GET', `/api/v1/tenants/${tenantId}`);
  }

  async createTenant(data: CreateTenantRequest): Promise<TenantResponse> {
    return this.request<TenantResponse>('POST', '/api/v1/tenants', data, 'Tenant created successfully');
  }

  async updateTenant(tenantId: string, data: UpdateTenantRequest): Promise<TenantResponse> {
    return this.request<TenantResponse>('PUT', `/api/v1/tenants/${tenantId}`, data, 'Tenant updated successfully');
  }

  async deleteTenant(tenantId: string): Promise<void> {
    return this.request<void>('DELETE', `/api/v1/tenants/${tenantId}`, undefined, 'Tenant deleted successfully');
  }

  // ========== Tenant Principals ==========

  async getTenantPrincipals(tenantId: string): Promise<TenantPrincipalsResponse> {
    return this.request<TenantPrincipalsResponse>('GET', `/api/v1/tenants/${tenantId}/principals`);
  }

  async setTenantPrincipal(tenantId: string, data: SetPrincipalRequest): Promise<void> {
    return this.request<void>('POST', `/api/v1/tenants/${tenantId}/principals`, data, 'Principal added successfully');
  }

  async deleteTenantPrincipal(tenantId: string, data: DeletePrincipalRequest): Promise<void> {
    return this.request<void>('DELETE', `/api/v1/tenants/${tenantId}/principals`, data, 'Principal removed successfully');
  }

  // ========== Application Endpoints ==========

  async listApplications(
    tenantId: string, 
    params?: PaginationParams & OrderParams & FilterParams & { view?: 'quick-list' }, 
    options?: { noCache?: boolean }
  ): Promise<ApplicationResponse[] | QuickListItemResponse[]> {
    const query = this.buildQueryString(params || {});
    return this.request<ApplicationResponse[] | QuickListItemResponse[]>('GET', `/api/v1/tenants/${tenantId}/applications${query}`, undefined, undefined, options);
  }

  async getApplication(tenantId: string, applicationId: string): Promise<ApplicationResponse> {
    return this.request<ApplicationResponse>('GET', `/api/v1/tenants/${tenantId}/applications/${applicationId}`);
  }

  async createApplication(tenantId: string, data: CreateApplicationRequest): Promise<ApplicationResponse> {
    return this.request<ApplicationResponse>('POST', `/api/v1/tenants/${tenantId}/applications`, data, 'Application created successfully');
  }

  async updateApplication(tenantId: string, applicationId: string, data: UpdateApplicationRequest): Promise<ApplicationResponse> {
    return this.request<ApplicationResponse>('PUT', `/api/v1/tenants/${tenantId}/applications/${applicationId}`, data, 'Application updated successfully');
  }

  async deleteApplication(tenantId: string, applicationId: string): Promise<void> {
    return this.request<void>('DELETE', `/api/v1/tenants/${tenantId}/applications/${applicationId}`, undefined, 'Application deleted successfully');
  }

  // ========== Application Permissions ==========

  async getApplicationPrincipals(tenantId: string, applicationId: string): Promise<ApplicationPrincipalsResponse> {
    return this.request<ApplicationPrincipalsResponse>('GET', `/api/v1/tenants/${tenantId}/applications/${applicationId}/principals`);
  }

  async setApplicationPermission(tenantId: string, applicationId: string, data: SetApplicationPermissionRequest): Promise<void> {
    return this.request<void>('POST', `/api/v1/tenants/${tenantId}/applications/${applicationId}/principals`, data, 'Permission added successfully');
  }

  async deleteApplicationPermission(
    tenantId: string,
    applicationId: string,
    principalId: string,
    principalType: PrincipalTypeEnum,
    role: PermissionActionEnum
  ): Promise<void> {
    return this.request<void>(
      'DELETE',
      `/api/v1/tenants/${tenantId}/applications/${applicationId}/principals`,
      { principal_id: principalId, principal_type: principalType, role },
      'Permission removed successfully'
    );
  }

  // ========== Autonomous Agent Endpoints ==========

  async listAutonomousAgents(
    tenantId: string, 
    params?: PaginationParams & OrderParams & { view?: 'quick-list' }, 
    options?: { noCache?: boolean }
  ): Promise<AutonomousAgentResponse[] | QuickListItemResponse[]> {
    const query = this.buildQueryString(params || {});
    return this.request<AutonomousAgentResponse[] | QuickListItemResponse[]>('GET', `/api/v1/tenants/${tenantId}/autonomous-agents${query}`, undefined, undefined, options);
  }

  async getAutonomousAgent(tenantId: string, agentId: string): Promise<AutonomousAgentResponse> {
    return this.request<AutonomousAgentResponse>('GET', `/api/v1/tenants/${tenantId}/autonomous-agents/${agentId}`);
  }

  async createAutonomousAgent(tenantId: string, data: CreateAutonomousAgentRequest): Promise<AutonomousAgentResponse> {
    return this.request<AutonomousAgentResponse>('POST', `/api/v1/tenants/${tenantId}/autonomous-agents`, data, 'Autonomous agent created successfully');
  }

  async updateAutonomousAgent(tenantId: string, agentId: string, data: UpdateAutonomousAgentRequest): Promise<AutonomousAgentResponse> {
    return this.request<AutonomousAgentResponse>('PUT', `/api/v1/tenants/${tenantId}/autonomous-agents/${agentId}`, data, 'Autonomous agent updated successfully');
  }

  async deleteAutonomousAgent(tenantId: string, agentId: string): Promise<void> {
    return this.request<void>('DELETE', `/api/v1/tenants/${tenantId}/autonomous-agents/${agentId}`, undefined, 'Autonomous agent deleted successfully');
  }

  // ========== Autonomous Agent Permissions ==========

  async getAutonomousAgentPrincipals(tenantId: string, agentId: string): Promise<AutonomousAgentPrincipalsResponse> {
    return this.request<AutonomousAgentPrincipalsResponse>('GET', `/api/v1/tenants/${tenantId}/autonomous-agents/${agentId}/principals`);
  }

  async setAutonomousAgentPermission(tenantId: string, agentId: string, data: SetAutonomousAgentPermissionRequest): Promise<void> {
    return this.request<void>('POST', `/api/v1/tenants/${tenantId}/autonomous-agents/${agentId}/principals`, data, 'Permission added successfully');
  }

  async deleteAutonomousAgentPermission(
    tenantId: string,
    agentId: string,
    principalId: string,
    principalType: PrincipalTypeEnum,
    role: PermissionActionEnum
  ): Promise<void> {
    return this.request<void>(
      'DELETE',
      `/api/v1/tenants/${tenantId}/autonomous-agents/${agentId}/principals`,
      { principal_id: principalId, principal_type: principalType, role },
      'Permission removed successfully'
    );
  }

  // ========== Conversation Endpoints ==========

  async listConversations(tenantId: string, params?: PaginationParams): Promise<ConversationResponse[]> {
    const query = this.buildQueryString(params || {});
    return this.request<ConversationResponse[]>('GET', `/api/v1/tenants/${tenantId}/conversations${query}`);
  }

  async getConversation(tenantId: string, conversationId: string): Promise<ConversationResponse> {
    return this.request<ConversationResponse>('GET', `/api/v1/tenants/${tenantId}/conversations/${conversationId}`);
  }

  async createConversation(tenantId: string, data: CreateConversationRequest): Promise<ConversationResponse> {
    return this.request<ConversationResponse>('POST', `/api/v1/tenants/${tenantId}/conversations`, data, 'Conversation created successfully');
  }

  async updateConversation(tenantId: string, conversationId: string, data: UpdateConversationRequest): Promise<ConversationResponse> {
    return this.request<ConversationResponse>('PUT', `/api/v1/tenants/${tenantId}/conversations/${conversationId}`, data, 'Conversation updated successfully');
  }

  async deleteConversation(tenantId: string, conversationId: string): Promise<void> {
    return this.request<void>('DELETE', `/api/v1/tenants/${tenantId}/conversations/${conversationId}`, undefined, 'Conversation deleted successfully');
  }

  // ========== Conversation Permissions ==========

  async getConversationPrincipals(tenantId: string, conversationId: string): Promise<ConversationPrincipalsResponse> {
    return this.request<ConversationPrincipalsResponse>('GET', `/api/v1/tenants/${tenantId}/conversations/${conversationId}/principals`);
  }

  async setConversationPermission(tenantId: string, conversationId: string, data: SetConversationPermissionRequest): Promise<void> {
    return this.request<void>('POST', `/api/v1/tenants/${tenantId}/conversations/${conversationId}/principals`, data, 'Permission added successfully');
  }

  async deleteConversationPermission(
    tenantId: string,
    conversationId: string,
    principalId: string,
    principalType: PrincipalTypeEnum,
    role: PermissionActionEnum
  ): Promise<void> {
    return this.request<void>(
      'DELETE',
      `/api/v1/tenants/${tenantId}/conversations/${conversationId}/principals`,
      { principal_id: principalId, principal_type: principalType, role },
      'Permission removed successfully'
    );
  }

  // ========== Credential Endpoints ==========

  async listCredentials(
    tenantId: string, 
    params?: PaginationParams & OrderParams & { view?: 'quick-list' }, 
    options?: { noCache?: boolean }
  ): Promise<CredentialResponse[] | QuickListItemResponse[]> {
    const query = this.buildQueryString(params || {});
    return this.request<CredentialResponse[] | QuickListItemResponse[]>('GET', `/api/v1/tenants/${tenantId}/credentials${query}`, undefined, undefined, options);
  }

  async getCredential(tenantId: string, credentialId: string): Promise<CredentialResponse> {
    return this.request<CredentialResponse>('GET', `/api/v1/tenants/${tenantId}/credentials/${credentialId}`);
  }

  async createCredential(tenantId: string, data: CreateCredentialRequest): Promise<CredentialResponse> {
    return this.request<CredentialResponse>('POST', `/api/v1/tenants/${tenantId}/credentials`, data, 'Credential created successfully');
  }

  async updateCredential(tenantId: string, credentialId: string, data: UpdateCredentialRequest): Promise<CredentialResponse> {
    return this.request<CredentialResponse>('PUT', `/api/v1/tenants/${tenantId}/credentials/${credentialId}`, data, 'Credential updated successfully');
  }

  async deleteCredential(tenantId: string, credentialId: string): Promise<void> {
    return this.request<void>('DELETE', `/api/v1/tenants/${tenantId}/credentials/${credentialId}`, undefined, 'Credential deleted successfully');
  }

  // ========== Credential Permissions ==========

  async getCredentialPrincipals(tenantId: string, credentialId: string): Promise<CredentialPrincipalsResponse> {
    return this.request<CredentialPrincipalsResponse>('GET', `/api/v1/tenants/${tenantId}/credentials/${credentialId}/principals`);
  }

  async setCredentialPermission(tenantId: string, credentialId: string, data: SetCredentialPermissionRequest): Promise<void> {
    return this.request<void>('POST', `/api/v1/tenants/${tenantId}/credentials/${credentialId}/principals`, data, 'Permission added successfully');
  }

  async deleteCredentialPermission(
    tenantId: string,
    credentialId: string,
    principalId: string,
    principalType: PrincipalTypeEnum,
    role: PermissionActionEnum
  ): Promise<void> {
    return this.request<void>(
      'DELETE',
      `/api/v1/tenants/${tenantId}/credentials/${credentialId}/principals`,
      { principal_id: principalId, principal_type: principalType, role },
      'Permission removed successfully'
    );
  }

  // ========== Development Platform Endpoints ==========

  async listDevelopmentPlatforms(
    tenantId: string, 
    params?: PaginationParams & OrderParams & { view?: 'quick-list' }
  ): Promise<DevelopmentPlatformResponse[] | QuickListItemResponse[]> {
    const query = this.buildQueryString(params || {});
    return this.request<DevelopmentPlatformResponse[] | QuickListItemResponse[]>('GET', `/api/v1/tenants/${tenantId}/development-platforms${query}`);
  }

  async getDevelopmentPlatform(tenantId: string, platformId: string): Promise<DevelopmentPlatformResponse> {
    return this.request<DevelopmentPlatformResponse>('GET', `/api/v1/tenants/${tenantId}/development-platforms/${platformId}`);
  }

  async createDevelopmentPlatform(tenantId: string, data: CreateDevelopmentPlatformRequest): Promise<DevelopmentPlatformResponse> {
    return this.request<DevelopmentPlatformResponse>('POST', `/api/v1/tenants/${tenantId}/development-platforms`, data, 'Development platform created successfully');
  }

  async updateDevelopmentPlatform(tenantId: string, platformId: string, data: UpdateDevelopmentPlatformRequest): Promise<DevelopmentPlatformResponse> {
    return this.request<DevelopmentPlatformResponse>('PUT', `/api/v1/tenants/${tenantId}/development-platforms/${platformId}`, data, 'Development platform updated successfully');
  }

  async deleteDevelopmentPlatform(tenantId: string, platformId: string): Promise<void> {
    return this.request<void>('DELETE', `/api/v1/tenants/${tenantId}/development-platforms/${platformId}`, undefined, 'Development platform deleted successfully');
  }

  // ========== Development Platform Permissions ==========

  async getDevelopmentPlatformPrincipals(tenantId: string, platformId: string): Promise<DevelopmentPlatformPrincipalsResponse> {
    return this.request<DevelopmentPlatformPrincipalsResponse>('GET', `/api/v1/tenants/${tenantId}/development-platforms/${platformId}/principals`);
  }

  async setDevelopmentPlatformPermission(tenantId: string, platformId: string, data: SetDevelopmentPlatformPermissionRequest): Promise<void> {
    return this.request<void>('POST', `/api/v1/tenants/${tenantId}/development-platforms/${platformId}/principals`, data, 'Permission added successfully');
  }

  async deleteDevelopmentPlatformPermission(
    tenantId: string,
    platformId: string,
    principalId: string,
    principalType: PrincipalTypeEnum,
    role: PermissionActionEnum
  ): Promise<void> {
    return this.request<void>(
      'DELETE',
      `/api/v1/tenants/${tenantId}/development-platforms/${platformId}/principals`,
      { principal_id: principalId, principal_type: principalType, role },
      'Permission removed successfully'
    );
  }

  // ========== Chat Widget Endpoints ==========

  async listChatWidgets(
    tenantId: string, 
    params?: PaginationParams & OrderParams & { view?: 'quick-list' }
  ): Promise<ChatWidgetResponse[] | QuickListItemResponse[]> {
    const query = this.buildQueryString(params || {});
    return this.request<ChatWidgetResponse[] | QuickListItemResponse[]>('GET', `/api/v1/tenants/${tenantId}/chat-widgets${query}`);
  }

  async getChatWidget(tenantId: string, widgetId: string): Promise<ChatWidgetResponse> {
    return this.request<ChatWidgetResponse>('GET', `/api/v1/tenants/${tenantId}/chat-widgets/${widgetId}`);
  }

  async createChatWidget(tenantId: string, data: CreateChatWidgetRequest): Promise<ChatWidgetResponse> {
    return this.request<ChatWidgetResponse>('POST', `/api/v1/tenants/${tenantId}/chat-widgets`, data, 'Chat widget created successfully');
  }

  async updateChatWidget(tenantId: string, widgetId: string, data: UpdateChatWidgetRequest): Promise<ChatWidgetResponse> {
    return this.request<ChatWidgetResponse>('PUT', `/api/v1/tenants/${tenantId}/chat-widgets/${widgetId}`, data, 'Chat widget updated successfully');
  }

  async deleteChatWidget(tenantId: string, widgetId: string): Promise<void> {
    return this.request<void>('DELETE', `/api/v1/tenants/${tenantId}/chat-widgets/${widgetId}`, undefined, 'Chat widget deleted successfully');
  }

  // ========== Chat Widget Permissions ==========

  async getChatWidgetPrincipals(tenantId: string, widgetId: string): Promise<ChatWidgetPrincipalsResponse> {
    return this.request<ChatWidgetPrincipalsResponse>('GET', `/api/v1/tenants/${tenantId}/chat-widgets/${widgetId}/principals`);
  }

  async setChatWidgetPermission(tenantId: string, widgetId: string, data: SetChatWidgetPermissionRequest): Promise<void> {
    return this.request<void>('POST', `/api/v1/tenants/${tenantId}/chat-widgets/${widgetId}/principals`, data, 'Permission added successfully');
  }

  async deleteChatWidgetPermission(
    tenantId: string,
    widgetId: string,
    principalId: string,
    principalType: PrincipalTypeEnum,
    role: PermissionActionEnum
  ): Promise<void> {
    return this.request<void>(
      'DELETE',
      `/api/v1/tenants/${tenantId}/chat-widgets/${widgetId}/principals`,
      { principal_id: principalId, principal_type: principalType, role },
      'Permission removed successfully'
    );
  }

  // ========== Custom Group Endpoints ==========

  async listCustomGroups(tenantId: string, params?: PaginationParams): Promise<CustomGroupResponse[]> {
    const query = this.buildQueryString(params || {});
    return this.request<CustomGroupResponse[]>('GET', `/api/v1/tenants/${tenantId}/custom-groups${query}`);
  }

  async getCustomGroup(tenantId: string, groupId: string): Promise<CustomGroupResponse> {
    return this.request<CustomGroupResponse>('GET', `/api/v1/tenants/${tenantId}/custom-groups/${groupId}`);
  }

  async createCustomGroup(tenantId: string, data: CreateCustomGroupRequest): Promise<CustomGroupResponse> {
    return this.request<CustomGroupResponse>('POST', `/api/v1/tenants/${tenantId}/custom-groups`, data, 'Custom group created successfully');
  }

  async updateCustomGroup(tenantId: string, groupId: string, data: UpdateCustomGroupRequest): Promise<CustomGroupResponse> {
    return this.request<CustomGroupResponse>('PUT', `/api/v1/tenants/${tenantId}/custom-groups/${groupId}`, data, 'Custom group updated successfully');
  }

  async deleteCustomGroup(tenantId: string, groupId: string): Promise<void> {
    return this.request<void>('DELETE', `/api/v1/tenants/${tenantId}/custom-groups/${groupId}`, undefined, 'Custom group deleted successfully');
  }

  // ========== Custom Group Principals ==========

  async getCustomGroupPrincipals(tenantId: string, groupId: string): Promise<CustomGroupPrincipalsResponse> {
    return this.request<CustomGroupPrincipalsResponse>('GET', `/api/v1/tenants/${tenantId}/custom-groups/${groupId}/principals`);
  }

  async setCustomGroupPrincipal(tenantId: string, groupId: string, data: SetPrincipalRoleRequest): Promise<void> {
    return this.request<void>('POST', `/api/v1/tenants/${tenantId}/custom-groups/${groupId}/principals`, data, 'Principal added successfully');
  }

  async deleteCustomGroupPrincipal(tenantId: string, groupId: string, data: DeletePrincipalRoleRequest): Promise<void> {
    return this.request<void>('DELETE', `/api/v1/tenants/${tenantId}/custom-groups/${groupId}/principals`, data, 'Principal removed successfully');
  }

  // ========== Tag Endpoints ==========

  async listTags(tenantId: string, params?: PaginationParams & { name?: string }): Promise<TagListResponse> {
    const query = this.buildQueryString(params || {});
    return this.request<TagListResponse>('GET', `/api/v1/tenants/${tenantId}/tags${query}`);
  }

  async getTag(tenantId: string, tagId: number): Promise<TagResponse> {
    return this.request<TagResponse>('GET', `/api/v1/tenants/${tenantId}/tags/${tagId}`);
  }

  async createTag(tenantId: string, data: CreateTagRequest): Promise<TagResponse> {
    return this.request<TagResponse>('POST', `/api/v1/tenants/${tenantId}/tags`, data, 'Tag created successfully');
  }

  async deleteTag(tenantId: string, tagId: number): Promise<void> {
    return this.request<void>('DELETE', `/api/v1/tenants/${tenantId}/tags/${tagId}`, undefined, 'Tag deleted successfully');
  }

  // ========== Resource Tags ==========

  async getResourceTags(tenantId: string, resourceType: string, resourceId: string): Promise<ResourceTagsResponse> {
    return this.request<ResourceTagsResponse>('GET', `/api/v1/tenants/${tenantId}/${resourceType}/${resourceId}/tags`);
  }

  async setResourceTags(tenantId: string, resourceType: string, resourceId: string, data: SetResourceTagsRequest): Promise<ResourceTagsResponse> {
    return this.request<ResourceTagsResponse>('PUT', `/api/v1/tenants/${tenantId}/${resourceType}/${resourceId}/tags`, data, 'Tags updated successfully');
  }

  // ========== Convenience Methods for Resource Tags ==========

  async getApplicationTags(tenantId: string, applicationId: string): Promise<ResourceTagsResponse> {
    return this.getResourceTags(tenantId, 'applications', applicationId);
  }

  async setApplicationTags(tenantId: string, applicationId: string, tags: string[]): Promise<ResourceTagsResponse> {
    return this.setResourceTags(tenantId, 'applications', applicationId, { tags });
  }

  async getAutonomousAgentTags(tenantId: string, agentId: string): Promise<ResourceTagsResponse> {
    return this.getResourceTags(tenantId, 'autonomous-agents', agentId);
  }

  async setAutonomousAgentTags(tenantId: string, agentId: string, tags: string[]): Promise<ResourceTagsResponse> {
    return this.setResourceTags(tenantId, 'autonomous-agents', agentId, { tags });
  }

  async getCredentialTags(tenantId: string, credentialId: string): Promise<ResourceTagsResponse> {
    return this.getResourceTags(tenantId, 'credentials', credentialId);
  }

  async setCredentialTags(tenantId: string, credentialId: string, tags: string[]): Promise<ResourceTagsResponse> {
    return this.setResourceTags(tenantId, 'credentials', credentialId, { tags });
  }

  async getDevelopmentPlatformTags(tenantId: string, platformId: string): Promise<ResourceTagsResponse> {
    return this.getResourceTags(tenantId, 'development-platforms', platformId);
  }

  async setDevelopmentPlatformTags(tenantId: string, platformId: string, tags: string[]): Promise<ResourceTagsResponse> {
    return this.setResourceTags(tenantId, 'development-platforms', platformId, { tags });
  }

  async getChatWidgetTags(tenantId: string, widgetId: string): Promise<ResourceTagsResponse> {
    return this.getResourceTags(tenantId, 'chat-widgets', widgetId);
  }

  async setChatWidgetTags(tenantId: string, widgetId: string, tags: string[]): Promise<ResourceTagsResponse> {
    return this.setResourceTags(tenantId, 'chat-widgets', widgetId, { tags });
  }

  // ========== User Favorites Endpoints ==========

  async listUserFavorites(tenantId: string, userId: string, resourceType: FavoriteResourceTypeEnum): Promise<UserFavoritesListResponse> {
    return this.request<UserFavoritesListResponse>('GET', `/api/v1/tenants/${tenantId}/users/${userId}/favorites/${resourceType}`);
  }

  async getUserFavorite(tenantId: string, userId: string, resourceType: FavoriteResourceTypeEnum, resourceId: string): Promise<UserFavoriteResponse> {
    return this.request<UserFavoriteResponse>('GET', `/api/v1/tenants/${tenantId}/users/${userId}/favorites/${resourceType}/${resourceId}`);
  }

  async addUserFavorite(tenantId: string, userId: string, resourceType: FavoriteResourceTypeEnum, resourceId: string): Promise<UserFavoriteResponse> {
    return this.request<UserFavoriteResponse>('POST', `/api/v1/tenants/${tenantId}/users/${userId}/favorites/${resourceType}/${resourceId}`, undefined, 'Added to favorites');
  }

  async removeUserFavorite(tenantId: string, userId: string, resourceType: FavoriteResourceTypeEnum, resourceId: string): Promise<void> {
    return this.request<void>('DELETE', `/api/v1/tenants/${tenantId}/users/${userId}/favorites/${resourceType}/${resourceId}`, undefined, 'Removed from favorites');
  }

  // ========== Convenience Methods for Favorites ==========

  async listApplicationFavorites(tenantId: string, userId: string): Promise<UserFavoritesListResponse> {
    return this.listUserFavorites(tenantId, userId, 'application' as FavoriteResourceTypeEnum);
  }

  async listAutonomousAgentFavorites(tenantId: string, userId: string): Promise<UserFavoritesListResponse> {
    return this.listUserFavorites(tenantId, userId, 'autonomous_agent' as FavoriteResourceTypeEnum);
  }

  async listConversationFavorites(tenantId: string, userId: string): Promise<UserFavoritesListResponse> {
    return this.listUserFavorites(tenantId, userId, 'conversation' as FavoriteResourceTypeEnum);
  }

  async listDevelopmentPlatformFavorites(tenantId: string, userId: string): Promise<UserFavoritesListResponse> {
    return this.listUserFavorites(tenantId, userId, 'development_platform' as FavoriteResourceTypeEnum);
  }

  async toggleFavorite(tenantId: string, userId: string, resourceType: FavoriteResourceTypeEnum, resourceId: string, isFavorite: boolean): Promise<void> {
    if (isFavorite) {
      await this.removeUserFavorite(tenantId, userId, resourceType, resourceId);
    } else {
      await this.addUserFavorite(tenantId, userId, resourceType, resourceId);
    }
  }
}
