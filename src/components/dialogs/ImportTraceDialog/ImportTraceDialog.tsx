import { type FC, useState } from 'react';
import { Modal, TextInput, Button, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconFileImport } from '@tabler/icons-react';
import { useIdentity } from '../../../contexts';

interface ImportTraceDialogProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  agentId: string;
  agentType: string;
}

export const ImportTraceDialog: FC<ImportTraceDialogProps> = ({
  opened,
  onClose,
  onSuccess,
  agentId,
  agentType,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [executionId, setExecutionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setExecutionId('');
    onClose();
  };

  const handleImport = async () => {
    if (!apiClient || !selectedTenant || !executionId.trim()) return;
    setIsLoading(true);
    try {
      await apiClient.importWorkflowTrace(selectedTenant.id, agentId, {
        type: agentType,
        executionId: executionId.trim(),
      });
      handleClose();
      onSuccess?.();
    } catch {
      // Error handled by API client onError
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <ThemeIcon color="blue" variant="light" size="lg" radius="xl">
            <IconFileImport size={20} />
          </ThemeIcon>
          <Text fw={600} size="lg">Import Trace</Text>
        </Group>
      }
      centered
      size="md"
      styles={{
        header: {
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: 'var(--spacing-sm)',
        },
        body: {
          paddingTop: 'var(--spacing-lg)',
        },
      }}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Import a trace by providing the execution ID from the workflow platform.
        </Text>
        <TextInput
          label="Execution ID"
          placeholder="Enter execution ID"
          value={executionId}
          onChange={(e) => setExecutionId(e.currentTarget.value)}
          required
          data-autofocus
        />
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            leftSection={<IconFileImport size={16} />}
            onClick={handleImport}
            loading={isLoading}
            disabled={!executionId.trim()}
          >
            Import
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
