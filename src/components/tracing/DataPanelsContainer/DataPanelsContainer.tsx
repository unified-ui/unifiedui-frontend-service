import { useCallback, useMemo, useState } from 'react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, Badge, UnstyledButton, Code } from '@mantine/core';
import {
  IconChevronDown,
  IconChevronRight,
  IconNote,
  IconBraces,
  IconArrowDown,
  IconArrowUp,
} from '@tabler/icons-react';
import { useTracing } from '../TracingContext';
import { JsonViewer } from '../JsonViewer';
import type { TraceNodeDataIO } from '../../../api/types';
import classes from './DataPanelsContainer.module.css';

const PANEL_HEADER_HEIGHT = 28;

type PanelId = 'input' | 'output' | 'logs' | 'metadata';

interface PanelDef {
  id: PanelId;
  title: string;
  icon: React.ReactNode;
  badge?: number;
  hasContent: boolean;
}

interface DataPanelsContainerProps {
  height: number;
  className?: string;
}

const DataContent: FC<{ data: TraceNodeDataIO | null | undefined; title: string }> = ({ data, title }) => {
  const { t } = useTranslation();

  if (!data) {
    return <Text size="xs" c="dimmed" fs="italic">{t('tracing:noData', { title })}</Text>;
  }

  const { text, arguments: args, extraData, metadata: dataMeta, ...rest } = data;
  const hasContent = text || args || dataMeta || extraData || Object.keys(rest).length > 0;

  if (!hasContent) {
    return <Text size="xs" c="dimmed" fs="italic">{t('tracing:noData', { title })}</Text>;
  }

  return (
    <div className={classes.dataContent}>
      {text && (
        <div className={classes.dataTextSection}>
          <Text size="xs" fw={500} mb={4}>Text:</Text>
          <Code block className={classes.textCodeBlock}>
            {typeof text === 'string' ? text : JSON.stringify(text, null, 2)}
          </Code>
        </div>
      )}
      {args && Object.keys(args).length > 0 && (
        <div className={classes.dataSubSection}>
          <Text size="xs" fw={500} c="dimmed">Arguments:</Text>
          <JsonViewer data={args} initialCollapsed={false} maxHeight={200} />
        </div>
      )}
      {dataMeta && Object.keys(dataMeta).length > 0 && (
        <div className={classes.dataSubSection}>
          <Text size="xs" fw={500} c="dimmed">Metadata:</Text>
          <JsonViewer data={dataMeta} maxHeight={200} />
        </div>
      )}
      {extraData && Object.keys(extraData).length > 0 && (
        <div className={classes.dataSubSection}>
          <Text size="xs" fw={500} c="dimmed">Extra Data:</Text>
          <JsonViewer data={extraData} maxHeight={200} />
        </div>
      )}
      {Object.keys(rest).length > 0 && (
        <div className={classes.dataSubSection}>
          <Text size="xs" fw={500} c="dimmed">Other:</Text>
          <JsonViewer data={rest} maxHeight={200} />
        </div>
      )}
    </div>
  );
};

export const DataPanelsContainer: FC<DataPanelsContainerProps> = ({ height, className }) => {
  const { selectedTrace, selectedNode } = useTracing();
  const { t } = useTranslation();
  const [expandedPanel, setExpandedPanel] = useState<PanelId | null>(null);

  const isRoot = selectedNode === null;

  const logs = useMemo(() => {
    if (isRoot) return selectedTrace?.logs;
    return selectedNode?.logs;
  }, [isRoot, selectedTrace, selectedNode]);

  const inputData = selectedNode?.data?.input;
  const outputData = selectedNode?.data?.output;

  const metadata = useMemo(() => {
    if (isRoot) return selectedTrace?.referenceMetadata;
    return selectedNode?.metadata;
  }, [isRoot, selectedTrace, selectedNode]);

  const togglePanel = useCallback((panelId: PanelId) => {
    setExpandedPanel(prev => prev === panelId ? null : panelId);
  }, []);

  const hasLogs = logs && Array.isArray(logs) && logs.length > 0;
  const hasInput = inputData && Object.keys(inputData).length > 0;
  const hasOutput = outputData && Object.keys(outputData).length > 0;
  const hasMetadata = metadata && Object.keys(metadata).length > 0;

  const panels: PanelDef[] = useMemo(() => [
    ...(!isRoot ? [
      { id: 'input' as PanelId, title: 'INPUT', icon: <IconArrowDown size={14} />, hasContent: !!hasInput },
      { id: 'output' as PanelId, title: 'OUTPUT', icon: <IconArrowUp size={14} />, hasContent: !!hasOutput },
    ] : []),
    { id: 'logs' as PanelId, title: 'LOGS', icon: <IconNote size={14} />, badge: Array.isArray(logs) ? logs.length : undefined, hasContent: !!hasLogs },
    { id: 'metadata' as PanelId, title: 'METADATA', icon: <IconBraces size={14} />, hasContent: !!hasMetadata },
  ], [isRoot, hasInput, hasOutput, hasLogs, hasMetadata, logs]);

  const renderPanelContent = useCallback((panelId: PanelId) => {
    switch (panelId) {
      case 'input':
        return <DataContent data={inputData} title="Input" />;
      case 'output':
        return <DataContent data={outputData} title="Output" />;
      case 'logs':
        return hasLogs ? (
          <div className={classes.logsContainer}>
            {(logs as Array<string | Record<string, unknown>>).map((log, index) => (
              <div key={index} className={classes.logEntry}>
                {typeof log === 'string' ? (
                  <Text size="xs">{log}</Text>
                ) : (
                  <JsonViewer data={log} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <Text size="xs" c="dimmed" fs="italic">{t('tracing:noLogs')}</Text>
        );
      case 'metadata':
        return hasMetadata ? (
          <JsonViewer data={metadata} initialCollapsed={false} />
        ) : (
          <Text size="xs" c="dimmed" fs="italic">{t('tracing:noMetadata')}</Text>
        );
      default:
        return null;
    }
  }, [inputData, outputData, logs, metadata, hasLogs, hasMetadata, t]);

  const contentHeight = height - panels.length * (PANEL_HEADER_HEIGHT + 1);

  return (
    <div className={`${classes.container}${className ? ` ${className}` : ''}`} style={{ height }}>
      {panels.map(panel => {
        const isExpanded = expandedPanel === panel.id;
        return (
          <div key={panel.id} className={isExpanded ? classes.panelExpanded : classes.panelCollapsed}>
            <UnstyledButton
              className={classes.panelHeader}
              onClick={() => togglePanel(panel.id)}
            >
              <span className={classes.panelChevron}>
                {isExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
              </span>
              <span className={classes.panelIcon}>{panel.icon}</span>
              <Text size="xs" fw={600} className={classes.panelTitle}>{panel.title}</Text>
              {panel.badge !== undefined && panel.badge > 0 && (
                <Badge size="xs" variant="light" className={classes.panelBadge}>{panel.badge}</Badge>
              )}
              {!panel.hasContent && (
                <Text size="xs" c="dimmed" className={classes.panelNoContent}>–</Text>
              )}
            </UnstyledButton>
            {isExpanded && (
              <div
                className={classes.panelContent}
                style={{ height: Math.max(0, contentHeight) }}
              >
                <div className={classes.panelContentInner}>
                  {renderPanelContent(panel.id)}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
