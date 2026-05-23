import type { FC } from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Table,
  Group,
  Text,
  Badge,
  ActionIcon,
  Tooltip,
  Select,
  Loader,
  Center,
  Button,
  Menu,
} from '@mantine/core';
import {
  IconRefresh,
  IconPlayerPlay,
  IconDots,
  IconRotateClockwise,
  IconClock,
  IconClockPause,
} from '@tabler/icons-react';
import type { WorkflowRunResponse } from '../../../api/types';
import type { UnifiedUIAPIClient } from '../../../api/client';
import { PermissionError } from '../../../api/errors';
import { AccessDeniedBanner } from '../AccessDeniedBanner';
import classes from './WorkflowRunsTable.module.css';

interface WorkflowRunsTableProps {
  apiClient: UnifiedUIAPIClient | null;
  tenantId: string;
  agentId: string;
  agentType: string;
  onRunClick: (executionId: string) => void;
  onStartWorkflow: () => void;
  showStartWorkflow: boolean;
  autoRefreshTrigger?: number;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'success', label: 'Success' },
  { value: 'error', label: 'Error' },
  { value: 'running', label: 'Running' },
  { value: 'waiting', label: 'Waiting' },
];

const AUTO_REFRESH_SECONDS = 5;

function statusColor(s: string): string {
  switch (s) {
    case 'success':
      return 'green';
    case 'error':
      return 'red';
    case 'running':
    case 'waiting':
      return 'blue';
    default:
      return 'gray';
  }
}

function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
}

