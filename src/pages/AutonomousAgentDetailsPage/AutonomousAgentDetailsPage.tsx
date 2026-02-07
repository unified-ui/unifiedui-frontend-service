import type { FC } from 'react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Stack,
  Group,
  Title,
  Text,
  Badge,
  Loader,
  Center,
  Alert,
  ActionIcon,
  Tooltip,
  Tabs,
  CopyButton,
  Box,
  Skeleton,
  TextInput,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconEdit,
  IconCopy,
  IconCheck,
  IconAlertCircle,
  IconListDetails,
  IconInfoCircle,
  IconRefresh,
  IconBraces,
} from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer, SecretField, TracesTable, ConfirmDeleteDialog, DelayedTooltip } from '../../components/common';
import type { TracesSortState, TraceDatePreset } from '../../components/common';
import { TracingVisualDialog } from '../../components/tracing';
import { EditAutonomousAgentDialog } from '../../components/dialogs/EditAutonomousAgentDialog';
import { IntegrationDialog } from '../../components/dialogs/IntegrationDialog';
import { useIdentity } from '../../contexts';
import { useSidebarData } from '../../contexts/SidebarDataContext';
import type { AutonomousAgentResponse, FullTraceResponse, TracesListParams } from '../../api/types';
import classes from './AutonomousAgentDetailsPage.module.css';

// ============================================================================
// Constants
// ============================================================================

const PAGE_SIZE = 20;

type DetailsTab = 'traces' | 'details';

function datePresetToRange(preset: TraceDatePreset): { created_after?: string; created_before?: string } {
  if (preset === 'all') return {};
  const now = new Date();
  let after: Date;
  switch (preset) {
    case 'today':
      after = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case '7days':
      after = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30days':
      after = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      after = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return {};
  }
  return { created_after: after.toISOString() };
}

// ============================================================================
// Component
// ============================================================================

