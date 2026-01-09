/**
 * TracingVisualDialog - Main tracing visualization dialog/container
 * 
 * Combines all tracing components:
 * - Canvas View (React Flow visualization)
 * - Hierarchy View (collapsible tree)
 * - Data Section (logs, I/O, metadata)
 * 
 * Can be used as:
 * - Modal dialog (for chat sidebar)
 * - Inline component (for development page)
 */

import { type FC, useState } from 'react';
import {
  Box,
  Modal,
  Group,
  Text,
  ActionIcon,
  Tooltip,
  Loader,
  Alert,
  Badge,
  SegmentedControl,
  Divider,
} from '@mantine/core';
import {
  IconX,
  IconLayoutSidebar,
  IconLayoutSidebarRight,
  IconRefresh,
  IconChartDots,
  IconListTree,
} from '@tabler/icons-react';
import type { FullTraceResponse } from '../../api/types';
import { TracingProvider, useTracing } from './TracingContext';
import { TracingHierarchyView } from './TracingHierarchyView';
import { TracingCanvasView } from './TracingCanvasView';
import { TracingDataSection } from './TracingDataSection';
import { countNodes } from './types';
import classes from './TracingVisualDialog.module.css';

/**
 * View mode type
 */
type ViewMode = 'canvas' | 'hierarchy' | 'split';

/**
 * Panel visibility state
 */
interface PanelVisibility {
  hierarchy: boolean;
  data: boolean;
}

/**
 * Inner content component (uses context)
 */
interface TracingContentProps {
  /** Whether in modal mode */
  isModal?: boolean;
  /** Close handler for modal */
  onClose?: () => void;
  /** Refresh handler */
  onRefresh?: () => void;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
}

const TracingContent: FC<TracingContentProps> = ({
  isModal = false,
  onClose,
  onRefresh,
  isLoading = false,
  error = null,
}) => {
  const { selectedTrace, traces, selectTrace } = useTracing();
  
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [panels, setPanels] = useState<PanelVisibility>({
    hierarchy: true,
    data: true,
  });

  // Calculate stats
  const nodeCount = selectedTrace ? countNodes(selectedTrace.nodes) : 0;

  // Toggle panel visibility
  const togglePanel = (panel: keyof PanelVisibility) => {
    setPanels((prev) => ({ ...prev, [panel]: !prev[panel] }));
  };

  // Handle trace selection from dropdown
  const handleTraceSelect = (traceId: string) => {
    selectTrace(traceId);
  };

  if (error) {
    return (
      <Box className={classes.errorContainer}>
        <Alert color="red" title="Fehler beim Laden">
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box className={classes.container}>
      {/* Header */}
      <Group className={classes.header} justify="space-between">
        <Group gap="sm">
          <Text fw={600} size="lg">
            Tracing
          </Text>
          {selectedTrace && (
            <>
              <Badge variant="light" color="blue">
                {selectedTrace.referenceName || 'Unbenannt'}
              </Badge>
              <Badge variant="outline" color="gray" size="sm">
                {nodeCount} Nodes
              </Badge>
            </>
          )}
        </Group>

        <Group gap="xs">
          {/* Trace Selector (if multiple traces) */}
          {traces.length > 1 && (
            <select
              value={selectedTrace?.id || ''}
              onChange={(e) => handleTraceSelect(e.target.value)}
              className={classes.traceSelect}
            >
              {traces.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.referenceName || t.id.slice(0, 8)}
                </option>
              ))}
            </select>
          )}

          {/* View Mode Toggle */}
          <SegmentedControl
            size="xs"
            value={viewMode}
            onChange={(value) => setViewMode(value as ViewMode)}
            data={[
              { value: 'canvas', label: <IconChartDots size={14} /> },
              { value: 'split', label: 'Split' },
              { value: 'hierarchy', label: <IconListTree size={14} /> },
            ]}
          />

          <Divider orientation="vertical" />

          {/* Panel Toggles */}
          <Tooltip label={panels.hierarchy ? 'Hierarchie ausblenden' : 'Hierarchie einblenden'}>
            <ActionIcon
              variant={panels.hierarchy ? 'filled' : 'subtle'}
              size="sm"
              onClick={() => togglePanel('hierarchy')}
            >
              <IconLayoutSidebar size={14} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={panels.data ? 'Daten ausblenden' : 'Daten einblenden'}>
            <ActionIcon
              variant={panels.data ? 'filled' : 'subtle'}
              size="sm"
              onClick={() => togglePanel('data')}
            >
              <IconLayoutSidebarRight size={14} />
            </ActionIcon>
          </Tooltip>

          <Divider orientation="vertical" />

          {/* Refresh */}
          {onRefresh && (
            <Tooltip label="Neu laden">
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={onRefresh}
                loading={isLoading}
              >
                <IconRefresh size={14} />
              </ActionIcon>
            </Tooltip>
          )}

          {/* Close (Modal only) */}
          {isModal && onClose && (
            <Tooltip label="Schließen">
              <ActionIcon variant="subtle" size="sm" onClick={onClose}>
                <IconX size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      {/* Loading State */}
      {isLoading && !selectedTrace && (
        <Box className={classes.loadingContainer}>
          <Loader size="lg" />
          <Text c="dimmed" mt="md">Trace wird geladen...</Text>
        </Box>
      )}

      {/* Main Content */}
      {!isLoading && selectedTrace && (
        <Box className={classes.content}>
          {/* Left Area - Canvas + Data stacked */}
          <Box className={classes.mainArea}>
            {/* Canvas Area (2/3 height) */}
            {(viewMode === 'canvas' || viewMode === 'split') && (
              <Box className={classes.canvasPanel}>
                <TracingCanvasView />
              </Box>
            )}

            {/* Data Section (1/3 height) */}
            {panels.data && (
              <Box className={classes.dataPanel}>
                <TracingDataSection />
              </Box>
            )}
          </Box>

          {/* Right Panel - Hierarchy (full height) */}
          {panels.hierarchy && viewMode !== 'canvas' && (
            <Box className={classes.hierarchyPanel}>
              <TracingHierarchyView />
            </Box>
          )}
        </Box>
      )}

      {/* Empty State */}
      {!isLoading && !selectedTrace && !error && (
        <Box className={classes.emptyContainer}>
          <IconChartDots size={48} color="var(--text-secondary)" />
          <Text c="dimmed" mt="md">Kein Trace verfügbar</Text>
        </Box>
      )}
    </Box>
  );
};

