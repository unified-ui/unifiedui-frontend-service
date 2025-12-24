import type {
  // Identity
  IdentityUserResponse,
  IdentityGroupResponse,
  IdentityUsersResponse,
  IdentityGroupsResponse,
  MeResponse,
  // Tenants
  TenantResponse,
  CreateTenantRequest,
  UpdateTenantRequest,
  SetPrincipalRequest,
  DeletePrincipalRequest,
  PrincipalsResponse,
  TenantPrincipalsResponse,
  // Applications
  ApplicationResponse,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  SetApplicationPermissionRequest,
  ApplicationPrincipalsResponse,
  PrincipalPermissionsResponse,
  // Autonomous Agents
  AutonomousAgentResponse,
  CreateAutonomousAgentRequest,
  UpdateAutonomousAgentRequest,
  SetAutonomousAgentPermissionRequest,
  AutonomousAgentPrincipalsResponse,
  // Conversations
  ConversationResponse,
  CreateConversationRequest,
  UpdateConversationRequest,
  SetConversationPermissionRequest,
  ConversationPrincipalsResponse,
  // Credentials
  CredentialResponse,
  CreateCredentialRequest,
  UpdateCredentialRequest,
  SetCredentialPermissionRequest,
  CredentialPrincipalsResponse,
  // Custom Groups
  CustomGroupResponse,
  CreateCustomGroupRequest,
  UpdateCustomGroupRequest,
  SetPrincipalRoleRequest,
  DeletePrincipalRoleRequest,
  CustomGroupPrincipalsResponse,
  // Health
  HealthCheckResponse,
  // Query Params
  PaginationParams,
  SearchParams,
} from './types';

export interface APIClientConfig {
  baseURL: string;
  getAccessToken: () => Promise<string>;
  onError?: (error: APIError) => void;
  onSuccess?: (message: string) => void;
}

export interface APIError {
  status: number;
  message: string;
  detail?: unknown;
}

export class UnifiedUIAPIClient {
  private baseURL: string;
  private getAccessToken: () => Promise<string>;
  private onError?: (error: APIError) => void;
  private onSuccess?: (message: string) => void;

  constructor(config: APIClientConfig) {
    this.baseURL = config.baseURL;
    this.getAccessToken = config.getAccessToken;
    this.onError = config.onError;
    this.onSuccess = config.onSuccess;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const token = await this.getAccessToken();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      };

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: APIError = {
          status: response.status,
          message: errorData.detail || response.statusText,
          detail: errorData,
        };
        
        if (this.onError) {
          this.onError(error);
        }
        
        throw error;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      // If it's already an APIError, just re-throw
      if (typeof error === 'object' && error !== null && 'status' in error) {
        throw error;
      }
      
      // Convert generic Error to APIError
      if (error instanceof Error) {
        const apiError: APIError = {
          status: 0,
          message: error.message,
        };
        
        if (this.onError) {
          this.onError(apiError);
        }
        
        throw apiError;
      }
      
