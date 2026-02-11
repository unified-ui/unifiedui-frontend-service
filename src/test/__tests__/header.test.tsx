import { screen } from '@testing-library/react';
import { renderWithProviders } from '../utils';
import { Header } from '../../components/layout/Header';

vi.mock('../../contexts', () => ({
  useIdentity: vi.fn(),
  useSidebarData: vi.fn(),
}));

vi.mock('../../auth', () => ({
  useAuth: vi.fn().mockReturnValue({
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    account: { username: 'john@example.com' },
  }),
}));

import { useIdentity, useSidebarData } from '../../contexts';

const mockUseIdentity = vi.mocked(useIdentity);
const mockUseSidebarData = vi.mocked(useSidebarData);

const mockUser = {
  id: 'user-1',
  identity_provider: 'microsoft',
  identity_tenant_id: 'tenant-1',
  display_name: 'John Doe',
  firstname: 'John',
  lastname: 'Doe',
  mail: 'john@example.com',
};

const mockTenants = [
  { id: 'tenant-1', name: 'Tenant One', description: 'First', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'tenant-2', name: 'Tenant Two', description: 'Second', created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-02T00:00:00Z' },
];

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseSidebarData.mockReturnValue({
      applications: [],
      autonomousAgents: [],
      chatWidgets: [],
      reActAgents: [],
      loadingStates: { applications: false, 'autonomous-agents': false, 'chat-widgets': false, 're-act-agents': false },
      errorStates: { applications: null, 'autonomous-agents': null, 'chat-widgets': null, 're-act-agents': null },
      fetchApplications: vi.fn(),
      fetchAutonomousAgents: vi.fn(),
      fetchChatWidgets: vi.fn(),
      fetchReActAgents: vi.fn(),
      fetchEntityData: vi.fn(),
      refreshApplications: vi.fn(),
      refreshAutonomousAgents: vi.fn(),
      refreshChatWidgets: vi.fn(),
      refreshReActAgents: vi.fn(),
      refreshEntityData: vi.fn(),
      hasFetched: vi.fn(),
      clearCache: vi.fn(),
    });
  });

  it('renders tenant name when tenant is selected', () => {
    mockUseIdentity.mockReturnValue({
      user: mockUser,
      tenants: mockTenants,
      selectedTenant: mockTenants[0],
      selectedTenantRoles: [],
      isLoading: false,
      apiClient: null,
      refreshIdentity: vi.fn(),
      selectTenant: vi.fn(),
      getFoundryToken: vi.fn(),
    });

    renderWithProviders(<Header />);
    expect(screen.getByText('Tenant One')).toBeInTheDocument();
  });

  it('shows "No Tenant" when no tenant selected', () => {
    mockUseIdentity.mockReturnValue({
      user: mockUser,
      tenants: [],
      selectedTenant: null,
      selectedTenantRoles: [],
      isLoading: false,
      apiClient: null,
      refreshIdentity: vi.fn(),
      selectTenant: vi.fn(),
      getFoundryToken: vi.fn(),
    });

    renderWithProviders(<Header />);
    expect(screen.getByText('No Tenant')).toBeInTheDocument();
  });

  it('renders search input as readOnly', () => {
    mockUseIdentity.mockReturnValue({
      user: mockUser,
      tenants: mockTenants,
      selectedTenant: mockTenants[0],
      selectedTenantRoles: [],
      isLoading: false,
      apiClient: null,
      refreshIdentity: vi.fn(),
      selectTenant: vi.fn(),
      getFoundryToken: vi.fn(),
    });

    renderWithProviders(<Header />);
    const searchInput = screen.getByPlaceholderText('Search or type a command...');
    expect(searchInput).toHaveAttribute('readonly');
  });

  it('does not contain any German strings', () => {
    mockUseIdentity.mockReturnValue({
      user: mockUser,
      tenants: mockTenants,
      selectedTenant: mockTenants[0],
      selectedTenantRoles: [],
      isLoading: false,
      apiClient: null,
      refreshIdentity: vi.fn(),
      selectTenant: vi.fn(),
      getFoundryToken: vi.fn(),
    });

    const { container } = renderWithProviders(<Header />);
    const textContent = container.textContent || '';
    expect(textContent).not.toMatch(/Kein Tenant/);
    expect(textContent).not.toMatch(/Keine Tenants/);
    expect(textContent).not.toMatch(/Tenant auswählen/);
    expect(textContent).not.toMatch(/Suchen/);
  });

  it('renders user account section with display name', () => {
    mockUseIdentity.mockReturnValue({
      user: mockUser,
      tenants: mockTenants,
      selectedTenant: mockTenants[0],
      selectedTenantRoles: [],
      isLoading: false,
      apiClient: null,
      refreshIdentity: vi.fn(),
      selectTenant: vi.fn(),
      getFoundryToken: vi.fn(),
    });

    renderWithProviders(<Header />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
