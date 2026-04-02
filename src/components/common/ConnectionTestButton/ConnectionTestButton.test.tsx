import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/utils';
import { ConnectionTestButton } from './ConnectionTestButton';
import { TestConnectionType } from '../../../api/types';

vi.mock('../../../contexts', () => ({
  useIdentity: vi.fn(),
}));

import { useIdentity } from '../../../contexts';

const mockUseIdentity = vi.mocked(useIdentity);

const mockTestConnection = vi.fn();

describe('ConnectionTestButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseIdentity.mockReturnValue({
      apiClient: { testConnection: mockTestConnection } as never,
      selectedTenant: { id: 'tenant-1' } as never,
      user: null,
      tenants: [],
      selectTenant: vi.fn(),
      isLoading: false,
    } as never);
  });

  it('renders the test button', () => {
    renderWithProviders(
      <ConnectionTestButton
        testType={TestConnectionType.N8N_WORKFLOW}
        url="https://n8n.example.com/workflow/abc"
      />,
    );
    expect(screen.getByRole('button', { name: /test connection/i })).toBeInTheDocument();
  });

  it('disables button when url is empty', () => {
    renderWithProviders(
      <ConnectionTestButton
        testType={TestConnectionType.N8N_WORKFLOW}
        url=""
      />,
    );
    expect(screen.getByRole('button', { name: /test connection/i })).toBeDisabled();
  });

  it('disables button when disabled prop is true', () => {
    renderWithProviders(
      <ConnectionTestButton
        testType={TestConnectionType.N8N_WORKFLOW}
        url="https://n8n.example.com/workflow/abc"
        disabled
      />,
    );
    expect(screen.getByRole('button', { name: /test connection/i })).toBeDisabled();
  });

  it('shows success result on successful test', async () => {
    mockTestConnection.mockResolvedValue({
      success: true,
      message: 'Connection OK',
      response_time_ms: 42,
    });

    renderWithProviders(
      <ConnectionTestButton
        testType={TestConnectionType.N8N_WORKFLOW}
        url="https://n8n.example.com/workflow/abc"
        credentialId="cred-1"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /test connection/i }));

    await waitFor(() => {
      expect(screen.getByText('Connection OK')).toBeInTheDocument();
    });

    expect(mockTestConnection).toHaveBeenCalledWith('tenant-1', {
      test_type: TestConnectionType.N8N_WORKFLOW,
      url: 'https://n8n.example.com/workflow/abc',
      config: undefined,
      credential_id: 'cred-1',
    }, undefined);
  });

  it('shows error result on failed test', async () => {
    mockTestConnection.mockResolvedValue({
      success: false,
      message: 'Connection refused',
      response_time_ms: 5,
    });

    renderWithProviders(
      <ConnectionTestButton
        testType={TestConnectionType.REST_API_INVOKE}
        url="https://api.example.com/invoke"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /test connection/i }));

    await waitFor(() => {
      expect(screen.getByText('Connection refused')).toBeInTheDocument();
    });
  });

  it('shows fallback error on network failure', async () => {
    mockTestConnection.mockRejectedValue(new Error('Network error'));

    renderWithProviders(
      <ConnectionTestButton
        testType={TestConnectionType.FOUNDRY_AGENT}
        url="https://foundry.example.com"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /test connection/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to test connection/i)).toBeInTheDocument();
    });
  });
});
