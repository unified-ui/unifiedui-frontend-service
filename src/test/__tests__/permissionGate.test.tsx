import { screen } from '@testing-library/react';
import { renderWithProviders } from '../utils';
import { PermissionGate } from '../../components/common/PermissionGate';
import { TenantPermissionEnum, PermissionActionEnum } from '../../api/types';

vi.mock('../../contexts', () => ({
  useIdentity: vi.fn(),
}));

import { useIdentity } from '../../contexts';

const mockUseIdentity = vi.mocked(useIdentity);

function setupRoles(roles: string[]) {
  mockUseIdentity.mockReturnValue({
    user: null,
    tenants: [],
    selectedTenant: null,
    selectedTenantRoles: roles as TenantPermissionEnum[],
    isLoading: false,
    apiClient: null,
    refreshIdentity: vi.fn(),
    selectTenant: vi.fn(),
    getFoundryToken: vi.fn(),
  });
}

describe('PermissionGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mode="hide" (default)', () => {
    it('renders children when user has required role', () => {
      setupRoles([TenantPermissionEnum.CHAT_AGENTS_CREATOR]);
      renderWithProviders(
        <PermissionGate requiredRole={TenantPermissionEnum.CHAT_AGENTS_CREATOR}>
          <button>Create</button>
        </PermissionGate>
      );
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('hides children when user lacks required role', () => {
      setupRoles([TenantPermissionEnum.READER]);
      renderWithProviders(
        <PermissionGate requiredRole={TenantPermissionEnum.CHAT_AGENTS_CREATOR}>
          <button>Create</button>
        </PermissionGate>
      );
      expect(screen.queryByText('Create')).not.toBeInTheDocument();
    });

    it('renders fallback when user lacks permission', () => {
      setupRoles([TenantPermissionEnum.READER]);
      renderWithProviders(
        <PermissionGate
          requiredRole={TenantPermissionEnum.GLOBAL_ADMIN}
          fallback={<span>No access</span>}
        >
          <button>Admin Panel</button>
        </PermissionGate>
      );
      expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
      expect(screen.getByText('No access')).toBeInTheDocument();
    });

    it('renders children for GLOBAL_ADMIN regardless of resource permission', () => {
      setupRoles([TenantPermissionEnum.GLOBAL_ADMIN]);
      renderWithProviders(
        <PermissionGate permission={null} requiredAction="ADMIN">
          <button>Admin Action</button>
        </PermissionGate>
      );
      expect(screen.getByText('Admin Action')).toBeInTheDocument();
    });
  });

  describe('mode="disable"', () => {
    it('renders enabled children when user has permission', () => {
      setupRoles([TenantPermissionEnum.READER]);
      renderWithProviders(
        <PermissionGate
          permission={PermissionActionEnum.WRITE}
          requiredAction="WRITE"
          mode="disable"
        >
          <button>Save</button>
        </PermissionGate>
      );
      const button = screen.getByText('Save');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('renders disabled children when user lacks permission', () => {
      setupRoles([TenantPermissionEnum.READER]);
      renderWithProviders(
        <PermissionGate
          permission={PermissionActionEnum.READ}
          requiredAction="WRITE"
          mode="disable"
        >
          <button>Save</button>
        </PermissionGate>
      );
      const button = screen.getByText('Save');
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  describe('requiredRoles (OR logic)', () => {
    it('renders when user has any of the required roles', () => {
      setupRoles([TenantPermissionEnum.CREDENTIALS_CREATOR]);
      renderWithProviders(
        <PermissionGate requiredRoles={[
          TenantPermissionEnum.CHAT_AGENTS_CREATOR,
          TenantPermissionEnum.CREDENTIALS_CREATOR,
        ]}>
          <button>Create</button>
        </PermissionGate>
      );
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('hides when user has none of the required roles', () => {
      setupRoles([TenantPermissionEnum.READER]);
      renderWithProviders(
        <PermissionGate requiredRoles={[
          TenantPermissionEnum.CHAT_AGENTS_CREATOR,
          TenantPermissionEnum.CREDENTIALS_CREATOR,
        ]}>
          <button>Create</button>
        </PermissionGate>
      );
      expect(screen.queryByText('Create')).not.toBeInTheDocument();
    });
  });

  describe('resource permission checks', () => {
    it('hides when resource permission is null and action is ADMIN', () => {
      setupRoles([TenantPermissionEnum.READER]);
      renderWithProviders(
        <PermissionGate permission={null} requiredAction="ADMIN">
          <button>Delete</button>
        </PermissionGate>
      );
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('renders when resource permission is ADMIN and action is WRITE', () => {
      setupRoles([TenantPermissionEnum.READER]);
      renderWithProviders(
        <PermissionGate permission={PermissionActionEnum.ADMIN} requiredAction="WRITE">
          <button>Edit</button>
        </PermissionGate>
      );
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('hides when resource permission is READ and action is WRITE', () => {
      setupRoles([TenantPermissionEnum.READER]);
      renderWithProviders(
        <PermissionGate permission={PermissionActionEnum.READ} requiredAction="WRITE">
          <button>Edit</button>
        </PermissionGate>
      );
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  describe('combined role + permission', () => {
    it('hides when role matches but permission fails', () => {
      setupRoles([TenantPermissionEnum.CHAT_AGENTS_CREATOR]);
      renderWithProviders(
        <PermissionGate
          requiredRole={TenantPermissionEnum.CHAT_AGENTS_CREATOR}
          permission={PermissionActionEnum.READ}
          requiredAction="ADMIN"
        >
          <button>Manage</button>
        </PermissionGate>
      );
      expect(screen.queryByText('Manage')).not.toBeInTheDocument();
    });

    it('renders when both role and permission match', () => {
      setupRoles([TenantPermissionEnum.CHAT_AGENTS_CREATOR]);
      renderWithProviders(
        <PermissionGate
          requiredRole={TenantPermissionEnum.CHAT_AGENTS_CREATOR}
          permission={PermissionActionEnum.ADMIN}
          requiredAction="ADMIN"
        >
          <button>Manage</button>
        </PermissionGate>
      );
      expect(screen.getByText('Manage')).toBeInTheDocument();
    });
  });

  describe('no restrictions', () => {
    it('renders children when no role or permission props given', () => {
      setupRoles([TenantPermissionEnum.READER]);
      renderWithProviders(
        <PermissionGate>
          <button>Always Visible</button>
        </PermissionGate>
      );
      expect(screen.getByText('Always Visible')).toBeInTheDocument();
    });
  });
});
