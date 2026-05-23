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
  TextInput,
  Skeleton,
  Button,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconEdit,
  IconCopy,
  IconCheck,
  IconAlertCircle,
  IconListDetails,
  IconInfoCircle,
  IconBraces,
  IconPlayerPlay,
  IconHistory,
  IconKey,
  IconSettings2,
} from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { SecretField, TracesTable, ConfirmDeleteDialog, DelayedTooltip, Breadcrumbs, EntityAvatar, WorkflowRunsTable, ContentCard, AccessDeniedBanner } from '../../components/common';
import type { TracesSortState, TraceDatePreset } from '../../components/common';
import { TracingVisualDialog } from '../../components/tracing';
import { EditWorkflowDialog } from '../../components/dialogs/EditWorkflowDialog';
import type { EditDialogTab } from '../../components/dialogs/EditWorkflowDialog';
import { IntegrationDialog } from '../../components/dialogs/IntegrationDialog';
import { ImportTraceDialog } from '../../components/dialogs/ImportTraceDialog';
import { StartWorkflowDialog } from '../../components/dialogs/StartWorkflowDialog';
import { useIdentity } from '../../contexts';
import { useSidebarData } from '../../contexts/SidebarDataContext';
import { useRecentVisits } from '../../contexts';
import { useDelayedLoading, useDialogParams } from '../../hooks';
import type { WorkflowResponse, FullTraceResponse, TracesListParams } from '../../api/types';
import { PermissionError } from '../../api/errors';
import classes from './WorkflowDetailsPage.module.css';

// ============================================================================
// Constants
// ============================================================================

const PAGE_SIZE = 20;

type DetailsTab = 'traces' | 'runs' | 'details';

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

