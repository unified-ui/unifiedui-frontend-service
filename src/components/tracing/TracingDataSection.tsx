/**
 * TracingDataSection - Logs + Input/Output Panel
 *
 * Features:
 * - Links: Logs Panel (1/4 Breite)
 * - Rechts: Tabs (Input/Output | Metadata)
 * - Input/Output: Split View mit collapsible JSON Sections
 * - Resizable zwischen Logs und Content
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, Tabs, ScrollArea, Badge, Collapse, UnstyledButton, Group, Code, Button } from '@mantine/core';
import {
  IconChevronRight,
  IconChevronDown,
  IconNote,
  IconBraces,
  IconFileText,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useTracing } from './TracingContext';
import { AnalyzeErrorDialog } from '../dialogs/AnalyzeErrorDialog';
import type { TraceNodeDataIO } from '../../api/types';
import classes from './TracingDataSection.module.css';

// ============================================================================
// JSON VIEWER COMPONENT
// ============================================================================

interface JsonViewerProps {
  data: unknown;
  initialCollapsed?: boolean;
}

const JsonViewer: FC<JsonViewerProps> = ({ data, initialCollapsed = true }) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  if (data === null || data === undefined) {
    return <Text size="xs" c="dimmed" fs="italic">null</Text>;
  }

  if (typeof data !== 'object') {
    return <Code block className={classes.codeBlock}>{String(data)}</Code>;
  }

  const jsonString = JSON.stringify(data, null, 2);
  const lineCount = jsonString.split('\n').length;
  const isLarge = lineCount > 5;

  if (!isLarge) {
    return <Code block className={classes.codeBlock}>{jsonString}</Code>;
  }

  return (
    <div className={classes.jsonViewer}>
      <UnstyledButton
        className={classes.jsonToggle}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <IconChevronRight size={14} /> : <IconChevronDown size={14} />}
        <Text size="xs" c="dimmed">{lineCount} lines</Text>
      </UnstyledButton>
      <Collapse in={!collapsed}>
        <Code block className={classes.codeBlock}>{jsonString}</Code>
      </Collapse>
      {collapsed && (
        <Code block className={classes.codeBlockPreview}>
          {jsonString.split('\n').slice(0, 3).join('\n')}...
        </Code>
      )}
    </div>
  );
};

// ============================================================================
// COLLAPSIBLE SECTION
// ============================================================================

interface CollapsibleSectionProps {
  title: string;
  data: unknown;
  defaultOpen?: boolean;
}

const CollapsibleSection: FC<CollapsibleSectionProps> = ({
  title,
  data,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  if (data === null || data === undefined) {
    return null;
  }

  return (
    <div className={classes.collapsibleSection}>
      <UnstyledButton
        className={classes.collapsibleHeader}
        onClick={() => setOpen(!open)}
      >
        {open ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
        <Text size="xs" fw={500}>{title}</Text>
      </UnstyledButton>
      <Collapse in={open}>
        <div className={classes.collapsibleContent}>
          <JsonViewer data={data} initialCollapsed={false} />
        </div>
      </Collapse>
    </div>
  );
};

// ============================================================================
// DATA PANEL (Input or Output)
// ============================================================================

interface DataPanelProps {
  title: string;
  data: TraceNodeDataIO | null | undefined;
}

const DataPanel: FC<DataPanelProps> = ({ title, data }) => {
  const { t } = useTranslation();
  if (!data) {
    return (
      <div className={classes.dataPanel}>
        <div className={classes.dataPanelHeader}>
          <Text size="sm" fw={600}>{title}</Text>
        </div>
        <ScrollArea className={classes.dataPanelContent} type="auto" offsetScrollbars>
          <Text size="xs" c="dimmed" fs="italic">{t('tracing:noDataAvailable')}</Text>
        </ScrollArea>
      </div>
    );
  }

  const { text, arguments: args, extraData, metadata, ...rest } = data;
  const hasOtherKeys = Object.keys(rest).length > 0;

  return (
    <div className={classes.dataPanel}>
      <div className={classes.dataPanelHeader}>
        <Text size="sm" fw={600}>{title}</Text>
      </div>
      <ScrollArea className={classes.dataPanelContent} type="auto" offsetScrollbars>
        {/* Text (prominent) */}
        {text && (
          <div className={classes.textSection}>
            <Text size="xs" fw={500} mb={4}>Text:</Text>
            <Code block className={classes.codeBlock}>
              {typeof text === 'string' ? text : JSON.stringify(text, null, 2)}
            </Code>
          </div>
        )}

        {/* Arguments (collapsible) */}
        {args && Object.keys(args).length > 0 && (
          <CollapsibleSection title="Arguments" data={args} />
        )}

        {/* Metadata (collapsible) */}
        {metadata && Object.keys(metadata).length > 0 && (
          <CollapsibleSection title="Metadata" data={metadata} />
        )}

        {/* ExtraData (collapsible) */}
        {extraData && Object.keys(extraData).length > 0 && (
          <CollapsibleSection title="Extra Data" data={extraData} />
        )}

        {/* Other keys (collapsible) */}
        {hasOtherKeys && (
          <CollapsibleSection title="Other" data={rest} />
        )}

        {!text && !args && !metadata && !extraData && !hasOtherKeys && (
          <Text size="xs" c="dimmed" fs="italic">{t('tracing:noDataAvailable')}</Text>
        )}
      </ScrollArea>
    </div>
  );
};

