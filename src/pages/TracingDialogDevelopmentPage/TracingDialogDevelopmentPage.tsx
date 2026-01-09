/**
 * TracingDialogDevelopmentPage
 * 
 * Development page for testing tracing visualization as modal dialog.
 * Route: /dev/tracing
 * 
 * Query Parameters:
 * - conversationId: Load traces for a conversation
 * - autonomousAgentId: Load traces for an autonomous agent
 * 
 * Example URLs:
 * - /dev/tracing?conversationId=abc123
 * - /dev/tracing?autonomousAgentId=xyz789
 * - /dev/tracing (shows input fields to add query params)
 */

import { type FC, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  TextInput,
  Button,
  Group,
  Paper,
  Alert,
  Stack,
  Code,
  Badge,
} from '@mantine/core';
import { IconSearch, IconEye } from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useIdentity } from '../../contexts';
import { TracingVisualDialog } from '../../components/tracing';
import type { FullTraceResponse, FullTracesListResponse } from '../../api/types';

export const TracingDialogDevelopmentPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { apiClient, selectedTenant } = useIdentity();

  // State
  const [traces, setTraces] = useState<FullTraceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpened, setDialogOpened] = useState(false);
  
  // Input state
  const [conversationIdInput, setConversationIdInput] = useState(
    searchParams.get('conversationId') || ''
  );
  const [autonomousAgentIdInput, setAutonomousAgentIdInput] = useState(
    searchParams.get('autonomousAgentId') || ''
  );

  // Get current mode from query params
  const conversationId = searchParams.get('conversationId');
  const autonomousAgentId = searchParams.get('autonomousAgentId');
  const hasQueryParams = !!conversationId || !!autonomousAgentId;

  /**
   * Fetch traces from API
   */
  const fetchTraces = useCallback(async () => {
    if (!apiClient || !selectedTenant) {
      setError('Kein API-Client oder Tenant verfügbar');
      return;
    }

    if (!conversationId && !autonomousAgentId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let response: FullTracesListResponse;

      if (conversationId) {
        response = await apiClient.getConversationTraces(
          selectedTenant.id,
          conversationId
        );
      } else if (autonomousAgentId) {
        response = await apiClient.getAutonomousAgentTraces(
          selectedTenant.id,
          autonomousAgentId
        );
      } else {
        return;
      }

      setTraces(response.traces || []);
    } catch (err) {
      console.error('Error fetching traces:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Traces');
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant, conversationId, autonomousAgentId]);

  /**
   * Load traces and open dialog when query params are present
   */
  useEffect(() => {
    if (hasQueryParams) {
      fetchTraces();
      setDialogOpened(true);
    } else {
      setDialogOpened(false);
      setTraces([]);
    }
  }, [hasQueryParams, fetchTraces]);

  /**
   * Close dialog handler - also clears query params
   */
  const handleCloseDialog = () => {
    setDialogOpened(false);
    setSearchParams({});
  };

  /**
   * Search handlers
   */
  const handleConversationSearch = () => {
    if (conversationIdInput.trim()) {
      setSearchParams({ conversationId: conversationIdInput.trim() });
    }
  };

  const handleAgentSearch = () => {
    if (autonomousAgentIdInput.trim()) {
      setSearchParams({ autonomousAgentId: autonomousAgentIdInput.trim() });
    }
  };

  return (
    <MainLayout>
      <Container size="md" py="xl">
        <Stack gap="lg">
          {/* Header */}
          <Paper p="lg" withBorder>
            <Group justify="space-between" align="center" mb="md">
              <Group gap="sm">
                <IconEye size={24} color="var(--color-primary-500)" />
                <Title order={3}>Tracing Development</Title>
                <Badge variant="light" color="orange">DEV</Badge>
              </Group>

              <Text size="sm" c="dimmed">
                Tenant: {selectedTenant?.name || 'Nicht ausgewählt'}
              </Text>
            </Group>

            <Text size="sm" c="dimmed" mb="lg">
              Geben Sie eine Conversation ID oder Autonomous Agent ID ein, um die Tracing-Visualisierung als Dialog zu öffnen.
            </Text>

            {/* Conversation ID Input */}
            <Stack gap="md">
              <Group gap="sm">
                <TextInput
                  placeholder="Conversation ID eingeben"
                  value={conversationIdInput}
                  onChange={(e) => setConversationIdInput(e.target.value)}
                  style={{ flex: 1 }}
                  onKeyDown={(e) => e.key === 'Enter' && handleConversationSearch()}
                />
                <Button
                  leftSection={<IconSearch size={14} />}
                  onClick={handleConversationSearch}
                  disabled={!conversationIdInput.trim()}
                >
                  Conversation Traces öffnen
                </Button>
              </Group>

              {/* Autonomous Agent ID Input */}
              <Group gap="sm">
                <TextInput
                  placeholder="Autonomous Agent ID eingeben"
                  value={autonomousAgentIdInput}
                  onChange={(e) => setAutonomousAgentIdInput(e.target.value)}
                  style={{ flex: 1 }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAgentSearch()}
                />
                <Button
                  leftSection={<IconSearch size={14} />}
                  onClick={handleAgentSearch}
                  disabled={!autonomousAgentIdInput.trim()}
                >
                  Agent Traces öffnen
                </Button>
              </Group>
            </Stack>
          </Paper>

          {/* Current Query Params Info */}
          {hasQueryParams && (
            <Alert color="blue" variant="light">
              <Group gap="xs">
                <Text size="sm" fw={500}>Aktive Query Parameter:</Text>
                <Code>
                  {conversationId 
                    ? `conversationId=${conversationId}`
                    : `autonomousAgentId=${autonomousAgentId}`
                  }
                </Code>
              </Group>
            </Alert>
          )}

          {/* Usage Hints */}
          <Paper p="lg" withBorder>
            <Title order={5} mb="sm">Verwendung</Title>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Direkte URLs mit Query-Parametern:
              </Text>
              <Code block>
{`/dev/tracing?conversationId=abc123
/dev/tracing?autonomousAgentId=xyz789`}
              </Code>
            </Stack>
          </Paper>
        </Stack>
      </Container>

      {/* Tracing Modal Dialog */}
      <TracingVisualDialog
        opened={dialogOpened}
        onClose={handleCloseDialog}
        modal={true}
        fetchTraces={fetchTraces}
        traces={traces}
        isLoading={isLoading}
        error={error}
      />
    </MainLayout>
  );
};

export default TracingDialogDevelopmentPage;
