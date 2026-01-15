/**
 * TracingVisualDialog - Main modal container for tracing visualization
 */

import { type FC, useEffect, useState } from 'react';
import { Modal, Group, Text, Badge, ActionIcon, Box, Stack } from '@mantine/core';
import { IconChartDots, IconX } from '@tabler/icons-react';
import type { FullTraceResponse } from '../../api/types';
import { TracingProvider, useTracing } from './TracingContext';
import { TracingSubHeader } from './TracingSubHeader';
import { TracingCanvasView } from './TracingCanvasView';
import { TracingHierarchyView } from './TracingHierarchyView';
import { TracingDataSection } from './TracingDataSection';
import classes from './TracingVisualDialog.module.css';

// ============================================================================
// Props
// ============================================================================

interface TracingVisualDialogProps {
  opened: boolean;
  onClose: () => void;
  traces: FullTraceResponse[];
  initialTraceId?: string;
}

// ============================================================================
// Inner Content (uses context)
// ============================================================================

interface DialogContentProps {
  onClose: () => void;
}

const DialogContent: FC<DialogContentProps> = ({ onClose }) => {
  const { selectedTrace } = useTracing();

  // Panel sizes (percentages)
  const [canvasHeight, setCanvasHeight] = useState(75); // 75% canvas, 25% data section
  const [hierarchyWidth, setHierarchyWidth] = useState(20); // 20% hierarchy width

  // Resize handlers
  const handleVerticalResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = canvasHeight;
    const container = e.currentTarget.closest(`.${classes.mainContent}`);
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaPercent = (deltaY / containerRect.height) * 100;
      const newHeight = Math.min(Math.max(startHeight + deltaPercent, 30), 80);
      setCanvasHeight(newHeight);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleHorizontalResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = hierarchyWidth;
    const container = e.currentTarget.closest(`.${classes.body}`);
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const deltaPercent = (deltaX / containerRect.width) * 100;
      const newWidth = Math.min(Math.max(startWidth + deltaPercent, 15), 40);
      setHierarchyWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <Stack className={classes.container} gap={0}>
      {/* Header */}
      <Group className={classes.header} justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <IconChartDots size={24} className={classes.headerIcon} />
          <Box>
            <Text size="lg" fw={600} className={classes.headerTitle}>
              Tracing for {selectedTrace?.referenceName || 'Unknown'}
            </Text>
            {selectedTrace?.contextType && (
              <Badge size="sm" variant="light" color="blue" mt={2}>
                {selectedTrace.contextType}
              </Badge>
            )}
          </Box>
        </Group>
        <ActionIcon variant="subtle" size="lg" onClick={onClose}>
          <IconX size={20} />
        </ActionIcon>
      </Group>

      {/* Body */}
      <Group className={classes.body} gap={0} wrap="nowrap" align="stretch">
        {/* Left: Canvas + Data Section */}
        <Box
          className={classes.mainContent}
          style={{ width: `calc(100% - ${hierarchyWidth}%)` }}
        >
          {/* SubHeader (floating) */}
          <TracingSubHeader />

          {/* Canvas View */}
          <Box
            className={classes.canvasContainer}
            style={{ height: `${canvasHeight}%` }}
          >
            <TracingCanvasView />
          </Box>

          {/* Vertical Resize Handle */}
          <div
            className={classes.resizeHandleVertical}
            onMouseDown={handleVerticalResize}
          />

          {/* Data Section */}
          <Box
            className={classes.dataContainer}
            style={{ height: `calc(${100 - canvasHeight}% - 4px)` }}
          >
            <TracingDataSection />
          </Box>
        </Box>

        {/* Horizontal Resize Handle */}
        <div
          className={classes.resizeHandleHorizontal}
          onMouseDown={handleHorizontalResize}
        />

        {/* Right: Hierarchy View */}
        <Box
          className={classes.hierarchyContainer}
          style={{ width: `${hierarchyWidth}%` }}
        >
          <TracingHierarchyView />
        </Box>
      </Group>
    </Stack>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const TracingVisualDialog: FC<TracingVisualDialogProps> = ({
  opened,
  onClose,
  traces,
  initialTraceId,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (opened) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [opened]);

  if (traces.length === 0) {
    return null;
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="calc(100vw - 80px)"
      padding={0}
      radius="lg"
      centered
      withCloseButton={false}
      className={classes.modal}
      overlayProps={{
        backgroundOpacity: 0.5,
        blur: 3,
      }}
      styles={{
        root: {
          padding: '0 !important',
        },
        inner: {
          padding: '0 !important',
        },
        content: {
          height: 'calc(100vh - 60px)',
          display: 'flex',
          flexDirection: 'column',
          padding: '0 !important',
        },
        header: {
          padding: '0 !important',
          display: 'none',
        },
        body: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '0 !important',
          overflow: 'hidden',
        },
      }}
    >
      <TracingProvider traces={traces} initialTraceId={initialTraceId}>
        <DialogContent onClose={onClose} />
      </TracingProvider>
    </Modal>
  );
};

export default TracingVisualDialog;
