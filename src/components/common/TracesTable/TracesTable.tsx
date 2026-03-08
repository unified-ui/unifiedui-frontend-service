import type { FC } from 'react';
import { useRef, useEffect, useCallback } from 'react';
import {
  Table,
  Group,
  Text,
  Select,
  Loader,
  Center,
  Stack,
  ActionIcon,
  Tooltip,
  Menu,
  Skeleton,
} from '@mantine/core';
import {
  IconSortAscending,
  IconSortDescending,
  IconMoodEmpty,
  IconRefresh,
  IconDots,
  IconTrash,
  IconDownload,
  IconGitBranch,
} from '@tabler/icons-react';
import type { FullTraceResponse } from '../../../api/types';
import { useDelayedLoading } from '../../../hooks';
import { DelayedTooltip } from '../DelayedTooltip';
import classes from './TracesTable.module.css';

// ============================================================================
// Types
// ============================================================================

export type TraceSortField = 'created_at' | 'updated_at';
export type TraceSortOrder = 'asc' | 'desc';

export type TraceDatePreset = 'today' | '7days' | '30days' | 'year' | 'all';

export interface TracesSortState {
  field: TraceSortField;
  order: TraceSortOrder;
}

export interface TracesTableProps {
  traces: FullTraceResponse[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRowClick?: (trace: FullTraceResponse) => void;
  sort: TracesSortState;
  onSortChange: (sort: TracesSortState) => void;
  datePreset: TraceDatePreset;
  onDatePresetChange: (preset: TraceDatePreset) => void;
  onRefresh?: () => void;
  onReImport?: (trace: FullTraceResponse) => void;
  onDelete?: (trace: FullTraceResponse) => void;
  showReImport?: boolean;
  emptyMessage?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DATE_PRESETS: { value: TraceDatePreset; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 days' },
  { value: '30days', label: 'Last 30 days' },
  { value: 'year', label: 'This year' },
];

const SORT_FIELDS: { value: TraceSortField; label: string }[] = [
  { value: 'created_at', label: 'Created at' },
  { value: 'updated_at', label: 'Updated at' },
];

// ============================================================================
// Helpers
// ============================================================================

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ============================================================================
// Component
// ============================================================================

export const TracesTable: FC<TracesTableProps> = ({
  traces,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onRowClick,
  sort,
  onSortChange,
  datePreset,
  onDatePresetChange,
  onRefresh,
  onReImport,
  onDelete,
  showReImport = false,
  emptyMessage = 'No traces found',
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const showLoadingSkeleton = useDelayedLoading(isLoading, 500);

  useEffect(() => {
    isLoadingRef.current = isLoadingMore;
  }, [isLoadingMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isLoadingRef.current) {
          onLoadMore();
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
  }, [hasMore, onLoadMore]);

  const handleSortFieldChange = useCallback(
    (value: string | null) => {
      if (value) {
        onSortChange({ ...sort, field: value as TraceSortField });
      }
    },
    [sort, onSortChange]
  );

  const toggleSortOrder = useCallback(() => {
    onSortChange({ ...sort, order: sort.order === 'asc' ? 'desc' : 'asc' });
  }, [sort, onSortChange]);

  const handleDatePresetChange = useCallback(
    (value: string | null) => {
      if (value) {
        onDatePresetChange(value as TraceDatePreset);
      }
    },
    [onDatePresetChange]
  );

  const hasActions = !!onDelete || (!!onReImport && showReImport);

  return (
    <div className={classes.container}>
      {/* Toolbar */}
      <Group gap="sm" className={classes.toolbar} justify="space-between">
        <Group gap="sm">
          <Select
            size="xs"
            data={DATE_PRESETS}
            value={datePreset}
            onChange={handleDatePresetChange}
            className={classes.dateFilter}
            comboboxProps={{ withinPortal: true }}
          />
          <Group gap={4}>
            <Select
              size="xs"
              data={SORT_FIELDS}
              value={sort.field}
              onChange={handleSortFieldChange}
              className={classes.sortSelect}
              comboboxProps={{ withinPortal: true }}
            />
            <Tooltip label={sort.order === 'asc' ? 'Ascending' : 'Descending'}>
              <ActionIcon variant="subtle" size="sm" color="gray" onClick={toggleSortOrder}>
                {sort.order === 'asc' ? (
                  <IconSortAscending size={16} />
                ) : (
                  <IconSortDescending size={16} />
                )}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {onRefresh && (
          <Tooltip label="Refresh">
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={onRefresh}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {/* Table */}
      <div className={classes.scrollWrapper}>
        <div className={classes.scrollArea}>
          <div className={classes.tableWrapper}>
            <Table striped={!showLoadingSkeleton && !isLoading} highlightOnHover={!showLoadingSkeleton && !isLoading} className={classes.table}>
              <Table.Thead className={classes.thead}>
                <Table.Tr>
                  <Table.Th className={classes.colRefId}>Reference ID</Table.Th>
                  <Table.Th className={classes.colRefName}>Reference Name</Table.Th>
                  <Table.Th className={classes.colCreated}>Created</Table.Th>
                  <Table.Th className={classes.colUpdated}>Updated</Table.Th>
                  {hasActions && <Table.Th className={classes.colActions} />}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {showLoadingSkeleton ? (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Table.Tr key={i}>
                        <Table.Td className={classes.colRefId}>
                          <Group gap="sm" wrap="nowrap">
                            <Skeleton circle width={32} height={32} />
                            <Skeleton height={14} width="60%" radius="sm" />
                          </Group>
                        </Table.Td>
                        <Table.Td className={classes.colRefName}>
                          <Skeleton height={14} width="70%" radius="sm" />
                        </Table.Td>
                        <Table.Td className={classes.colCreated}>
                          <Skeleton height={14} width={80} radius="sm" />
                        </Table.Td>
                        <Table.Td className={classes.colUpdated}>
                          <Skeleton height={14} width={80} radius="sm" />
                        </Table.Td>
                        {hasActions && (
                          <Table.Td className={classes.colActions}>
                            <Skeleton height={20} width={20} radius="sm" />
                          </Table.Td>
                        )}
                      </Table.Tr>
                    ))}
                  </>
                ) : !isLoading && traces.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={hasActions ? 5 : 4}>
                      <Center py="xl">
                        <Stack align="center" gap="xs">
                          <IconMoodEmpty size={48} stroke={1} color="var(--text-disabled)" />
                          <Text size="sm" c="dimmed">{emptyMessage}</Text>
                        </Stack>
                      </Center>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  <>
                {traces.map((trace) => (
                  <Table.Tr
                    key={trace.id}
                    className={classes.row}
                    onClick={() => onRowClick?.(trace)}
                    style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    <Table.Td className={classes.colRefId}>
                      <Group gap="sm" wrap="nowrap">
                        <div className={classes.traceIcon}>
                          <IconGitBranch size={16} />
                        </div>
                        <DelayedTooltip label={trace.referenceId || '—'}>
                          <Text size="sm" ff="monospace" truncate>
                            {trace.referenceId || '—'}
                          </Text>
                        </DelayedTooltip>
                      </Group>
                    </Table.Td>
                    <Table.Td className={classes.colRefName}>
                      <DelayedTooltip label={trace.referenceName || '—'}>
                        <Text size="sm" truncate>
                          {trace.referenceName || '—'}
                        </Text>
                      </DelayedTooltip>
                    </Table.Td>
                    <Table.Td className={classes.colCreated}>
                      <Tooltip label={new Date(trace.createdAt).toLocaleString()}>
                        <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                          {formatRelativeTime(trace.createdAt)}
                        </Text>
                      </Tooltip>
                    </Table.Td>
                    <Table.Td className={classes.colUpdated}>
                      <Tooltip label={new Date(trace.updatedAt).toLocaleString()}>
                        <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                          {formatRelativeTime(trace.updatedAt)}
                        </Text>
                      </Tooltip>
                    </Table.Td>
                    {hasActions && (
                      <Table.Td className={classes.colActions}>
                        <Menu shadow="md" width={180} position="bottom-end" withinPortal>
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
                          <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
                            {onReImport && showReImport && (
                              <Menu.Item
                                leftSection={<IconDownload size={14} />}
                                onClick={() => onReImport(trace)}
                              >
                                Re-import
                              </Menu.Item>
                            )}
                            {onDelete && (
                              <Menu.Item
                                leftSection={<IconTrash size={14} />}
                                color="red"
                                onClick={() => onDelete(trace)}
                              >
                                Delete
                              </Menu.Item>
                            )}
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))}
                  </>
                )}
              </Table.Tbody>
            </Table>
          </div>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} style={{ height: 1 }} />

        {isLoadingMore && (
          <Center py="md">
            <Loader size="sm" />
          </Center>
        )}
        </div>
      </div>
    </div>
  );
};
