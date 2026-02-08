import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Drawer, Group, Button, Loader, Text, Stack, CopyButton, ActionIcon, Menu } from '@mantine/core';
import { IconSparkles, IconCopy, IconCheck, IconRefresh, IconChevronDown } from '@tabler/icons-react';
import { MarkdownRenderer } from '../../common/MarkdownRenderer';
import { useIdentity } from '../../../contexts/IdentityContext';
import classes from './TraceAnalysisPanel.module.css';

type DetailLevel = 'short' | 'medium' | 'long';

const DETAIL_LABELS: Record<DetailLevel, string> = {
  short: 'Short',
  medium: 'Medium',
  long: 'Long',
};

interface TraceAnalysisPanelProps {
  opened: boolean;
  onClose: () => void;
  traceId?: string;
  nodes: Record<string, unknown>[];
}

export const TraceAnalysisPanel: FC<TraceAnalysisPanelProps> = ({
  opened,
  onClose,
  traceId,
  nodes,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('short');

  const fetchSummary = async (level: DetailLevel = detailLevel) => {
    if (!apiClient || !selectedTenant || nodes.length === 0) return;

    setIsLoading(true);
    setHasError(false);
    try {
      const result = await apiClient.summarizeTrace(selectedTenant.id, {
        trace_id: traceId,
        detail_level: level,
        nodes,
      });
      setSummary(result.summary);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetailLevelChange = (level: DetailLevel) => {
    setDetailLevel(level);
    fetchSummary(level);
  };

  useEffect(() => {
    if (opened) {
      setSummary(null);
      setHasError(false);
      setDetailLevel('short');
      fetchSummary('short');
    }
  }, [opened]);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconSparkles size={20} className={classes.titleIcon} />
          <Text fw={600}>AI Trace Summary</Text>
        </Group>
      }
      position="right"
      size={420}
      overlayProps={{ backgroundOpacity: 0.3 }}
    >
      <Stack gap="md" className={classes.content}>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {nodes.length} node{nodes.length !== 1 ? 's' : ''}
          </Text>
          <Group gap="xs">
            <Button
              variant="light"
              size="xs"
              onClick={() => fetchSummary(detailLevel)}
              leftSection={<IconRefresh size={14} />}
              loading={isLoading}
            >
              {DETAIL_LABELS[detailLevel]}
            </Button>
            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon variant="light" size="sm">
                  <IconChevronDown size={14} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {(Object.entries(DETAIL_LABELS) as [DetailLevel, string][]).map(([level, label]) => (
                  <Menu.Item
                    key={level}
                    onClick={() => handleDetailLevelChange(level)}
                    fw={detailLevel === level ? 600 : 400}
                  >
                    {label}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        <div className={classes.scrollArea}>
          {isLoading && (
            <Stack align="center" justify="center" className={classes.loadingState}>
              <Loader size="md" />
              <Text size="sm" c="dimmed">Summarizing trace...</Text>
            </Stack>
          )}

          {hasError && !isLoading && (
            <Stack align="center" justify="center" className={classes.errorState}>
              <Text size="sm" c="dimmed">Failed to summarize trace.</Text>
              <Button variant="subtle" size="xs" leftSection={<IconRefresh size={14} />} onClick={() => fetchSummary()}>
                Retry
              </Button>
            </Stack>
          )}

          {summary && !isLoading && (
            <MarkdownRenderer content={summary} />
          )}
        </div>

        {summary && !isLoading && (
          <Group justify="flex-end">
            <CopyButton value={summary}>
              {({ copied, copy }) => (
                <Button
                  variant="subtle"
                  size="xs"
                  leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  onClick={copy}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              )}
            </CopyButton>
          </Group>
        )}
      </Stack>
    </Drawer>
  );
};