/**
 * TracingVisualDialog Props
 */
export interface TracingVisualDialogProps {
  /** Whether dialog is open (modal mode) */
  opened?: boolean;
  /** Close handler */
  onClose?: () => void;
  /** Whether to use modal mode */
  modal?: boolean;
  /** Custom fetch function for traces */
  fetchTraces?: () => Promise<void>;
  /** Pre-loaded traces */
  traces?: FullTraceResponse[];
  /** Loading state (if externally controlled) */
  isLoading?: boolean;
  /** Error state (if externally controlled) */
  error?: string | null;
}

/**
 * TracingVisualDialog Component
 * 
 * Main entry point for tracing visualization.
 * Wraps content in TracingProvider and optionally in Modal.
 */
export const TracingVisualDialog: FC<TracingVisualDialogProps> = ({
  opened = true,
  onClose,
  modal = false,
  fetchTraces,
  traces = [],
  isLoading = false,
  error = null,
}) => {
  const content = (
    <TracingProvider traces={traces}>
      <TracingContent
        isModal={modal}
        onClose={onClose}
        onRefresh={fetchTraces}
        isLoading={isLoading}
        error={error}
      />
    </TracingProvider>
  );

  if (modal) {
    return (
      <Modal
        opened={opened}
        onClose={onClose || (() => {})}
        size="calc(100vw - 120px)"
        centered
        withCloseButton={false}
        padding={0}
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        classNames={{
          content: classes.modalContent,
          body: classes.modalBody,
        }}
        styles={{
          content: {
            height: 'calc(100vh - 100px)',
            maxHeight: 'calc(100vh - 100px)',
          },
        }}
      >
        {content}
      </Modal>
    );
  }

  return content;
};

export default TracingVisualDialog;