export const WorkflowDetailsPage: FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { apiClient, selectedTenant } = useIdentity();
  const { refreshWorkflows } = useSidebarData();
  const { trackVisit } = useRecentVisits();

  // ---- Agent data ----
  const [agent, setAgent] = useState<WorkflowResponse | null>(null);
  const [agentLoading, setAgentLoading] = useState(true);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<PermissionError | null>(null);
  const showAgentSkeleton = useDelayedLoading(agentLoading, 500);

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

  // ---- Dialog params ----
  const { dialog, dialogTab, openDialog, closeDialog, setDialogTab } = useDialogParams();

  // ---- Traces ----
  const [traces, setTraces] = useState<FullTraceResponse[]>([]);
  const [tracesLoading, setTracesLoading] = useState(true);
  const [tracesLoadingMore, setTracesLoadingMore] = useState(false);
  const [tracesHasMore, setTracesHasMore] = useState(true);
  const tracesOffsetRef = useRef(0);
  const isFetchingTracesRef = useRef(false);
  const [traceSort, setTraceSort] = useState<TracesSortState>({ field: 'created_at', order: 'desc' });
  const [traceDatePreset, setTraceDatePreset] = useState<TraceDatePreset>('all');

  // ---- Delete trace ----
  const [traceToDelete, setTraceToDelete] = useState<FullTraceResponse | null>(null);
  const [deleteTraceLoading, setDeleteTraceLoading] = useState(false);

  // ---- Start workflow ----
  const [runsAutoRefreshTrigger, setRunsAutoRefreshTrigger] = useState(0);

  // ---- Auto-refresh timer ----
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(5);
  const autoRefreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
  const [primaryKeyCopying, setPrimaryKeyCopying] = useState(false);
  const [secondaryKeyCopying, setSecondaryKeyCopying] = useState(false);
  const [rotatingKey, setRotatingKey] = useState<1 | 2 | null>(null);
  const [confirmRotateKey, setConfirmRotateKey] = useState<1 | 2 | null>(null);

  // ---- Fetch agent ----
  const fetchAgent = useCallback(async () => {
    if (!apiClient || !selectedTenant || !agentId) return;
    setAgentLoading(true);
    setAgentError(null);
    setPermissionError(null);
    try {
      const data = await apiClient.getWorkflow(selectedTenant.id, agentId);
      setAgent(data);
    } catch (err) {
      if (err instanceof PermissionError) {
        setPermissionError(err);
      } else {
        setAgentError(err instanceof Error ? err.message : 'Failed to load workflow');
      }
    } finally {
      setAgentLoading(false);
    }
  }, [apiClient, selectedTenant, agentId]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  useEffect(() => {
    if (agent) {
      trackVisit({
        resource_type: 'workflow',
        resource_id: agent.id,
        resource_name: agent.name,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent?.id]);

  useEffect(() => {
    setPrimaryKey(null);
    setSecondaryKey(null);
  }, [agentId]);

  // ---- Fetch traces ----
  const fetchTraces = useCallback(
    async (reset = false) => {
      if (!apiClient || !selectedTenant || !agentId) return;
      if (isFetchingTracesRef.current) return;
      isFetchingTracesRef.current = true;

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
        const response = await apiClient.getWorkflowTraces(selectedTenant.id, agentId, params);
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
        isFetchingTracesRef.current = false;
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

  const handleRefreshTraces = useCallback(() => {
    fetchTraces(true);
  }, [fetchTraces]);

  // ---- Auto-refresh logic ----
  const startAutoRefresh = useCallback(() => {
    setAutoRefresh(true);
    setAutoRefreshCountdown(5);
  }, []);

  const stopAutoRefresh = useCallback(() => {
    setAutoRefresh(false);
    setAutoRefreshCountdown(5);
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    autoRefreshIntervalRef.current = setInterval(() => {
      setAutoRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchTraces(true);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [autoRefresh, fetchTraces]);

  const handleStartWorkflowSuccess = useCallback(() => {
    fetchTraces(true);
    startAutoRefresh();
    setRunsAutoRefreshTrigger((prev) => prev + 1);
  }, [fetchTraces, startAutoRefresh]);

  // ---- Open trace dialog ----
  const handleTraceRowClick = useCallback(
    async (trace: FullTraceResponse) => {
      if (!apiClient || !selectedTenant) return;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('traceId', trace.id);
        return next;
      });
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

  const handleRunClick = useCallback(
    async (executionId: string) => {
      if (!apiClient || !selectedTenant || !agentId || !agent) return;

      const existingTrace = traces.find((t) => t.referenceId === executionId);
      if (existingTrace) {
        handleTraceRowClick(existingTrace);
        return;
      }

      setTraceDialogLoading(true);
      setTraceDialogOpen(true);
      try {
        const result = await apiClient.importWorkflowTrace(selectedTenant.id, agentId, {
          type: agent.type,
          executionId,
        });
        const fullTrace = await apiClient.getTrace(selectedTenant.id, result.id);
        setSelectedTrace(fullTrace);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('traceId', result.id);
          return next;
        });
        fetchTraces(true);
      } catch {
        setSelectedTrace(null);
        setTraceDialogOpen(false);
      } finally {
        setTraceDialogLoading(false);
      }
    },
    [apiClient, selectedTenant, agentId, agent, traces, handleTraceRowClick, setSearchParams, fetchTraces]
  );

  const handleReImportTrace = useCallback(
    async (trace: FullTraceResponse) => {
      if (!apiClient || !selectedTenant || !agentId) return;
      try {
        await apiClient.refreshWorkflowTraceImport(selectedTenant.id, agentId, trace.id);
        fetchTraces(true);
      } catch {
        // Error handled by API client onError
      }
    },
    [apiClient, selectedTenant, agentId, fetchTraces]
  );

  const handleDeleteTrace = useCallback(async () => {
    if (!apiClient || !selectedTenant || !traceToDelete) return;
    setDeleteTraceLoading(true);
    try {
      await apiClient.deleteTrace(selectedTenant.id, traceToDelete.id);
      setTraceToDelete(null);
      fetchTraces(true);
    } catch {
      // Error handled by API client onError
    } finally {
      setDeleteTraceLoading(false);
    }
  }, [apiClient, selectedTenant, traceToDelete, fetchTraces]);

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

  // ---- Keys ----
  const revealKey = useCallback(
    async (keyNumber: 1 | 2) => {
      if (!apiClient || !selectedTenant || !agentId) return;
      const setLoading = keyNumber === 1 ? setPrimaryKeyLoading : setSecondaryKeyLoading;
      const setKey = keyNumber === 1 ? setPrimaryKey : setSecondaryKey;

      setLoading(true);
      try {
        const response = await apiClient.getWorkflowKey(selectedTenant.id, agentId, keyNumber);
        setKey(response.key);
      } catch {
        // Error handled by API client
      } finally {
        setLoading(false);
      }
    },
    [apiClient, selectedTenant, agentId]
  );

  const copyKey = useCallback(
    async (keyNumber: 1 | 2) => {
      if (!apiClient || !selectedTenant || !agentId) return;
      const currentKey = keyNumber === 1 ? primaryKey : secondaryKey;

      if (currentKey) {
        navigator.clipboard.writeText(currentKey);
        return;
      }

      const setCopying = keyNumber === 1 ? setPrimaryKeyCopying : setSecondaryKeyCopying;
      const setKey = keyNumber === 1 ? setPrimaryKey : setSecondaryKey;

      setCopying(true);
      try {
        const response = await apiClient.getWorkflowKey(selectedTenant.id, agentId, keyNumber);
        setKey(response.key);
        navigator.clipboard.writeText(response.key);
      } catch {
        // Error handled by API client
      } finally {
        setCopying(false);
      }
    },
    [apiClient, selectedTenant, agentId, primaryKey, secondaryKey]
  );

  const handleRotateKey = useCallback(async () => {
    if (!apiClient || !selectedTenant || !agentId || !confirmRotateKey) return;
    setRotatingKey(confirmRotateKey);
    try {
      const response = await apiClient.rotateWorkflowKey(selectedTenant.id, agentId, confirmRotateKey);
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
    closeDialog();
    fetchAgent();
    refreshWorkflows();
  }, [fetchAgent, refreshWorkflows, closeDialog]);

  // ---- Computed ----
  const agentServiceHost = import.meta.env.VITE_AGENT_SERVICE_URL || 'http://localhost:8085';

  const postEndpointUrl = useMemo(() => {
    if (!selectedTenant) return '';
    return `${agentServiceHost}/api/v1/agent-service/tenants/${selectedTenant.id}/traces`;
  }, [selectedTenant, agentServiceHost]);

  const putEndpointUrl = useMemo(() => {
    if (!selectedTenant || !agentId) return '';
    return `${agentServiceHost}/api/v1/agent-service/tenants/${selectedTenant.id}/workflows/${agentId}/traces/import`;
  }, [selectedTenant, agentId, agentServiceHost]);

  const n8nConfig = useMemo(() => {
    if (!agent || agent.type !== 'N8N') return null;
    const cfg = agent.config as {
      api_version?: string;
      workflow_endpoint?: string;
      api_api_key_credential_id?: string;
      webhook_url?: string;
      default_body?: Record<string, unknown>;
      default_query_params?: Record<string, string>;
    };
    return cfg;
  }, [agent]);

  // ---- Render ----
  return (
    <MainLayout>
          <Breadcrumbs items={[
            { label: 'Workflows', path: '/workflows' },
            { label: agent?.name || '' },
          ]} />

          {permissionError && !agentLoading && (
            <Stack py="xl" gap="md">
              <AccessDeniedBanner requiredRoles={permissionError.requiredRoles} />
              <Group>
                <ActionIcon variant="subtle" onClick={() => navigate('/workflows')}>
                  <IconArrowLeft size={20} />
                </ActionIcon>
                <Text c="dimmed">Back to Workflows</Text>
              </Group>
            </Stack>
          )}

          {agentError && !agentLoading && !permissionError && (
            <Stack py="xl" gap="md">
              <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
                {agentError}
              </Alert>
              <Group>
                <ActionIcon variant="subtle" onClick={() => navigate('/workflows')}>
                  <IconArrowLeft size={20} />
                </ActionIcon>
                <Text c="dimmed">Back to Workflows</Text>
              </Group>
            </Stack>
          )}

          {!agentError && !permissionError && (
            <>
          <div className={classes.header}>
            <Group gap="sm" mb="xs">
              <EntityAvatar entityType="workflow" size="md" />
              {showAgentSkeleton ? (
                <Skeleton height={28} width={200} radius="sm" />
              ) : (
                <Title order={2} className={classes.title}>
                  {agent?.name}
                </Title>
              )}
              {agent && (
                <Tooltip label="Edit">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={() => openDialog('edit', { dialogTab: 'details' })}
                  >
                    <IconEdit size={18} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>

            {showAgentSkeleton ? (
              <Skeleton height={14} width={300} radius="sm" ml={46} mt={4} />
            ) : agent?.description ? (
              <DelayedTooltip label={agent.description}>
                <Text size="sm" c="dimmed" className={classes.description} ml={46}>
                  {agent.description}
                </Text>
              </DelayedTooltip>
            ) : null}

            <Group gap="xs" mt="sm" ml={46}>
              {showAgentSkeleton ? (
                <>
                  <Skeleton height={20} width={60} radius="xl" />
                  <Skeleton height={20} width={50} radius="xl" />
                </>
              ) : agent ? (
                <>
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
                </>
              ) : null}
            </Group>
          </div>

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
              {agent?.type === 'N8N' && (
                <Tabs.Tab
                  value="runs"
                  leftSection={<IconHistory size={16} />}
                  className={classes.tab}
                >
                  Runs
                </Tabs.Tab>
              )}
              <Tabs.Tab
                value="details"
                leftSection={<IconInfoCircle size={16} />}
                className={classes.tab}
              >
                Details
              </Tabs.Tab>
            </Tabs.List>            <Tabs.Panel value="traces" className={classes.tabPanel}>
                {n8nConfig?.webhook_url && (
                  <Group gap="sm" mb="sm" justify="flex-end">
                    {autoRefresh && (
                      <Tooltip label="Click to stop auto-refresh">
                        <Badge
                          variant="light"
                          color="blue"
                          size="sm"
                          style={{ cursor: 'pointer' }}
                          onClick={stopAutoRefresh}
                        >
                          Refreshing in {autoRefreshCountdown}s
                        </Badge>
                      </Tooltip>
                    )}
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconPlayerPlay size={14} />}
                      onClick={() => openDialog('start-workflow')}
                    >
                      Start Workflow
                    </Button>
                  </Group>
                )}
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
                  onRefresh={handleRefreshTraces}
                  onReImport={handleReImportTrace}
                  onDelete={setTraceToDelete}
                  showReImport={agent?.type === 'N8N'}
                  onImport={() => openDialog('import-trace')}
                  showImport={agent?.type === 'N8N'}
                />
            </Tabs.Panel>

            {agent?.type === 'N8N' && (
              <Tabs.Panel value="runs" className={classes.tabPanel}>
                <WorkflowRunsTable
                  apiClient={apiClient ?? null}
                  tenantId={selectedTenant?.id ?? ''}
                  agentId={agentId!}
                  agentType={agent.type}
                  onRunClick={handleRunClick}
                  onStartWorkflow={() => openDialog('start-workflow')}
                  showStartWorkflow={!!n8nConfig?.webhook_url}
                  autoRefreshTrigger={runsAutoRefreshTrigger}
                />
              </Tabs.Panel>
            )}

            <Tabs.Panel value="details" className={classes.tabPanel}>
              <div className={classes.tabPanelScrollWrapper}>
                <div className={classes.tabPanelScrollArea}>
                <Stack gap="lg" className={classes.detailsSection}>
                {/* Endpoint & Keys Section */}
                <ContentCard title="Endpoint & Keys" icon={<IconKey size={18} />}>
                  <Stack gap="lg">
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
                                openDialog('integrate-workflow', { dialogTab: 'post' });
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
                                openDialog('integrate-workflow', { dialogTab: 'put' });
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
                      isCopying={primaryKeyCopying}
                      onReveal={() => revealKey(1)}
                      onCopy={() => copyKey(1)}
                      onRotate={() => setConfirmRotateKey(1)}
                      isRotating={rotatingKey === 1}
                      disabled={!agent?.allow_api_keys}
                      disabledTooltip="API key authentication is not allowed for this agent"
                    />

                    <SecretField
                      label="Secondary Key"
                      value={secondaryKey}
                      isLoading={secondaryKeyLoading}
                      isCopying={secondaryKeyCopying}
                      onReveal={() => revealKey(2)}
                      onCopy={() => copyKey(2)}
                      onRotate={() => setConfirmRotateKey(2)}
                      isRotating={rotatingKey === 2}
                      disabled={!agent?.allow_api_keys}
                      disabledTooltip="API key authentication is not allowed for this agent"
                    />
                  </Stack>
                </ContentCard>

                {/* N8N Config Section */}
                {n8nConfig && (
                  <ContentCard title="N8N Configuration" icon={<IconSettings2 size={18} />}>
                    <Stack gap="lg">
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
                      <TextInput
                        label="Webhook URL"
                        value={n8nConfig.webhook_url || '—'}
                        readOnly
                        styles={{ input: { cursor: 'default' } }}
                      />
                    </Stack>
                  </ContentCard>
                )}
              </Stack>
              </div>
              </div>
            </Tabs.Panel>
          </Tabs>
            </>
          )}

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
      <EditWorkflowDialog
        opened={dialog === 'edit'}
        workflowId={agentId || null}
        initialData={agent}
        activeTab={(dialogTab as EditDialogTab) || 'details'}
        onClose={closeDialog}
        onSuccess={handleEditSuccess}
        onTabChange={(tab) => setDialogTab(tab)}
      />

      <ConfirmDeleteDialog
        opened={confirmRotateKey !== null}
        onClose={() => setConfirmRotateKey(null)}
        onConfirm={handleRotateKey}
        title="Rotate API Key"
        message={`Are you sure you want to rotate the ${confirmRotateKey === 1 ? 'primary' : 'secondary'} key? The old key will stop working immediately.`}
        confirmButtonText="Rotate Key"
        isLoading={rotatingKey !== null}
      />

      {selectedTenant && agentId && (
        <IntegrationDialog
          opened={dialog === 'integrate-workflow'}
          onClose={closeDialog}
          tenantId={selectedTenant.id}
          agentId={agentId}
          defaultTab={(dialogTab as 'post' | 'put') || 'post'}
          allowApiKeys={agent?.allow_api_keys}
        />
      )}

      <ConfirmDeleteDialog
        opened={traceToDelete !== null}
        onClose={() => setTraceToDelete(null)}
        onConfirm={handleDeleteTrace}
        title="Delete Trace"
        message={`Are you sure you want to delete trace "${traceToDelete?.referenceName || traceToDelete?.referenceId || traceToDelete?.id}"? This action cannot be undone.`}
        confirmButtonText="Delete"
        isLoading={deleteTraceLoading}
      />

      {agentId && agent && (
        <ImportTraceDialog
          opened={dialog === 'import-trace'}
          onClose={closeDialog}
          onSuccess={() => fetchTraces(true)}
          agentId={agentId}
          agentType={agent.type}
        />
      )}

      {agentId && (
        <StartWorkflowDialog
          opened={dialog === 'start-workflow'}
          onClose={closeDialog}
          onSuccess={handleStartWorkflowSuccess}
          agentId={agentId}
          defaultBody={n8nConfig?.default_body}
          defaultQueryParams={n8nConfig?.default_query_params}
        />
      )}
    </MainLayout>
  );
};
