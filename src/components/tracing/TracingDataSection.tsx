/**
 * TracingDataSection - Data display section with logs, I/O, metadata tabs
 * 
 * Shows detailed information about selected trace node:
 * - Logs: Trace-level logs
 * - Input/Output: Node I/O with tabs for each item
 * - Metadata: Node and trace metadata as JSON
 */

import { type FC, useState, useMemo } from 'react';
import {
  Box,
  Text,
  Tabs,
  ScrollArea,
  Group,
  Badge,
  Stack,
  Code,
  CopyButton,
  ActionIcon,
  Tooltip,
  Paper,
  Accordion,
} from '@mantine/core';
import {
  IconListDetails,
  IconArrowBarToDown,
  IconArrowBarToUp,
  IconDatabase,
  IconCopy,
  IconCheck,
  IconClock,
  IconCalendar,
  IconUser,
} from '@tabler/icons-react';
import type { TraceNodeResponse, FullTraceResponse } from '../../api/types';
import { useTracing } from './TracingContext';
import { formatDuration } from './types';
import classes from './TracingDataSection.module.css';

/**
 * JSON Viewer Component
 */
const JsonViewer: FC<{ data: unknown; label?: string }> = ({ data, label }) => {
  const jsonString = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  return (
    <Paper className={classes.jsonContainer} withBorder>
      {label && (
        <Group className={classes.jsonHeader} justify="space-between">
          <Text size="xs" fw={500} c="dimmed">
            {label}
          </Text>
          <CopyButton value={jsonString}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Kopiert!' : 'JSON kopieren'}>
                <ActionIcon size="xs" variant="subtle" onClick={copy}>
                  {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </Group>
      )}
      <ScrollArea className={classes.jsonScroll} type="auto">
        <Code block className={classes.jsonCode}>
          {jsonString}
        </Code>
      </ScrollArea>
    </Paper>
  );
};

/**
 * Node Info Header Component
 */
const NodeInfoHeader: FC<{ node: TraceNodeResponse }> = ({ node }) => {
  return (
    <Paper className={classes.nodeInfo} withBorder>
      <Group gap="sm" wrap="nowrap">
        <Badge 
          size="sm" 
          variant="light" 
          color={node.status === 'completed' ? 'green' : node.status === 'failed' ? 'red' : 'blue'}
        >
          {node.status}
        </Badge>
        <Badge size="sm" variant="outline" color="gray">
          {node.type}
        </Badge>
        <Text size="sm" fw={500} truncate>
          {node.name}
        </Text>
      </Group>

      <Group gap="lg" mt="xs">
        {node.startAt && (
          <Group gap={4}>
            <IconCalendar size={12} color="var(--text-secondary)" />
            <Text size="xs" c="dimmed">
              {new Date(node.startAt).toLocaleString('de-DE')}
            </Text>
          </Group>
        )}
        {node.duration !== undefined && (
          <Group gap={4}>
            <IconClock size={12} color="var(--text-secondary)" />
            <Text size="xs" c="dimmed">
              {formatDuration(node.duration)}
            </Text>
          </Group>
        )}
        {node.createdBy && (
          <Group gap={4}>
            <IconUser size={12} color="var(--text-secondary)" />
            <Text size="xs" c="dimmed">
              {node.createdBy}
            </Text>
          </Group>
        )}
      </Group>
    </Paper>
  );
};

/**
 * Logs Tab Content
 */
const LogsTab: FC<{ trace: FullTraceResponse }> = ({ trace }) => {
  if (!trace.logs || trace.logs.length === 0) {
    return (
      <Box className={classes.emptyState}>
        <Text size="sm" c="dimmed">Keine Logs vorhanden</Text>
      </Box>
    );
  }

  return (
    <ScrollArea className={classes.logsScroll} type="auto">
      <Stack gap="xs" p="sm">
        {trace.logs.map((log, index) => (
          <Paper key={index} className={classes.logEntry} withBorder>
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

/**
 * Input/Output Tab Content with sub-tabs
 */
const InputOutputTab: FC<{ node: TraceNodeResponse }> = ({ node }) => {
  const [activeTab, setActiveTab] = useState<string | null>('input');
  
  const hasInput = node.data?.input && Object.keys(node.data.input).length > 0;
  const hasOutput = node.data?.output && Object.keys(node.data.output).length > 0;

  if (!hasInput && !hasOutput) {
    return (
      <Box className={classes.emptyState}>
        <Text size="sm" c="dimmed">Keine Input/Output-Daten vorhanden</Text>
      </Box>
    );
  }

  return (
    <Tabs value={activeTab} onChange={setActiveTab} className={classes.ioTabs}>
      <Tabs.List>
        <Tabs.Tab 
          value="input" 
          leftSection={<IconArrowBarToDown size={14} />}
          disabled={!hasInput}
        >
          Input
        </Tabs.Tab>
        <Tabs.Tab 
          value="output" 
          leftSection={<IconArrowBarToUp size={14} />}
          disabled={!hasOutput}
        >
          Output
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="input" className={classes.ioPanel}>
        {hasInput ? (
          <Stack gap="sm" p="sm">
            {/* Text content if available */}
            {node.data?.input?.text && (
              <Paper className={classes.textContent} withBorder>
                <Text size="xs" fw={500} c="dimmed" mb="xs">Text</Text>
                <Text size="sm">{node.data.input.text}</Text>
              </Paper>
            )}
            {/* Arguments if available */}
            {node.data?.input?.arguments && (
              <JsonViewer data={node.data.input.arguments} label="Arguments" />
            )}
            {/* Full input data */}
            <JsonViewer data={node.data?.input} label="Vollständiger Input" />
          </Stack>
        ) : (
          <Box className={classes.emptyState}>
            <Text size="sm" c="dimmed">Kein Input vorhanden</Text>
          </Box>
        )}
      </Tabs.Panel>

      <Tabs.Panel value="output" className={classes.ioPanel}>
        {hasOutput ? (
          <Stack gap="sm" p="sm">
            {/* Text content if available */}
            {node.data?.output?.text && (
              <Paper className={classes.textContent} withBorder>
                <Text size="xs" fw={500} c="dimmed" mb="xs">Text</Text>
                <Text size="sm">{node.data.output.text}</Text>
              </Paper>
            )}
            {/* Full output data */}
            <JsonViewer data={node.data?.output} label="Vollständiger Output" />
          </Stack>
        ) : (
          <Box className={classes.emptyState}>
            <Text size="sm" c="dimmed">Kein Output vorhanden</Text>
          </Box>
        )}
      </Tabs.Panel>
    </Tabs>
  );
};

/**
 * Metadata Tab Content
 */
const MetadataTab: FC<{ node: TraceNodeResponse; trace: FullTraceResponse }> = ({ node, trace }) => {
  return (
    <ScrollArea className={classes.metadataScroll} type="auto">
      <Accordion className={classes.metadataAccordion} multiple defaultValue={['node-info']}>
        {/* Node Info */}
        <Accordion.Item value="node-info">
          <Accordion.Control>
            <Text size="sm" fw={500}>Node Information</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <JsonViewer data={{
              id: node.id,
              referenceId: node.referenceId,
              name: node.name,
              type: node.type,
              status: node.status,
              startAt: node.startAt,
              endAt: node.endAt,
              duration: node.duration,
              error: node.error,
              createdBy: node.createdBy,
            }} />
          </Accordion.Panel>
        </Accordion.Item>

        {/* Node Metadata */}
        {node.metadata && Object.keys(node.metadata).length > 0 && (
          <Accordion.Item value="node-metadata">
            <Accordion.Control>
              <Text size="sm" fw={500}>Node Metadata</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <JsonViewer data={node.metadata} />
            </Accordion.Panel>
          </Accordion.Item>
        )}

        {/* Trace Reference Info */}
        <Accordion.Item value="trace-info">
          <Accordion.Control>
            <Text size="sm" fw={500}>Trace Information</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <JsonViewer data={{
              id: trace.id,
              referenceId: trace.referenceId,
              referenceName: trace.referenceName,
              contextType: trace.contextType,
              tenantId: trace.tenantId,
              conversationId: trace.conversationId,
              applicationId: trace.applicationId,
              autonomousAgentId: trace.autonomousAgentId,
              createdAt: trace.createdAt,
              updatedAt: trace.updatedAt,
              createdBy: trace.createdBy,
              updatedBy: trace.updatedBy,
            }} />
          </Accordion.Panel>
        </Accordion.Item>

        {/* Trace Reference Metadata */}
        {trace.referenceMetadata && Object.keys(trace.referenceMetadata).length > 0 && (
          <Accordion.Item value="trace-reference-metadata">
            <Accordion.Control>
              <Text size="sm" fw={500}>Reference Metadata</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <JsonViewer data={trace.referenceMetadata} />
            </Accordion.Panel>
          </Accordion.Item>
        )}
      </Accordion>
    </ScrollArea>
  );
};

interface TracingDataSectionProps {
  /** Width of the section */
  width?: string | number;
  /** Height of the section */
  height?: string | number;
}

export const TracingDataSection: FC<TracingDataSectionProps> = ({
  width = '100%',
  height = '100%',
}) => {
  const { selectedTrace, selectedNode } = useTracing();
  const [activeTab, setActiveTab] = useState<string | null>('io');

  if (!selectedTrace) {
    return (
      <Box className={classes.container} style={{ width, height }}>
        <Box className={classes.emptyState}>
          <Text c="dimmed">Kein Trace ausgewählt</Text>
        </Box>
      </Box>
    );
  }

  if (!selectedNode) {
    return (
      <Box className={classes.container} style={{ width, height }}>
        <Box className={classes.emptyState}>
          <Text c="dimmed">Wählen Sie einen Node aus der Hierarchie oder dem Canvas</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box className={classes.container} style={{ width, height }}>
      {/* Node Info Header */}
      <NodeInfoHeader node={selectedNode} />

      {/* Main Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab} className={classes.mainTabs}>
        <Tabs.List>
          <Tabs.Tab value="io" leftSection={<IconArrowBarToDown size={14} />}>
            Input/Output
          </Tabs.Tab>
          <Tabs.Tab value="logs" leftSection={<IconListDetails size={14} />}>
            Logs
          </Tabs.Tab>
          <Tabs.Tab value="metadata" leftSection={<IconDatabase size={14} />}>
            Metadata
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="io" className={classes.tabPanel}>
          <InputOutputTab node={selectedNode} />
        </Tabs.Panel>

        <Tabs.Panel value="logs" className={classes.tabPanel}>
          <LogsTab trace={selectedTrace} />
        </Tabs.Panel>

        <Tabs.Panel value="metadata" className={classes.tabPanel}>
          <MetadataTab node={selectedNode} trace={selectedTrace} />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
};

export default TracingDataSection;
