import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Modal, Group, Button, Loader, Text, Stack, CopyButton, ActionIcon } from '@mantine/core';
import { IconSparkles, IconCopy, IconCheck, IconRefresh } from '@tabler/icons-react';
import { MarkdownRenderer } from '../../common/MarkdownRenderer';
import { useIdentity } from '../../../contexts/IdentityContext';
import classes from './AnalyzeErrorDialog.module.css';

interface AnalyzeErrorDialogProps {
  opened: boolean;
  onClose: () => void;
  traceId?: string;
  nodeId?: string;
  nodeName: string;
  nodeType: string;
  error: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export const AnalyzeErrorDialog: FC<AnalyzeErrorDialogProps> = ({
  opened,
  onClose,
  traceId,
  nodeId,
  nodeName,
  nodeType,
  error,
  input,
  output,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fetchAnalysis = async () => {
    if (!apiClient || !selectedTenant) return;

    setIsLoading(true);
    setHasError(false);
    try {
      const result = await apiClient.analyzeTrace(selectedTenant.id, {
        trace_id: traceId,
        node_id: nodeId,
        error,
        node_name: nodeName,
        node_type: nodeType,
        input,
        output,
      });
      setAnalysis(result.analysis);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (opened) {
      setAnalysis(null);
      setHasError(false);
      fetchAnalysis();
    }
  }, [opened]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconSparkles size={20} className={classes.titleIcon} />
          <Text fw={600}>AI Error Analysis</Text>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        <div className={classes.nodeInfo}>
          <Text size="sm" c="dimmed">
            Node: <Text span fw={500} c="var(--text-primary)">{nodeName}</Text>
            {' · '}
            Type: <Text span fw={500} c="var(--text-primary)">{nodeType}</Text>
          </Text>
          <Text size="sm" c="red" lineClamp={3} className={classes.errorText}>
            {error}
          </Text>
        </div>

        <div className={classes.contentArea}>
          {isLoading && (
            <Stack align="center" justify="center" className={classes.loadingState}>
              <Loader size="md" />
              <Text size="sm" c="dimmed">Analyzing error...</Text>
            </Stack>
          )}

          {hasError && !isLoading && (
            <Stack align="center" justify="center" className={classes.errorState}>
              <Text size="sm" c="dimmed">Failed to analyze error.</Text>
              <Button variant="subtle" size="xs" leftSection={<IconRefresh size={14} />} onClick={fetchAnalysis}>
                Retry
              </Button>
            </Stack>
          )}

          {analysis && !isLoading && (
            <div className={classes.analysisContent}>
              <MarkdownRenderer content={analysis} />
            </div>
          )}
        </div>

        <Group justify="flex-end">
          {analysis && (
            <>
              <CopyButton value={analysis}>
                {({ copied, copy }) => (
                  <ActionIcon variant="subtle" onClick={copy} size="md">
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                )}
              </CopyButton>
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconRefresh size={14} />}
                onClick={fetchAnalysis}
                loading={isLoading}
              >
                Re-generate
              </Button>
            </>
          )}
          <Button variant="default" onClick={onClose}>Close</Button>
        </Group>
      </Stack>
    </Modal>
  );
};
