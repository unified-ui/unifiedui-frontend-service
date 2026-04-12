import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { Button, Group, Text } from '@mantine/core';
import { IconCheck, IconX, IconTestPipe } from '@tabler/icons-react';
import { useIdentity } from '../../../contexts';
import type { AIModelResponse } from '../../../api/types';
import classes from './ModelTestButton.module.css';

interface ModelTestButtonProps {
  aiModels: AIModelResponse[];
  selectedModelId: string;
  disabled?: boolean;
}

export const ModelTestButton: FC<ModelTestButtonProps> = ({
  aiModels,
  selectedModelId,
  disabled,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    setTestResult(null);
  }, [selectedModelId]);

  const handleTest = useCallback(async () => {
    if (!apiClient || !selectedTenant || !selectedModelId) return;

    const model = aiModels.find((m) => m.id === selectedModelId);
    if (!model) return;

    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await apiClient.testAIModel(selectedTenant.id, {
        provider: model.provider,
        config: model.config,
        credential_id: model.credential_id || undefined,
      });
      setTestResult({ success: result.success, message: result.message });
    } catch {
      setTestResult({ success: false, message: 'Failed to test model connection' });
    } finally {
      setIsTesting(false);
    }
  }, [apiClient, selectedTenant, selectedModelId, aiModels]);

  return (
    <Group gap="xs" mt={4}>
      <Button
        variant="light"
        size="xs"
        leftSection={<IconTestPipe size={14} />}
        onClick={handleTest}
        loading={isTesting}
        disabled={disabled || !selectedModelId}
      >
        Test Model
      </Button>
      {testResult && (
        <Group gap={4}>
          {testResult.success ? (
            <IconCheck size={14} className={classes.testSuccess} />
          ) : (
            <IconX size={14} className={classes.testError} />
          )}
          <Text size="xs" c={testResult.success ? 'green' : 'red'} style={{ maxWidth: 400 }} lineClamp={2}>
            {testResult.message}
          </Text>
        </Group>
      )}
    </Group>
  );
};
