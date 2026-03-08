import type { FC, ReactNode } from 'react';
import { Box, Text, Group, Badge, Loader } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ReasoningStep } from '../../../hooks/chat/useReActChat';
import classes from './ReasoningSection.module.css';
import mdClasses from '../ChatContent/Markdown.module.css';

interface ReasoningStepItemProps {
  step: ReasoningStep;
  isActive: boolean;
}

export const ReasoningStepItem: FC<ReasoningStepItemProps> = ({ step, isActive }) => {
  const duration = step.completedAt
    ? ((step.completedAt - step.startedAt) / 1000).toFixed(1)
    : null;

  return (
    <Box className={classes.stepItem}>
      <Group gap="xs" className={classes.stepHeader}>
        <StepIcon type={step.type} isActive={isActive} />
        <Text size="xs" fw={600} className={classes.stepLabel}>
          <StepLabel step={step} />
        </Text>
        {duration && (
          <Text size="xs" c="dimmed">{duration}s</Text>
        )}
        {isActive && <Loader size={12} type="dots" />}
      </Group>
      <StepContent step={step} isActive={isActive} />
    </Box>
  );
};

const StepIcon: FC<{ type: ReasoningStep['type']; isActive: boolean }> = ({ type, isActive }) => {
  const iconMap: Record<ReasoningStep['type'], string> = {
    reasoning: '💭',
    tool_call: '🔧',
    plan: '📋',
    sub_agent: '🤖',
    synthesis: '✨',
  };

  return (
    <span className={`${classes.stepIcon} ${isActive ? classes.stepIconActive : ''}`}>
      {iconMap[type]}
    </span>
  );
};

const StepLabel: FC<{ step: ReasoningStep }> = ({ step }) => {
  switch (step.type) {
    case 'reasoning':
      return <>Thinking</>;
    case 'tool_call':
      return <>{step.toolName ?? 'Tool Call'}</>;
    case 'plan':
      return <>Plan</>;
    case 'sub_agent':
      return <>{step.agentName ?? 'Sub-Agent'}</>;
    case 'synthesis':
      return <>Synthesizing</>;
  }
};

const StepContent: FC<{ step: ReasoningStep; isActive: boolean }> = ({ step, isActive }) => {
  if (step.type === 'tool_call') {
    return <ToolCallContent step={step} isActive={isActive} />;
  }

  if (!step.content && !isActive) return null;

  return (
    <Box className={classes.stepContent}>
      <Box className={mdClasses.markdownContent}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }: { children?: ReactNode }) => (
              <Text size="xs" component="p" className={classes.stepText}>{children}</Text>
            ),
            code: ({ className, children, ...props }: { className?: string; children?: ReactNode }) => {
              const match = /language-(\w+)/.exec(className || '');
              const isInline = !match && !String(children).includes('\n');
              if (isInline) {
                return <code className={mdClasses.inlineCode} {...props}>{children}</code>;
              }
              return (
                <pre className={classes.stepCodePre}>
                  <code className={className} {...props}>{children}</code>
                </pre>
              );
            },
          }}
        >
          {step.content}
        </ReactMarkdown>
      </Box>
      {isActive && <span className={classes.cursor}>█</span>}
    </Box>
  );
};

const ToolCallContent: FC<{ step: ReasoningStep; isActive: boolean }> = ({ step, isActive }) => {
  return (
    <Box className={classes.toolCallContent}>
      {step.toolInput && (
        <Box className={classes.toolSection}>
          <Text size="xs" c="dimmed" fw={600} className={classes.toolSectionLabel}>Input</Text>
          <pre className={classes.toolCodeBlock}>{step.toolInput}</pre>
        </Box>
      )}
      {step.content && (
        <Box className={classes.toolSection}>
          <Text size="xs" c="dimmed" fw={600} className={classes.toolSectionLabel}>Stream</Text>
          <Box className={mdClasses.markdownContent}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }: { children?: ReactNode }) => (
                  <Text size="xs" component="p" className={classes.stepText}>{children}</Text>
                ),
              }}
            >
              {step.content}
            </ReactMarkdown>
          </Box>
        </Box>
      )}
      {step.toolResult && (
        <Box className={classes.toolSection}>
          <Text size="xs" c="dimmed" fw={600} className={classes.toolSectionLabel}>Result</Text>
          <pre className={classes.toolCodeBlock}>{step.toolResult}</pre>
        </Box>
      )}
      {isActive && !step.completedAt && (
        <Badge size="xs" variant="light" color="blue" className={classes.runningBadge}>
          Running...
        </Badge>
      )}
    </Box>
  );
};