      throw error;
    }
  }

  private buildQueryString(params: Record<string, unknown> | PaginationParams | SearchParams): string {
    const filtered = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    
    return filtered.length > 0 ? `?${filtered.join('&')}` : '';
  }

  // ========== Health ==========

  async healthCheck(): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>('/api/v1/healthcheck');
  }

  // ========== Identity ==========

  async getMe(): Promise<MeResponse> {
    return this.request<MeResponse>('/api/v1/identity/me');
  }

  async getUsers(params?: SearchParams): Promise<IdentityUsersResponse> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.request<IdentityUsersResponse>(`/api/v1/identity/users${queryString}`);
  }

  async getGroups(params?: SearchParams): Promise<IdentityGroupsResponse> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.request<IdentityGroupsResponse>(`/api/v1/identity/groups${queryString}`);
  }

  async getUserById(userId: string): Promise<IdentityUserResponse> {
    return this.request<IdentityUserResponse>(`/api/v1/identity/users/${userId}`);
  }

  async getGroupById(groupId: string): Promise<IdentityGroupResponse> {
    return this.request<IdentityGroupResponse>(`/api/v1/identity/groups/${groupId}`);
  }

  // ========== Tenants ==========

  async listTenants(params?: PaginationParams & { name?: string }): Promise<TenantResponse[]> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.request<TenantResponse[]>(`/api/v1/tenants${queryString}`);
  }

  async getTenant(tenantId: string): Promise<TenantResponse> {
    return this.request<TenantResponse>(`/api/v1/tenants/${tenantId}`);
  }

  async createTenant(data: CreateTenantRequest): Promise<TenantResponse> {
    const response = await this.request<TenantResponse>('/api/v1/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess(`Tenant "${data.name}" wurde erfolgreich erstellt`);
    }
    
    return response;
  }

  async updateTenant(tenantId: string, data: UpdateTenantRequest): Promise<TenantResponse> {
    const response = await this.request<TenantResponse>(`/api/v1/tenants/${tenantId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess('Tenant wurde erfolgreich aktualisiert');
    }
    
    return response;
  }

  async deleteTenant(tenantId: string): Promise<void> {
    await this.request<void>(`/api/v1/tenants/${tenantId}`, {
      method: 'DELETE',
    });
    
    if (this.onSuccess) {
      this.onSuccess('Tenant wurde erfolgreich gelöscht');
    }
  }

  async getTenantPrincipals(tenantId: string): Promise<TenantPrincipalsResponse> {
    return this.request<TenantPrincipalsResponse>(`/api/v1/tenants/${tenantId}/principals`);
  }

  async getTenantPrincipalById(tenantId: string, principalId: string): Promise<PrincipalsResponse> {
    return this.request<PrincipalsResponse>(`/api/v1/tenants/${tenantId}/principals/${principalId}`);
  }

  async setTenantPrincipal(tenantId: string, data: SetPrincipalRequest): Promise<PrincipalsResponse> {
    const response = await this.request<PrincipalsResponse>(`/api/v1/tenants/${tenantId}/principals`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess('Berechtigung wurde erfolgreich gesetzt');
    }
    
    return response;
  }

  async deleteTenantPrincipal(tenantId: string, data: DeletePrincipalRequest): Promise<PrincipalsResponse> {
    const response = await this.request<PrincipalsResponse>(`/api/v1/tenants/${tenantId}/principals`, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess('Berechtigung wurde erfolgreich entfernt');
    }
    
    return response;
  }

  // ========== Applications ==========

  async listApplications(tenantId: string, params?: PaginationParams & { name?: string }): Promise<ApplicationResponse[]> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.request<ApplicationResponse[]>(`/api/v1/tenants/${tenantId}/applications${queryString}`);
  }

  async getApplication(tenantId: string, applicationId: string): Promise<ApplicationResponse> {
    return this.request<ApplicationResponse>(`/api/v1/tenants/${tenantId}/applications/${applicationId}`);
  }

  async createApplication(tenantId: string, data: CreateApplicationRequest): Promise<ApplicationResponse> {
    const response = await this.request<ApplicationResponse>(`/api/v1/tenants/${tenantId}/applications`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess(`Application "${data.name}" wurde erfolgreich erstellt`);
    }
    
    return response;
  }

  async updateApplication(tenantId: string, applicationId: string, data: UpdateApplicationRequest): Promise<ApplicationResponse> {
    const response = await this.request<ApplicationResponse>(`/api/v1/tenants/${tenantId}/applications/${applicationId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess('Application wurde erfolgreich aktualisiert');
    }
    
    return response;
  }

  async deleteApplication(tenantId: string, applicationId: string): Promise<void> {
    await this.request<void>(`/api/v1/tenants/${tenantId}/applications/${applicationId}`, {
      method: 'DELETE',
    });
    
    if (this.onSuccess) {
      this.onSuccess('Application wurde erfolgreich gelöscht');
    }
  }

  async getApplicationPrincipals(tenantId: string, applicationId: string): Promise<ApplicationPrincipalsResponse> {
    return this.request<ApplicationPrincipalsResponse>(`/api/v1/tenants/${tenantId}/applications/${applicationId}/principals`);
  }

  async getApplicationPrincipalById(tenantId: string, applicationId: string, principalId: string): Promise<PrincipalPermissionsResponse> {
    return this.request<PrincipalPermissionsResponse>(`/api/v1/tenants/${tenantId}/applications/${applicationId}/principals/${principalId}`);
  }

  async setApplicationPermission(tenantId: string, applicationId: string, data: SetApplicationPermissionRequest): Promise<PrincipalPermissionsResponse> {
    const response = await this.request<PrincipalPermissionsResponse>(`/api/v1/tenants/${tenantId}/applications/${applicationId}/principals`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess('Berechtigung wurde erfolgreich gesetzt');
    }
    
    return response;
  }

  async deleteApplicationPermission(tenantId: string, applicationId: string, principalId: string, principalType: string): Promise<void> {
    await this.request<void>(`/api/v1/tenants/${tenantId}/applications/${applicationId}/principals/${principalId}?principal_type=${principalType}`, {
      method: 'DELETE',
    });
    
    if (this.onSuccess) {
      this.onSuccess('Berechtigung wurde erfolgreich entfernt');
    }
  }

  // ========== Autonomous Agents ==========

  async listAutonomousAgents(tenantId: string, params?: PaginationParams & { name?: string }): Promise<AutonomousAgentResponse[]> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.request<AutonomousAgentResponse[]>(`/api/v1/tenants/${tenantId}/autonomous-agents${queryString}`);
  }

  async getAutonomousAgent(tenantId: string, agentId: string): Promise<AutonomousAgentResponse> {
    return this.request<AutonomousAgentResponse>(`/api/v1/tenants/${tenantId}/autonomous-agents/${agentId}`);
  }

  async createAutonomousAgent(tenantId: string, data: CreateAutonomousAgentRequest): Promise<AutonomousAgentResponse> {
    const response = await this.request<AutonomousAgentResponse>(`/api/v1/tenants/${tenantId}/autonomous-agents`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess(`Agent "${data.name}" wurde erfolgreich erstellt`);
    }
    
    return response;
  }

  async updateAutonomousAgent(tenantId: string, agentId: string, data: UpdateAutonomousAgentRequest): Promise<AutonomousAgentResponse> {
    const response = await this.request<AutonomousAgentResponse>(`/api/v1/tenants/${tenantId}/autonomous-agents/${agentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess('Agent wurde erfolgreich aktualisiert');
    }
    
    return response;
  }

  async deleteAutonomousAgent(tenantId: string, agentId: string): Promise<void> {
    await this.request<void>(`/api/v1/tenants/${tenantId}/autonomous-agents/${agentId}`, {
      method: 'DELETE',
    });
    
    if (this.onSuccess) {
      this.onSuccess('Agent wurde erfolgreich gelöscht');
    }
  }

  async getAutonomousAgentPrincipals(tenantId: string, agentId: string): Promise<AutonomousAgentPrincipalsResponse> {
    return this.request<AutonomousAgentPrincipalsResponse>(`/api/v1/tenants/${tenantId}/autonomous-agents/${agentId}/principals`);
  }

  async getAutonomousAgentPrincipalById(tenantId: string, agentId: string, principalId: string): Promise<PrincipalPermissionsResponse> {
    return this.request<PrincipalPermissionsResponse>(`/api/v1/tenants/${tenantId}/autonomous-agents/${agentId}/principals/${principalId}`);
  }

  async setAutonomousAgentPermission(tenantId: string, agentId: string, data: SetAutonomousAgentPermissionRequest): Promise<PrincipalPermissionsResponse> {
    const response = await this.request<PrincipalPermissionsResponse>(`/api/v1/tenants/${tenantId}/autonomous-agents/${agentId}/principals`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess('Berechtigung wurde erfolgreich gesetzt');
    }
    
    return response;
  }

  async deleteAutonomousAgentPermission(tenantId: string, agentId: string, principalId: string, principalType: string): Promise<void> {
    await this.request<void>(`/api/v1/tenants/${tenantId}/autonomous-agents/${agentId}/principals/${principalId}?principal_type=${principalType}`, {
      method: 'DELETE',
    });
    
    if (this.onSuccess) {
      this.onSuccess('Berechtigung wurde erfolgreich entfernt');
    }
  }

  // ========== Conversations ==========

  async listConversations(tenantId: string, params?: PaginationParams & { name?: string }): Promise<ConversationResponse[]> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.request<ConversationResponse[]>(`/api/v1/tenants/${tenantId}/conversations${queryString}`);
  }

  async getConversation(tenantId: string, conversationId: string): Promise<ConversationResponse> {
    return this.request<ConversationResponse>(`/api/v1/tenants/${tenantId}/conversations/${conversationId}`);
  }

  async createConversation(tenantId: string, data: CreateConversationRequest): Promise<ConversationResponse> {
    const response = await this.request<ConversationResponse>(`/api/v1/tenants/${tenantId}/conversations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess(`Conversation "${data.name}" wurde erfolgreich erstellt`);
    }
    
    return response;
  }

  async updateConversation(tenantId: string, conversationId: string, data: UpdateConversationRequest): Promise<ConversationResponse> {
    const response = await this.request<ConversationResponse>(`/api/v1/tenants/${tenantId}/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess('Conversation wurde erfolgreich aktualisiert');
    }
    
    return response;
  }

  async deleteConversation(tenantId: string, conversationId: string): Promise<void> {
    await this.request<void>(`/api/v1/tenants/${tenantId}/conversations/${conversationId}`, {
      method: 'DELETE',
    });
    
    if (this.onSuccess) {
      this.onSuccess('Conversation wurde erfolgreich gelöscht');
    }
  }

  async getConversationPrincipals(tenantId: string, conversationId: string): Promise<ConversationPrincipalsResponse> {
    return this.request<ConversationPrincipalsResponse>(`/api/v1/tenants/${tenantId}/conversations/${conversationId}/principals`);
  }

  async getConversationPrincipalById(tenantId: string, conversationId: string, principalId: string): Promise<PrincipalPermissionsResponse> {
    return this.request<PrincipalPermissionsResponse>(`/api/v1/tenants/${tenantId}/conversations/${conversationId}/principals/${principalId}`);
  }

  async setConversationPermission(tenantId: string, conversationId: string, data: SetConversationPermissionRequest): Promise<PrincipalPermissionsResponse> {
    const response = await this.request<PrincipalPermissionsResponse>(`/api/v1/tenants/${tenantId}/conversations/${conversationId}/principals`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess('Berechtigung wurde erfolgreich gesetzt');
    }
    
    return response;
  }

  async deleteConversationPermission(tenantId: string, conversationId: string, principalId: string, principalType: string): Promise<void> {
    await this.request<void>(`/api/v1/tenants/${tenantId}/conversations/${conversationId}/principals/${principalId}?principal_type=${principalType}`, {
      method: 'DELETE',
    });
    
    if (this.onSuccess) {
      this.onSuccess('Berechtigung wurde erfolgreich entfernt');
    }
  }

  // ========== Credentials ==========

  async listCredentials(tenantId: string, params?: PaginationParams & { name?: string }): Promise<CredentialResponse[]> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.request<CredentialResponse[]>(`/api/v1/tenants/${tenantId}/credentials${queryString}`);
  }

  async getCredential(tenantId: string, credentialId: string): Promise<CredentialResponse> {
    return this.request<CredentialResponse>(`/api/v1/tenants/${tenantId}/credentials/${credentialId}`);
  }

  async createCredential(tenantId: string, data: CreateCredentialRequest): Promise<CredentialResponse> {
    const response = await this.request<CredentialResponse>(`/api/v1/tenants/${tenantId}/credentials`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess(`Credential "${data.name}" wurde erfolgreich erstellt`);
    }
    
    return response;
  }

  async updateCredential(tenantId: string, credentialId: string, data: UpdateCredentialRequest): Promise<CredentialResponse> {
    const response = await this.request<CredentialResponse>(`/api/v1/tenants/${tenantId}/credentials/${credentialId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess('Credential wurde erfolgreich aktualisiert');
    }
    
    return response;
  }

  async deleteCredential(tenantId: string, credentialId: string): Promise<void> {
    await this.request<void>(`/api/v1/tenants/${tenantId}/credentials/${credentialId}`, {
      method: 'DELETE',
    });
    
    if (this.onSuccess) {
      this.onSuccess('Credential wurde erfolgreich gelöscht');
    }
  }

  async getCredentialPrincipals(tenantId: string, credentialId: string): Promise<CredentialPrincipalsResponse> {
    return this.request<CredentialPrincipalsResponse>(`/api/v1/tenants/${tenantId}/credentials/${credentialId}/principals`);
  }

  async getCredentialPrincipalById(tenantId: string, credentialId: string, principalId: string): Promise<PrincipalPermissionsResponse> {
    return this.request<PrincipalPermissionsResponse>(`/api/v1/tenants/${tenantId}/credentials/${credentialId}/principals/${principalId}`);
  }

  async setCredentialPermission(tenantId: string, credentialId: string, data: SetCredentialPermissionRequest): Promise<PrincipalPermissionsResponse> {
    const response = await this.request<PrincipalPermissionsResponse>(`/api/v1/tenants/${tenantId}/credentials/${credentialId}/principals`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess('Berechtigung wurde erfolgreich gesetzt');
    }
    
    return response;
  }

  async deleteCredentialPermission(tenantId: string, credentialId: string, principalId: string, principalType: string): Promise<void> {
    await this.request<void>(`/api/v1/tenants/${tenantId}/credentials/${credentialId}/principals/${principalId}?principal_type=${principalType}`, {
      method: 'DELETE',
    });
    
    if (this.onSuccess) {
      this.onSuccess('Berechtigung wurde erfolgreich entfernt');
    }
  }

  // ========== Custom Groups ==========

  async listCustomGroups(tenantId: string, params?: PaginationParams & { name?: string }): Promise<CustomGroupResponse[]> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.request<CustomGroupResponse[]>(`/api/v1/tenants/${tenantId}/custom-groups${queryString}`);
  }

  async getCustomGroup(tenantId: string, groupId: string): Promise<CustomGroupResponse> {
    return this.request<CustomGroupResponse>(`/api/v1/tenants/${tenantId}/custom-groups/${groupId}`);
  }

  async createCustomGroup(tenantId: string, data: CreateCustomGroupRequest): Promise<CustomGroupResponse> {
    const response = await this.request<CustomGroupResponse>(`/api/v1/tenants/${tenantId}/custom-groups`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess(`Custom Group "${data.name}" wurde erfolgreich erstellt`);
    }
    
    return response;
  }

  async updateCustomGroup(tenantId: string, groupId: string, data: UpdateCustomGroupRequest): Promise<CustomGroupResponse> {
    const response = await this.request<CustomGroupResponse>(`/api/v1/tenants/${tenantId}/custom-groups/${groupId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess('Custom Group wurde erfolgreich aktualisiert');
    }
    
    return response;
  }

  async deleteCustomGroup(tenantId: string, groupId: string): Promise<void> {
    await this.request<void>(`/api/v1/tenants/${tenantId}/custom-groups/${groupId}`, {
      method: 'DELETE',
    });
    
    if (this.onSuccess) {
      this.onSuccess('Custom Group wurde erfolgreich gelöscht');
    }
  }

  async getCustomGroupPrincipals(tenantId: string, groupId: string): Promise<CustomGroupPrincipalsResponse> {
    return this.request<CustomGroupPrincipalsResponse>(`/api/v1/tenants/${tenantId}/custom-groups/${groupId}/principals`);
  }

  async getCustomGroupPrincipalById(tenantId: string, groupId: string, principalId: string): Promise<PrincipalPermissionsResponse> {
    return this.request<PrincipalPermissionsResponse>(`/api/v1/tenants/${tenantId}/custom-groups/${groupId}/principals/${principalId}`);
  }

  async setCustomGroupPrincipal(tenantId: string, groupId: string, data: SetPrincipalRoleRequest): Promise<PrincipalPermissionsResponse> {
    const response = await this.request<PrincipalPermissionsResponse>(`/api/v1/tenants/${tenantId}/custom-groups/${groupId}/principals`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess('Berechtigung wurde erfolgreich gesetzt');
    }
    
    return response;
  }

  async deleteCustomGroupPrincipal(tenantId: string, groupId: string, data: DeletePrincipalRoleRequest): Promise<void> {
    await this.request<void>(`/api/v1/tenants/${tenantId}/custom-groups/${groupId}/principals`, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
    
    if (this.onSuccess) {
      this.onSuccess('Berechtigung wurde erfolgreich entfernt');
    }
  }
}