// ============================================================================
// LOGS PANEL
// ============================================================================

interface LogsPanelProps {
  logs: Array<string | Record<string, unknown>> | undefined;
}

const LogsPanel: FC<LogsPanelProps> = ({ logs }) => {
  const { t } = useTranslation();
  return (
    <div className={classes.logsPanel}>
      <div className={classes.logsPanelHeader}>
        <Group gap="xs">
          <IconNote size={16} />
          <Text size="sm" fw={600}>Logs</Text>
        </Group>
        {logs && logs.length > 0 && (
          <Badge size="xs" variant="light">{logs.length}</Badge>
        )}
      </div>
      <ScrollArea className={classes.logsPanelContent} type="auto">
        {(!logs || logs.length === 0) ? (
          <Text size="xs" c="dimmed" fs="italic">{t('tracing:noLogs')}</Text>
        ) : (
          <div className={classes.logsList}>
            {logs.map((log, index) => (
              <div key={index} className={classes.logEntry}>
                {typeof log === 'string' ? (
                  <Text size="xs" className={classes.logText}>{log}</Text>
                ) : (
                  <JsonViewer data={log} initialCollapsed={true} />
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TracingDataSection: FC = () => {
  const { selectedTrace, selectedNode } = useTracing();
  const { t } = useTranslation();

  // Resize state für Logs/Content Trennung
  const [logsWidth, setLogsWidth] = useState(25); // Prozent
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  // Resize Handler
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      setLogsWidth(Math.min(Math.max(newWidth, 15), 50)); // Min 15%, Max 50%
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // Determine what data to show
  const isRoot = selectedNode === null;

  // Logs: Von Trace (Root) oder Node
  const logs = useMemo(() => {
    if (isRoot) {
      return selectedTrace?.logs;
    }
    return selectedNode?.logs;
  }, [isRoot, selectedTrace, selectedNode]);

  // Data: Von Node (input/output) oder Trace (referenceMetadata)
  const inputData = selectedNode?.data?.input;
  const outputData = selectedNode?.data?.output;
  const metadata = isRoot ? selectedTrace?.referenceMetadata : selectedNode?.metadata;

  // Active tab
  const [activeTab, setActiveTab] = useState<string | null>('io');
  const [analyzeErrorOpened, setAnalyzeErrorOpened] = useState(false);

  // Wenn Root, zeige nur Metadata Tab
  const showIOTab = !isRoot;
  const showAnalyzeError = !isRoot && selectedNode?.status === 'failed' && !!selectedNode?.error;

  if (!selectedTrace) {
    return (
      <div className={classes.emptyContainer}>
        <Text size="sm" c="dimmed">{t('tracing:noTraceSelected')}</Text>
      </div>
    );
  }

  return (
    <div className={classes.container} ref={containerRef}>
      {/* Logs Panel (Left) */}
      <div className={classes.logsContainer} style={{ width: `${logsWidth}%` }}>
        <LogsPanel logs={logs as Array<string | Record<string, unknown>>} />
      </div>

      {/* Resize Handle */}
      <div
        className={classes.resizeHandle}
        onMouseDown={handleResizeStart}
      />

      {/* Content Panel (Right) */}
      <div className={classes.contentContainer} style={{ width: `${100 - logsWidth}%` }}>
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          className={classes.tabs}
        >
          <Tabs.List>
            {showIOTab && (
              <Tabs.Tab value="io" leftSection={<IconFileText size={14} />}>
                Input / Output
              </Tabs.Tab>
            )}
            <Tabs.Tab value="metadata" leftSection={<IconBraces size={14} />}>
              Metadata
            </Tabs.Tab>
            {showAnalyzeError && (
              <Button
                variant="light"
                color="red"
                size="compact-xs"
                leftSection={<IconAlertTriangle size={14} />}
                ml="auto"
                onClick={() => setAnalyzeErrorOpened(true)}
              >
                Analyze Error
              </Button>
            )}
          </Tabs.List>

          {/* Input/Output Tab */}
          {showIOTab && (
            <Tabs.Panel value="io" className={classes.tabPanel}>
              <div className={classes.ioContainer}>
                <DataPanel title="Input" data={inputData} />
                <div className={classes.ioDivider} />
                <DataPanel title="Output" data={outputData} />
              </div>
            </Tabs.Panel>
          )}

          {/* Metadata Tab */}
          <Tabs.Panel value="metadata" className={classes.tabPanel}>
            <ScrollArea className={classes.metadataPanel} type="auto">
              {metadata ? (
                <JsonViewer data={metadata} initialCollapsed={false} />
              ) : (
                <Text size="xs" c="dimmed" fs="italic">{t('tracing:noMetadata')}</Text>
              )}
            </ScrollArea>
          </Tabs.Panel>
        </Tabs>
      </div>

      {showAnalyzeError && (
        <AnalyzeErrorDialog
          opened={analyzeErrorOpened}
          onClose={() => setAnalyzeErrorOpened(false)}
          traceId={selectedTrace.id}
          nodeId={selectedNode?.id}
          nodeName={selectedNode?.name || 'Unknown'}
          nodeType={selectedNode?.type || 'Unknown'}
          error={selectedNode?.error || ''}
          input={selectedNode?.data?.input as Record<string, unknown> | undefined}
          output={selectedNode?.data?.output as Record<string, unknown> | undefined}
        />
      )}
    </div>
  );
};

export default TracingDataSection;
