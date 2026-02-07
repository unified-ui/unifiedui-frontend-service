import type { FC } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Table,
  Group,
  Text,
  Select,
  Badge,
  Loader,
  Center,
  Stack,
  Box,
  ScrollArea,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconSortAscending, IconSortDescending, IconMoodEmpty } from '@tabler/icons-react';
import type { FullTraceResponse } from '../../../api/types';
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
  /** Trace items to display */
  traces: FullTraceResponse[];
  /** Loading state for initial load */
  isLoading: boolean;
  /** Loading state for loading more items (infinite scroll) */
  isLoadingMore: boolean;
  /** Whether more items are available for loading */
  hasMore: boolean;
  /** Called when the user scrolls to the bottom */
  onLoadMore: () => void;
  /** Called when a row is clicked */
  onRowClick?: (trace: FullTraceResponse) => void;
  /** Current sort state */
  sort: TracesSortState;
  /** Called when sort changes */
  onSortChange: (sort: TracesSortState) => void;
  /** Current date filter preset */
  datePreset: TraceDatePreset;
  /** Called when date filter changes */
  onDatePresetChange: (preset: TraceDatePreset) => void;
  /** Empty message */
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

function getTraceStatusFromNodes(trace: FullTraceResponse): { label: string; color: string } {
  const nodes = trace.nodes;
  if (!nodes || nodes.length === 0) {
    return { label: 'Empty', color: 'gray' };
  }

  const hasRunning = nodes.some((n) => n.status === 'running');
  const hasFailed = nodes.some((n) => n.status === 'failed');
  const hasPending = nodes.some((n) => n.status === 'pending');
  const allCompleted = nodes.every((n) => n.status === 'completed');

  if (hasFailed) return { label: 'Failed', color: 'red' };
  if (hasRunning) return { label: 'Running', color: 'blue' };
  if (hasPending) return { label: 'Pending', color: 'yellow' };
  if (allCompleted) return { label: 'Completed', color: 'green' };
  return { label: 'Mixed', color: 'gray' };
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
  emptyMessage = 'No traces found',
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  // Track loading state for race condition prevention
  useEffect(() => {
    isLoadingRef.current = isLoadingMore;
  }, [isLoadingMore]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollArea = scrollAreaRef.current;
    if (!sentinel || !scrollArea) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isLoadingRef.current) {
          onLoadMore();
        }
      },
      {
        root: scrollArea.querySelector('[data-radix-scroll-area-viewport]') || scrollArea,
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

  return (
    <div className={classes.container}>
      {/* Toolbar */}
      <Group gap="sm" className={classes.toolbar}>
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

      {/* Table */}
      <ScrollArea ref={scrollAreaRef} className={classes.scrollArea}>
        {isLoading ? (
          <Center py="xl">
            <Loader size="md" />
          </Center>
        ) : traces.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="xs">
              <IconMoodEmpty size={48} stroke={1} color="var(--text-disabled)" />
              <Text size="sm" c="dimmed">{emptyMessage}</Text>
            </Stack>
          </Center>
        ) : (
          <Table highlightOnHover className={classes.table}>
            <Table.Thead className={classes.thead}>
              <Table.Tr>
                <Table.Th>Reference ID</Table.Th>
                <Table.Th>Reference Name</Table.Th>
                <Table.Th className={classes.hideMobile}>Status</Table.Th>
                <Table.Th className={classes.hideMobile}>Created</Table.Th>
                <Table.Th className={classes.hideTablet}>Updated</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {traces.map((trace) => {
                const status = getTraceStatusFromNodes(trace);
                return (
                  <Table.Tr
                    key={trace.id}
                    className={classes.row}
                    onClick={() => onRowClick?.(trace)}
                    style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    <Table.Td>
                      <Text size="sm" ff="monospace" truncate className={classes.refId}>
                        {trace.referenceId || '—'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" truncate>
                        {trace.referenceName || '—'}
                      </Text>
                    </Table.Td>
                    <Table.Td className={classes.hideMobile}>
                      <Badge
                        variant="light"
                        color={status.color}
                        size="sm"
                      >
                        {status.label}
                      </Badge>
                    </Table.Td>
                    <Table.Td className={classes.hideMobile}>
                      <Tooltip label={new Date(trace.createdAt).toLocaleString()}>
                        <Text size="sm" c="dimmed">
                          {formatRelativeTime(trace.createdAt)}
                        </Text>
                      </Tooltip>
                    </Table.Td>
                    <Table.Td className={classes.hideTablet}>
                      <Tooltip label={new Date(trace.updatedAt).toLocaleString()}>
                        <Text size="sm" c="dimmed">
                          {formatRelativeTime(trace.updatedAt)}
                        </Text>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} style={{ height: 1 }} />

        {isLoadingMore && (
          <Center py="md">
            <Loader size="sm" />
          </Center>
        )}
      </ScrollArea>
    </div>
  );
};
