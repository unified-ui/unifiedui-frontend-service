/**
 * TracingDataSection - Data display section with Logs, Input, Output
 * 
 * Layout: Logs left | Input + Output side by side on right
 */

import { type FC, useMemo } from 'react';
import {
  Box,
  Text,
  ScrollArea,
  Stack,
  Code,
  CopyButton,
  ActionIcon,
  Tooltip,
  Paper,
  Group,
} from '@mantine/core';
import {
  IconListDetails,
  IconArrowBarToDown,
  IconArrowBarToUp,
  IconCopy,
  IconCheck,
} from '@tabler/icons-react';
import type { FullTraceResponse } from '../../api/types';
import { useTracing } from './TracingContext';
import classes from './TracingDataSection.module.css';

/**
 * JSON Viewer Component
 */
const JsonViewer: FC<{ data: unknown }> = ({ data }) => {
  const jsonString = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  return (
    <Paper className={classes.jsonContainer} withBorder>
      <Group className={classes.jsonHeader} justify="flex-end">
        <CopyButton value={jsonString}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Kopiert!' : 'Kopieren'}>
              <ActionIcon size="xs" variant="subtle" onClick={copy}>
                {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
      <ScrollArea className={classes.jsonScroll} type="auto">
        <Code block className={classes.jsonCode}>
          {jsonString}
        </Code>
      </ScrollArea>
    </Paper>
  );
};

/**
 * Logs Section Component
 */
const LogsSection: FC<{ trace: FullTraceResponse }> = ({ trace }) => {
  if (!trace.logs || trace.logs.length === 0) {
    return (
      <Box className={classes.emptyStateSmall}>
        <Text size="xs" c="dimmed">Keine Logs</Text>
      </Box>
    );
  }

  return (
    <ScrollArea className={classes.scrollContent} type="auto">
      <Stack gap="xs" p="xs">
        {trace.logs.map((log, index) => (
          <Paper key={index} className={classes.logEntry} withBorder p="xs">
            {typeof log === 'string' ? (
              <Text size="xs" className={classes.logText}>
                {log}
              </Text>
            ) : (
              <JsonViewer data={log} />
            )}
          </Paper>
        ))}
      </Stack>
    </ScrollArea>
  );
};

interface TracingDataSectionProps {
  width?: string | number;
  height?: string | number;
}

export const TracingDataSection: FC<TracingDataSectionProps> = ({
  width = '100%',
  height = '100%',
}) => {
  const { selectedTrace, selectedNode } = useTracing();

  if (!selectedTrace) {
    return (
      <Box className={classes.container} style={{ width, height }}>
        <Box className={classes.emptyState}>
          <Text c="dimmed" size="sm">Kein Trace ausgewählt</Text>
        </Box>
      </Box>
    );
  }

  if (!selectedNode) {
    return (
      <Box className={classes.container} style={{ width, height }}>
        <Box className={classes.emptyState}>
          <Text c="dimmed" size="sm">Wählen Sie einen Node aus</Text>
        </Box>
      </Box>
    );
  }

  const hasInput = selectedNode.data?.input && Object.keys(selectedNode.data.input).length > 0;
  const hasOutput = selectedNode.data?.output && Object.keys(selectedNode.data.output).length > 0;

  return (
    <Box className={classes.container} style={{ width, height }}>
      {/* Horizontal Layout: Logs left | Input + Output right */}
      <Box className={classes.horizontalLayout}>
        {/* Left: Logs */}
        <Box className={classes.logsSection}>
          <Text size="xs" fw={600} c="dimmed" className={classes.sectionHeader}>
            <IconListDetails size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Logs
          </Text>
          <LogsSection trace={selectedTrace} />
        </Box>

        {/* Right: Input and Output side by side */}
        <Box className={classes.ioSection}>
          {/* Input */}
          <Box className={classes.ioPanel}>
            <Text size="xs" fw={600} c="dimmed" className={classes.sectionHeader}>
              <IconArrowBarToDown size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Input
            </Text>
            <ScrollArea className={classes.scrollContent} type="auto">
              {hasInput ? (
                <Stack gap="xs" p="xs">
                  {selectedNode.data?.input?.text && (
                    <Paper className={classes.textContent} withBorder p="xs">
                      <Text size="xs">{selectedNode.data.input.text}</Text>
                    </Paper>
                  )}
                  <JsonViewer data={selectedNode.data?.input} />
                </Stack>
              ) : (
                <Box className={classes.emptyStateSmall}>
                  <Text size="xs" c="dimmed">Kein Input</Text>
                </Box>
              )}
            </ScrollArea>
          </Box>

          {/* Output */}
          <Box className={classes.ioPanel}>
            <Text size="xs" fw={600} c="dimmed" className={classes.sectionHeader}>
              <IconArrowBarToUp size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Output
            </Text>
            <ScrollArea className={classes.scrollContent} type="auto">
              {hasOutput ? (
                <Stack gap="xs" p="xs">
                  {selectedNode.data?.output?.text && (
                    <Paper className={classes.textContent} withBorder p="xs">
                      <Text size="xs">{selectedNode.data.output.text}</Text>
                    </Paper>
                  )}
                  <JsonViewer data={selectedNode.data?.output} />
                </Stack>
              ) : (
                <Box className={classes.emptyStateSmall}>
                  <Text size="xs" c="dimmed">Kein Output</Text>
                </Box>
              )}
            </ScrollArea>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TracingDataSection;
