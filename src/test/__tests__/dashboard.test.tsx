import { act, screen } from '@testing-library/react';
import { renderWithProviders } from '../utils';
import { DashboardPage } from '../../pages/DashboardPage';

vi.mock('../../contexts', () => ({
  useIdentity: vi.fn(),
  useSidebarData: vi.fn().mockReturnValue({
    applications: [],
    autonomousAgents: [],
    chatWidgets: [],
    loadingStates: { applications: false, 'autonomous-agents': false, 'chat-widgets': false },
    errorStates: { applications: null, 'autonomous-agents': null, 'chat-widgets': null },
    fetchApplications: vi.fn(),
    fetchAutonomousAgents: vi.fn(),
    fetchChatWidgets: vi.fn(),
    fetchEntityData: vi.fn(),
    refreshApplications: vi.fn(),
    refreshAutonomousAgents: vi.fn(),
    refreshChatWidgets: vi.fn(),
    refreshEntityData: vi.fn(),
    hasFetched: vi.fn(),
    clearCache: vi.fn(),
  }),
  useChatSidebar: vi.fn().mockReturnValue({
    isVisible: false,
    onSidebarHoverEnter: vi.fn(),
    onSidebarHoverLeave: vi.fn(),
  }),
  useFavorites: vi.fn().mockReturnValue({
    favorites: new Map(),
    isFavorite: vi.fn().mockReturnValue(false),
    toggleFavorite: vi.fn(),
  }),
  useRecentVisits: vi.fn().mockReturnValue({
    recentVisits: [],
    trackVisit: vi.fn(),
    refreshRecentVisits: vi.fn(),
  }),
}));

vi.mock('../../auth', () => ({
  useAuth: vi.fn().mockReturnValue({
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    account: { username: 'john@example.com' },
  }),
}));

import { useIdentity } from '../../contexts';

const mockUseIdentity = vi.mocked(useIdentity);

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
  { id: 'tenant-1', name: 'Tenant One', description: 'First tenant', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'tenant-2', name: 'Tenant Two', description: 'Second tenant', created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-02T00:00:00Z' },
];

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state with skeletons', () => {
    vi.useFakeTimers();

    mockUseIdentity.mockReturnValue({
      user: null,
      tenants: [],
      selectedTenant: null,
      isLoading: true,
      apiClient: null,
      refreshIdentity: vi.fn(),
      selectTenant: vi.fn(),
      getFoundryToken: vi.fn(),
    });

    const { container } = renderWithProviders(<DashboardPage />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const skeletons = container.querySelectorAll('[data-mantine-component="Skeleton"],.mantine-Skeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);

    vi.useRealTimers();
  });

  it('shows welcome message with user name', () => {
    mockUseIdentity.mockReturnValue({
      user: mockUser,
      tenants: mockTenants,
      selectedTenant: mockTenants[0],
      isLoading: false,
      apiClient: null,
      refreshIdentity: vi.fn(),
      selectTenant: vi.fn(),
      getFoundryToken: vi.fn(),
    });

    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Welcome back, John Doe!')).toBeInTheDocument();
  });

  it('displays tenant subtitle when tenant is selected', () => {
    mockUseIdentity.mockReturnValue({
      user: mockUser,
      tenants: mockTenants,
      selectedTenant: mockTenants[0],
      isLoading: false,
      apiClient: null,
      refreshIdentity: vi.fn(),
      selectTenant: vi.fn(),
      getFoundryToken: vi.fn(),
    });

    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Here\'s what\'s happening in "Tenant One"')).toBeInTheDocument();
  });

  it('displays stat cards for applications, agents, and conversations', () => {
    mockUseIdentity.mockReturnValue({
      user: mockUser,
      tenants: mockTenants,
      selectedTenant: mockTenants[0],
      isLoading: false,
      apiClient: null,
      refreshIdentity: vi.fn(),
      selectTenant: vi.fn(),
      getFoundryToken: vi.fn(),
    });

    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Applications')).toBeInTheDocument();
    expect(screen.getByText('Autonomous Agents')).toBeInTheDocument();
    expect(screen.getByText('Conversations')).toBeInTheDocument();
  });

  it('shows empty favorites message when no favorites', () => {
    mockUseIdentity.mockReturnValue({
      user: mockUser,
      tenants: mockTenants,
      selectedTenant: mockTenants[0],
      isLoading: false,
      apiClient: null,
      refreshIdentity: vi.fn(),
      selectTenant: vi.fn(),
      getFoundryToken: vi.fn(),
    });

    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('No favorites yet. Star items to see them here.')).toBeInTheDocument();
  });

  it('shows empty recent visits message when no visits', () => {
    mockUseIdentity.mockReturnValue({
      user: mockUser,
      tenants: mockTenants,
      selectedTenant: mockTenants[0],
      isLoading: false,
      apiClient: null,
      refreshIdentity: vi.fn(),
      selectTenant: vi.fn(),
      getFoundryToken: vi.fn(),
    });

    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('No recent visits yet. Open items to track them here.')).toBeInTheDocument();
  });

  it('shows favorites and recently visited section headers', () => {
    mockUseIdentity.mockReturnValue({
      user: mockUser,
      tenants: mockTenants,
      selectedTenant: mockTenants[0],
      isLoading: false,
      apiClient: null,
      refreshIdentity: vi.fn(),
      selectTenant: vi.fn(),
      getFoundryToken: vi.fn(),
    });

    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Favorites')).toBeInTheDocument();
    expect(screen.getByText('Recently Visited')).toBeInTheDocument();
  });

  it('does not contain any German strings', () => {
    mockUseIdentity.mockReturnValue({
      user: mockUser,
      tenants: mockTenants,
      selectedTenant: mockTenants[0],
      isLoading: false,
      apiClient: null,
      refreshIdentity: vi.fn(),
      selectTenant: vi.fn(),
      getFoundryToken: vi.fn(),
    });

    const { container } = renderWithProviders(<DashboardPage />);
    const textContent = container.textContent || '';
    expect(textContent).not.toMatch(/Lade Dashboard/);
    expect(textContent).not.toMatch(/Willkommen/);
    expect(textContent).not.toMatch(/Benutzer/);
    expect(textContent).not.toMatch(/Aktueller Tenant/);
  });
});
