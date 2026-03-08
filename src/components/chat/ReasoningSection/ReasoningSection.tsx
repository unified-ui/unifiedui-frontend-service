import type { FC } from 'react';
import { useMemo } from 'react';
import { Box, Group, Text, UnstyledButton, Badge } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import type { ReasoningStep, ReActStreamState } from '../../../hooks/chat/useReActChat';
import { ReasoningStepItem } from './ReasoningStepItem';
import classes from './ReasoningSection.module.css';

interface ReasoningSectionProps {
  reActState: ReActStreamState;
  isStreaming: boolean;
  onToggle: () => void;
  alwaysExpanded?: boolean;
}

export const ReasoningSection: FC<ReasoningSectionProps> = ({
  reActState,
  isStreaming,
  onToggle,
  alwaysExpanded = false,
}) => {
  const { reasoningSteps, isReasoningExpanded } = reActState;

  const expanded = alwaysExpanded || isReasoningExpanded;

  const summary = useMemo(() => computeSummary(reasoningSteps, isStreaming), [reasoningSteps, isStreaming]);

  if (reasoningSteps.length === 0) return null;

  return (
    <Box className={classes.reasoningSection}>
      <UnstyledButton
        onClick={onToggle}
        className={classes.summaryBar}
        aria-expanded={expanded}
        aria-label="Toggle reasoning steps"
      >
        <Group gap="xs">
          {expanded
            ? <IconChevronDown size={14} />
            : <IconChevronRight size={14} />}
          <Text size="xs" fw={600}>Reasoning</Text>
          <Text size="xs" c="dimmed">{summary}</Text>
          {isStreaming && (
            <Badge size="xs" variant="light" color="blue">Streaming</Badge>
          )}
        </Group>
      </UnstyledButton>

      {expanded && (
        <Box className={classes.stepList}>
          {reasoningSteps.map((step) => (
            <ReasoningStepItem
              key={step.id}
              step={step}
              isActive={
                reActState.activeStepType !== null &&
                step.id === reasoningSteps[reasoningSteps.length - 1]?.id &&
                !step.completedAt
              }
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

function computeSummary(steps: ReasoningStep[], isStreaming: boolean): string {
  if (isStreaming) return '(streaming...)';
  if (steps.length === 0) return '';

  const stepCount = steps.length;
  const toolCount = steps.filter(s => s.type === 'tool_call').length;

  const firstStart = Math.min(...steps.map(s => s.startedAt));
  const lastEnd = Math.max(
    ...steps.map(s => s.completedAt ?? s.startedAt)
  );
  const durationMs = lastEnd - firstStart;
  const durationStr = (durationMs / 1000).toFixed(1);

  const parts: string[] = [];
  parts.push(`${stepCount} step${stepCount !== 1 ? 's' : ''}`);
  if (toolCount > 0) {
    parts.push(`${toolCount} tool${toolCount !== 1 ? 's' : ''}`);
  }
  parts.push(`${durationStr}s`);

  return `(${parts.join(' · ')})`;
}
