/**
 * TracingSubHeader - Floating info bar over canvas
 */

import { type FC } from 'react';
import { Group, Text, Badge, Box } from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconLoader2,
  IconClock,
  IconPlayerSkipForward,
  IconBan,
} from '@tabler/icons-react';
import type { TraceNodeStatus } from '../../api/types';
import { useTracing } from './TracingContext';
import classes from './TracingSubHeader.module.css';

// ============================================================================
// Status Icon Mapping
// ============================================================================

const getStatusIcon = (status: TraceNodeStatus | string | undefined) => {
  const iconSize = 14;
  switch (status) {
    case 'completed':
      return <IconCheck size={iconSize} style={{ color: 'var(--color-success-500)' }} />;
    case 'failed':
      return <IconX size={iconSize} style={{ color: 'var(--color-error-500)' }} />;
    case 'running':
      return (
        <IconLoader2
          size={iconSize}
          style={{ color: 'var(--color-warning-500)' }}
          className={classes.spinningIcon}
        />
      );
    case 'pending':
      return <IconClock size={iconSize} style={{ color: 'var(--color-gray-400)' }} />;
    case 'skipped':
      return <IconPlayerSkipForward size={iconSize} style={{ color: 'var(--color-gray-500)' }} />;
    case 'cancelled':
      return <IconBan size={iconSize} style={{ color: 'var(--color-gray-600)' }} />;
    default:
      return null;
  }
};

// ============================================================================
// Time Formatting
// ============================================================================

const formatTime = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '';
  }
};

const formatDuration = (duration: number | undefined): string => {
  if (duration === undefined || duration === null) return '';
  if (duration < 1) return `${Math.round(duration * 1000)}ms`;
  if (duration < 60) return `${duration.toFixed(1)}s`;
  return `${Math.floor(duration / 60)}m ${Math.round(duration % 60)}s`;
};

// ============================================================================
// Component
// ============================================================================

export const TracingSubHeader: FC = () => {
  const { selectedTrace, selectedNode } = useTracing();

  if (!selectedTrace) {
    return null;
  }

  // Content based on selection
  const isRoot = selectedNode === null;
  const displayName = isRoot ? 'Root' : selectedNode.name;
  const displayStatus = isRoot ? selectedTrace.contextType : selectedNode.status;
  const startTime = isRoot
    ? formatTime(selectedTrace.createdAt)
    : formatTime(selectedNode.startAt);
  const endTime = isRoot ? '' : formatTime(selectedNode.endAt);
  const duration = isRoot ? undefined : selectedNode.duration;

  return (
    <Box className={classes.container}>
      <Group gap="md" wrap="nowrap">
        {/* Trace ID */}
        <Group gap="xs" wrap="nowrap">
          <Text size="xs" c="dimmed">
            ID:
          </Text>
          <Text size="xs" fw={500} className={classes.traceId}>
            {selectedTrace.id}
          </Text>
        </Group>

        <div className={classes.divider} />

        {/* Node Name */}
        <Group gap="xs" wrap="nowrap">
          <Text size="xs" c="dimmed">
            {isRoot ? 'View:' : 'Node:'}
          </Text>
          <Text size="xs" fw={500} className={classes.nodeName}>
            {displayName}
          </Text>
        </Group>

        {/* Time Range */}
        {startTime && (
          <>
            <div className={classes.divider} />
            <Group gap="xs" wrap="nowrap">
              <Text size="xs" className={classes.time}>
                {startTime}
                {endTime && ` → ${endTime}`}
              </Text>
              {duration !== undefined && (
                <Badge size="xs" variant="light" color="gray">
                  {formatDuration(duration)}
                </Badge>
              )}
            </Group>
          </>
        )}

        <div className={classes.divider} />

        {/* Status */}
        <Group gap="xs" wrap="nowrap">
          {isRoot ? (
            <Badge size="xs" variant="light" color="blue">
              {displayStatus}
            </Badge>
          ) : (
            <>
              {getStatusIcon(displayStatus as TraceNodeStatus)}
              <Text size="xs" fw={500}>
                {displayStatus}
              </Text>
            </>
          )}
        </Group>
      </Group>
    </Box>
  );
};

export default TracingSubHeader;