export const AutonomousAgentDetailsPage: FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { apiClient, selectedTenant } = useIdentity();
  const { refreshAutonomousAgents } = useSidebarData();

  // ---- Agent data ----
  const [agent, setAgent] = useState<AutonomousAgentResponse | null>(null);
  const [agentLoading, setAgentLoading] = useState(true);
  const [agentError, setAgentError] = useState<string | null>(null);

  // ---- Tabs ----
  const activeTab = (searchParams.get('tab') as DetailsTab) || 'traces';
  const setActiveTab = useCallback(
    (tab: string | null) => {
      if (!tab) return;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        return next;
      });
    },
    [setSearchParams]
  );

  // ---- Edit Dialog ----
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // ---- Integration Dialog ----
  const [integrationDialogOpen, setIntegrationDialogOpen] = useState(false);
  const [integrationDialogTab, setIntegrationDialogTab] = useState<'post' | 'put'>('post');

  // ---- Traces ----
  const [traces, setTraces] = useState<FullTraceResponse[]>([]);
  const [tracesLoading, setTracesLoading] = useState(true);
  const [tracesLoadingMore, setTracesLoadingMore] = useState(false);
  const [tracesHasMore, setTracesHasMore] = useState(true);
  const tracesOffsetRef = useRef(0);
  const [traceSort, setTraceSort] = useState<TracesSortState>({ field: 'created_at', order: 'desc' });
  const [traceDatePreset, setTraceDatePreset] = useState<TraceDatePreset>('all');

  // ---- Tracing Dialog ----
  const traceIdParam = searchParams.get('traceId');
  const [selectedTrace, setSelectedTrace] = useState<FullTraceResponse | null>(null);
  const [traceDialogOpen, setTraceDialogOpen] = useState(false);
  const [traceDialogLoading, setTraceDialogLoading] = useState(false);

  // ---- Keys ----
  const [primaryKey, setPrimaryKey] = useState<string | null>(null);
  const [secondaryKey, setSecondaryKey] = useState<string | null>(null);
  const [primaryKeyLoading, setPrimaryKeyLoading] = useState(false);
  const [secondaryKeyLoading, setSecondaryKeyLoading] = useState(false);
  const [rotatingKey, setRotatingKey] = useState<1 | 2 | null>(null);
  const [confirmRotateKey, setConfirmRotateKey] = useState<1 | 2 | null>(null);

  // ---- Fetch agent ----
  const fetchAgent = useCallback(async () => {
    if (!apiClient || !selectedTenant || !agentId) return;
    setAgentLoading(true);
    setAgentError(null);
    try {
      const data = await apiClient.getAutonomousAgent(selectedTenant.id, agentId);
      setAgent(data);
    } catch {
      setAgentError('Failed to load autonomous agent');
    } finally {
      setAgentLoading(false);
    }
  }, [apiClient, selectedTenant, agentId]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  // ---- Fetch traces ----
  const fetchTraces = useCallback(
    async (reset = false) => {
      if (!apiClient || !selectedTenant || !agentId) return;

      if (reset) {
        setTracesLoading(true);
        tracesOffsetRef.current = 0;
        setTraces([]);
        setTracesHasMore(true);
      } else {
        setTracesLoadingMore(true);
      }

      try {
        const dateRange = datePresetToRange(traceDatePreset);
        const params: TracesListParams = {
          skip: reset ? 0 : tracesOffsetRef.current,
          limit: PAGE_SIZE,
          order: traceSort.order,
          order_by: traceSort.field,
          expand: false,
          ...dateRange,
        };
        const response = await apiClient.getAutonomousAgentTraces(selectedTenant.id, agentId, params);
        const newTraces = response.traces || [];

        if (reset) {
          setTraces(newTraces);
        } else {
          setTraces((prev) => [...prev, ...newTraces]);
        }

        tracesOffsetRef.current = (reset ? 0 : tracesOffsetRef.current) + newTraces.length;
        setTracesHasMore(newTraces.length >= PAGE_SIZE);
      } catch {
        // Silently handle — could show notification
      } finally {
        setTracesLoading(false);
        setTracesLoadingMore(false);
      }
    },
    [apiClient, selectedTenant, agentId, traceSort, traceDatePreset]
  );

  // Reset & refetch when sort/filter changes
  useEffect(() => {
    fetchTraces(true);
  }, [fetchTraces]);

  const handleLoadMore = useCallback(() => {
    if (!tracesLoadingMore && tracesHasMore) {
      fetchTraces(false);
    }
  }, [fetchTraces, tracesLoadingMore, tracesHasMore]);

  // ---- Open trace dialog ----
  const handleTraceRowClick = useCallback(
    async (trace: FullTraceResponse) => {
      if (!apiClient || !selectedTenant) return;
      // Update URL
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('traceId', trace.id);
        return next;
      });
      // Fetch full trace with nodes
      setTraceDialogLoading(true);
      setTraceDialogOpen(true);
      try {
        const fullTrace = await apiClient.getTrace(selectedTenant.id, trace.id);
        setSelectedTrace(fullTrace);
      } catch {
        setSelectedTrace(null);
      } finally {
        setTraceDialogLoading(false);
      }
    },
    [apiClient, selectedTenant, setSearchParams]
  );

  const handleTraceDialogClose = useCallback(() => {
    setTraceDialogOpen(false);
    setSelectedTrace(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('traceId');
      return next;
    });
  }, [setSearchParams]);

  // Open trace from URL on mount
  useEffect(() => {
    if (traceIdParam && !traceDialogOpen && apiClient && selectedTenant) {
      setTraceDialogOpen(true);
      setTraceDialogLoading(true);
      apiClient
        .getTrace(selectedTenant.id, traceIdParam)
        .then((fullTrace) => setSelectedTrace(fullTrace))
        .catch(() => setSelectedTrace(null))
        .finally(() => setTraceDialogLoading(false));
    }
    // Only run when traceIdParam changes on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [traceIdParam]);

  // ---- Refresh import ----
  const handleRefreshImport = useCallback(async () => {
    if (!apiClient || !selectedTenant || !agentId || !selectedTrace) return;
    try {
      const refreshed = await apiClient.refreshAutonomousAgentTraceImport(
        selectedTenant.id,
        agentId,
        selectedTrace.id
      );
      setSelectedTrace(refreshed);
    } catch {
      // Error handled by API client onError
    }
  }, [apiClient, selectedTenant, agentId, selectedTrace]);

  // ---- Keys ----
  const revealKey = useCallback(
    async (keyNumber: 1 | 2) => {
      if (!apiClient || !selectedTenant || !agentId) return;
      const setLoading = keyNumber === 1 ? setPrimaryKeyLoading : setSecondaryKeyLoading;
      const setKey = keyNumber === 1 ? setPrimaryKey : setSecondaryKey;

      setLoading(true);
      try {
        const response = await apiClient.getAutonomousAgentKey(selectedTenant.id, agentId, keyNumber);
        setKey(response.key);
      } catch {
        // Error handled by API client
      } finally {
        setLoading(false);
      }
    },
    [apiClient, selectedTenant, agentId]
  );

  const handleRotateKey = useCallback(async () => {
    if (!apiClient || !selectedTenant || !agentId || !confirmRotateKey) return;
    setRotatingKey(confirmRotateKey);
    try {
      const response = await apiClient.rotateAutonomousAgentKey(selectedTenant.id, agentId, confirmRotateKey);
      if (confirmRotateKey === 1) {
        setPrimaryKey(response.key);
      } else {
        setSecondaryKey(response.key);
      }
    } catch {
      // Error handled by API client
    } finally {
      setRotatingKey(null);
      setConfirmRotateKey(null);
    }
  }, [apiClient, selectedTenant, agentId, confirmRotateKey]);

  // ---- Edit ----
  const handleEditSuccess = useCallback(() => {
    setEditDialogOpen(false);
    fetchAgent();
    refreshAutonomousAgents();
  }, [fetchAgent, refreshAutonomousAgents]);

  // ---- Computed ----
  const postEndpointUrl = useMemo(() => {
    if (!selectedTenant) return '';
    const host = window.location.origin;
    return `${host}/api/v1/agent-service/tenants/${selectedTenant.id}/traces`;
  }, [selectedTenant]);

  const putEndpointUrl = useMemo(() => {
    if (!selectedTenant || !agentId) return '';
    const host = window.location.origin;
    return `${host}/api/v1/agent-service/tenants/${selectedTenant.id}/autonomous-agents/${agentId}/traces/import`;
  }, [selectedTenant, agentId]);

  const n8nConfig = useMemo(() => {
    if (!agent || agent.type !== 'N8N') return null;
    const cfg = agent.config as { api_version?: string; workflow_endpoint?: string; api_api_key_credential_id?: string };
    return cfg;
  }, [agent]);

  // ---- Render ----
  if (agentLoading) {
    return (
      <MainLayout>
        <PageContainer size="xl">
          <Center py="xl" style={{ minHeight: '60vh' }}>
            <Loader size="lg" />
          </Center>
        </PageContainer>
      </MainLayout>
    );
  }

  if (agentError || !agent) {
    return (
      <MainLayout>
        <PageContainer size="xl">
          <Stack py="xl" gap="md">
            <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
              {agentError || 'Agent not found'}
            </Alert>
            <Group>
              <ActionIcon variant="subtle" onClick={() => navigate('/autonomous-agents')}>
                <IconArrowLeft size={20} />
              </ActionIcon>
              <Text c="dimmed">Back to Autonomous Agents</Text>
            </Group>
          </Stack>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer size="xl">
          {/* Header */}
          <div className={classes.header}>
            <Group gap="sm" mb="xs">
              <Tooltip label="Back to list">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => navigate('/autonomous-agents')}
                >
                  <IconArrowLeft size={20} />
                </ActionIcon>
              </Tooltip>
              <Title order={2} className={classes.title}>
                {agent.name}
              </Title>
              <Tooltip label="Edit">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <IconEdit size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>

            {agent.description && (
              <DelayedTooltip label={agent.description}>
                <Text size="sm" c="dimmed" className={classes.description} ml={44}>
                  {agent.description}
                </Text>
              </DelayedTooltip>
            )}

            <Group gap="xs" mt="sm" ml={44}>
              <Badge variant="filled" size="sm" color="blue">
                {agent.type.toUpperCase()}
              </Badge>
              {agent.tags?.map((tag) => (
                <Badge key={tag.id} variant="light" size="sm" color="gray">
                  {tag.name}
                </Badge>
              ))}
              <Badge
                variant="dot"
                size="sm"
                color={agent.is_active ? 'green' : 'gray'}
              >
                {agent.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </Group>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            className={classes.tabs}
          >
            <Tabs.List className={classes.tabsList}>
              <Tabs.Tab
                value="traces"
                leftSection={<IconListDetails size={16} />}
                className={classes.tab}
              >
                Traces
              </Tabs.Tab>
              <Tabs.Tab
                value="details"
                leftSection={<IconInfoCircle size={16} />}
                className={classes.tab}
              >
                Details
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="traces" className={classes.tabPanel}>
              <div className={classes.tabPanelScrollWrapper}>
                <div className={classes.tabPanelScrollArea}>
                <TracesTable
                  traces={traces}
                  isLoading={tracesLoading}
                  isLoadingMore={tracesLoadingMore}
                  hasMore={tracesHasMore}
                  onLoadMore={handleLoadMore}
                  onRowClick={handleTraceRowClick}
                  sort={traceSort}
                  onSortChange={setTraceSort}
                  datePreset={traceDatePreset}
                  onDatePresetChange={setTraceDatePreset}
                />
                </div>
              </div>
            </Tabs.Panel>

            <Tabs.Panel value="details" className={classes.tabPanel}>
              <div className={classes.tabPanelScrollWrapper}>
                <div className={classes.tabPanelScrollArea}>
                <Stack gap="lg" className={classes.detailsSection}>
                {/* Endpoint & Keys Section */}
                <div className={classes.sectionCard}>
                  <Text className={classes.sectionTitle}>Endpoint & Keys</Text>
                  <Stack gap="md">
                    <TextInput
                      label="POST Endpoint"
                      value={postEndpointUrl}
                      readOnly
                      styles={{ input: { fontFamily: 'monospace', cursor: 'default' } }}
                      rightSectionWidth={60}
                      rightSection={
                        <Group gap={2} wrap="nowrap">
                          <CopyButton value={postEndpointUrl} timeout={2000}>
                            {({ copied, copy }) => (
                              <Tooltip label={copied ? 'Copied!' : 'Copy'}>
                                <ActionIcon variant="subtle" color={copied ? 'teal' : 'gray'} size="sm" onClick={copy}>
                                  {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </CopyButton>
                          <Tooltip label="Sample JSON">
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="sm"
                              onClick={() => {
                                setIntegrationDialogTab('post');
                                setIntegrationDialogOpen(true);
                              }}
                            >
                              <IconBraces size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      }
                    />

                    <TextInput
                      label="PUT Import Endpoint"
                      value={putEndpointUrl}
                      readOnly
                      styles={{ input: { fontFamily: 'monospace', cursor: 'default' } }}
                      rightSectionWidth={60}
                      rightSection={
                        <Group gap={2} wrap="nowrap">
                          <CopyButton value={putEndpointUrl} timeout={2000}>
                            {({ copied, copy }) => (
                              <Tooltip label={copied ? 'Copied!' : 'Copy'}>
                                <ActionIcon variant="subtle" color={copied ? 'teal' : 'gray'} size="sm" onClick={copy}>
                                  {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </CopyButton>
                          <Tooltip label="Sample JSON">
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="sm"
                              onClick={() => {
                                setIntegrationDialogTab('put');
                                setIntegrationDialogOpen(true);
                              }}
                            >
                              <IconBraces size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      }
                    />

                    <SecretField
                      label="Primary Key"
                      value={primaryKey}
                      isLoading={primaryKeyLoading}
                      onReveal={() => revealKey(1)}
                      onRotate={() => setConfirmRotateKey(1)}
                      isRotating={rotatingKey === 1}
                    />

                    <SecretField
                      label="Secondary Key"
                      value={secondaryKey}
                      isLoading={secondaryKeyLoading}
                      onReveal={() => revealKey(2)}
                      onRotate={() => setConfirmRotateKey(2)}
                      isRotating={rotatingKey === 2}
                    />
                  </Stack>
                </div>

                {/* N8N Config Section */}
                {n8nConfig && (
                  <div className={classes.sectionCard}>
                    <Text className={classes.sectionTitle}>N8N Configuration</Text>
                    <Stack gap="md">
                      <TextInput
                        label="Workflow Endpoint"
                        value={n8nConfig.workflow_endpoint || '—'}
                        readOnly
                        styles={{ input: { cursor: 'default' } }}
                      />
                      <TextInput
                        label="API Version"
                        value={n8nConfig.api_version || '—'}
                        readOnly
                        styles={{ input: { cursor: 'default' } }}
                      />
                      <TextInput
                        label="API Key Credential ID"
                        value={n8nConfig.api_api_key_credential_id || '—'}
                        readOnly
                        styles={{ input: { cursor: 'default' } }}
                      />
                    </Stack>
                  </div>
                )}
              </Stack>
              </div>
              </div>
            </Tabs.Panel>
          </Tabs>
        </PageContainer>

      {/* Tracing Dialog */}
      <TracingVisualDialog
        opened={traceDialogOpen && !traceDialogLoading}
        onClose={handleTraceDialogClose}
        traces={selectedTrace ? [selectedTrace] : []}
        initialTraceId={selectedTrace?.id}
      />

      {/* Loading overlay for trace fetch */}
      {traceDialogOpen && traceDialogLoading && (
        <Box className={classes.traceLoadingOverlay}>
          <Center style={{ height: '100%' }}>
            <Stack align="center" gap="sm">
              <Loader size="lg" />
              <Text size="sm" c="dimmed">Loading trace...</Text>
            </Stack>
          </Center>
        </Box>
      )}

      {/* Edit Dialog */}
      <EditAutonomousAgentDialog
        opened={editDialogOpen}
        autonomousAgentId={agentId || null}
        initialData={agent}
        onClose={() => setEditDialogOpen(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Confirm Rotate Key Dialog */}
      <ConfirmDeleteDialog
        opened={confirmRotateKey !== null}
        onClose={() => setConfirmRotateKey(null)}
        onConfirm={handleRotateKey}
        title="Rotate API Key"
        message={`Are you sure you want to rotate the ${confirmRotateKey === 1 ? 'primary' : 'secondary'} key? The old key will stop working immediately.`}
        confirmButtonText="Rotate Key"
        isLoading={rotatingKey !== null}
      />

      {/* Integration Dialog */}
      {selectedTenant && agentId && (
        <IntegrationDialog
          opened={integrationDialogOpen}
          onClose={() => setIntegrationDialogOpen(false)}
          tenantId={selectedTenant.id}
          agentId={agentId}
          defaultTab={integrationDialogTab}
        />
      )}
    </MainLayout>
  );
};