function formatDuration(startedAt: string | undefined, stoppedAt: string | undefined): string {
  if (!startedAt || !stoppedAt) return '—';
  const ms = new Date(stoppedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export const WorkflowRunsTable: FC<WorkflowRunsTableProps> = ({
  apiClient,
  tenantId,
  agentId,
  agentType: _agentType,
  onRunClick,
  onStartWorkflow,
  showStartWorkflow,
  autoRefreshTrigger,
}) => {
  const [runs, setRuns] = useState<WorkflowRunResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const nextCursorRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  const [hasMore, setHasMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<PermissionError | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(AUTO_REFRESH_SECONDS);
  const autoRefreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRuns = useCallback(
    async (reset = true) => {
      if (!apiClient || !tenantId) return;

      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
        isLoadingRef.current = true;
      }

      try {
        const response = await apiClient.listWorkflowRuns(tenantId, agentId, {
          limit: 20,
          cursor: reset ? undefined : (nextCursorRef.current ?? undefined),
          status: statusFilter || undefined,
        });

        if (reset) {
          setRuns(response.runs);
        } else {
          setRuns((prev) => [...prev, ...response.runs]);
        }
        nextCursorRef.current = response.nextCursor ?? null;
        setHasMore(!!response.nextCursor && response.runs.length > 0);
      } catch (error) {
        if (error instanceof PermissionError) {
          setPermissionError(error);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        isLoadingRef.current = false;
      }
    },
    [apiClient, tenantId, agentId, statusFilter]
  );

  useEffect(() => {
    fetchRuns(true);
  }, [fetchRuns]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchRuns(false);
    }
  }, [fetchRuns, isLoadingMore, hasMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoadingRef.current) {
          handleLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, handleLoadMore]);

  const handleRefresh = useCallback(() => {
    fetchRuns(true);
  }, [fetchRuns]);

  const handleRetry = useCallback(
    async (executionId: string) => {
      if (!apiClient || !tenantId) return;
      setRetryingId(executionId);
      try {
        await apiClient.retryWorkflowRun(tenantId, agentId, executionId);
        fetchRuns(true);
      } catch {
        // Error handled by API client onError
      } finally {
        setRetryingId(null);
      }
    },
    [apiClient, tenantId, agentId, fetchRuns]
  );

  const startAutoRefresh = useCallback(() => {
    setAutoRefresh(true);
    setAutoRefreshCountdown(AUTO_REFRESH_SECONDS);
  }, []);

  useEffect(() => {
    if (autoRefreshTrigger && autoRefreshTrigger > 0) {
      fetchRuns(true);
      startAutoRefresh();
    }
  }, [autoRefreshTrigger, fetchRuns, startAutoRefresh]);

  const stopAutoRefresh = useCallback(() => {
    setAutoRefresh(false);
    setAutoRefreshCountdown(AUTO_REFRESH_SECONDS);
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    if (autoRefresh) {
      stopAutoRefresh();
    } else {
      startAutoRefresh();
    }
  }, [autoRefresh, startAutoRefresh, stopAutoRefresh]);

  const countdownRef = useRef(AUTO_REFRESH_SECONDS);

  useEffect(() => {
    if (!autoRefresh) return;

    countdownRef.current = AUTO_REFRESH_SECONDS;
    setAutoRefreshCountdown(AUTO_REFRESH_SECONDS);

    autoRefreshIntervalRef.current = setInterval(() => {
      countdownRef.current -= 1;
      if (countdownRef.current <= 0) {
        countdownRef.current = AUTO_REFRESH_SECONDS;
        setAutoRefreshCountdown(AUTO_REFRESH_SECONDS);
        fetchRuns(true);
      } else {
        setAutoRefreshCountdown(countdownRef.current);
      }
    }, 1000);

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [autoRefresh, fetchRuns]);

  useEffect(() => {
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className={classes.container}>
      {permissionError ? (
        <AccessDeniedBanner
          requiredRoles={permissionError.requiredRoles}
          userRoles={permissionError.userRoles}
        />
      ) : (
        <>
      <Group className={classes.toolbar} justify="space-between">
        <Group gap="sm">
          <Select
            className={classes.statusFilter}
            size="xs"
            data={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val ?? '')}
            allowDeselect={false}
          />
        </Group>
        <Group gap="sm">
          {autoRefresh && (
            <Badge variant="light" color="blue" size="sm">
              {autoRefreshCountdown}s
            </Badge>
          )}
          <Tooltip label={autoRefresh ? 'Stop auto-refresh' : 'Start auto-refresh'}>
            <ActionIcon
              variant={autoRefresh ? 'filled' : 'subtle'}
              color={autoRefresh ? 'blue' : 'gray'}
              size="sm"
              onClick={toggleAutoRefresh}
            >
              {autoRefresh ? <IconClockPause size={16} /> : <IconClock size={16} />}
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Refresh">
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleRefresh} loading={isLoading}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
          {showStartWorkflow && (
            <Button size="xs" variant="light" leftSection={<IconPlayerPlay size={14} />} onClick={onStartWorkflow}>
              Start Workflow
            </Button>
          )}
        </Group>
      </Group>

      {isLoading && runs.length === 0 ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : runs.length === 0 ? (
        <Center py="xl">
          <Text size="sm" c="dimmed">
            No workflow runs found
          </Text>
        </Center>
      ) : (
        <div className={classes.scrollWrapper}>
          <div className={classes.scrollArea}>
            <Table striped highlightOnHover className={classes.table}>
              <Table.Thead className={classes.thead}>
                <Table.Tr>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Started</Table.Th>
                  <Table.Th>Duration</Table.Th>
                  <Table.Th>Mode</Table.Th>
                  <Table.Th style={{ width: 40 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {runs.map((run) => (
                  <Table.Tr key={run.id} className={classes.row} onClick={() => onRunClick(run.id)}>
                    <Table.Td>
                      <Badge size="sm" color={statusColor(run.status)} variant="light">
                        {run.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" ff="monospace" truncate>
                        {run.id}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {formatDateTime(run.startedAt)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {formatDuration(run.startedAt, run.stoppedAt)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {run.mode}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Menu position="bottom-end" withinPortal>
                        <Menu.Target>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconRotateClockwise size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetry(run.id);
                            }}
                            disabled={run.status !== 'error' || retryingId === run.id}
                          >
                            {retryingId === run.id ? 'Retrying...' : 'Re-Run'}
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}

            {isLoadingMore && (
              <Center py="md">
                <Loader size="sm" />
              </Center>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
