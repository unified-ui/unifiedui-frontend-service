import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { Button, Group, Text, Tooltip } from '@mantine/core';
import { IconCheck, IconX, IconPlugConnected } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useIdentity } from '../../../contexts';
import { TestConnectionType } from '../../../api/types';
import classes from './ConnectionTestButton.module.css';

interface ConnectionTestButtonProps {
  testType: TestConnectionType;
  url: string;
  config?: Record<string, unknown>;
  credentialId?: string;
  disabled?: boolean;
  hint?: string;
}

export const ConnectionTestButton: FC<ConnectionTestButtonProps> = ({
  testType,
  url,
  config,
  credentialId,
  disabled,
  hint,
}) => {
  const { t } = useTranslation('common');
  const { apiClient, selectedTenant, getFoundryToken } = useIdentity();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    setTestResult(null);
  }, [url, credentialId]);

  const handleTest = useCallback(async () => {
    if (!apiClient || !selectedTenant || !url) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      let foundryToken: string | undefined;
      if (testType === TestConnectionType.FOUNDRY_AGENT) {
        const token = await getFoundryToken();
        foundryToken = token || undefined;
      }

      const result = await apiClient.testConnection(
        selectedTenant.id,
        {
          test_type: testType,
          url,
          config,
          credential_id: credentialId || undefined,
        },
        foundryToken
      );
      setTestResult({ success: result.success, message: result.message });
    } catch {
      setTestResult({
        success: false,
        message: t('testConnectionFailed'),
      });
    } finally {
      setIsTesting(false);
    }
  }, [apiClient, selectedTenant, testType, url, config, credentialId, getFoundryToken, t]);

  const button = (
    <Button
      variant="light"
      size="xs"
      leftSection={<IconPlugConnected size={14} />}
      onClick={handleTest}
      loading={isTesting}
      disabled={disabled || !url}
    >
      {t('testConnection')}
    </Button>
  );

  return (
    <Group gap="xs" mt={4}>
      {hint ? (
        <Tooltip label={hint} multiline w={280}>
          {button}
        </Tooltip>
      ) : (
        button
      )}
      {testResult && (
        <Group gap={4}>
          {testResult.success ? (
            <IconCheck size={14} className={classes.testSuccess} />
          ) : (
            <IconX size={14} className={classes.testError} />
          )}
          <Text size="xs" c={testResult.success ? 'green' : 'red'}>
            {testResult.message}
          </Text>
        </Group>
      )}
    </Group>
  );
};
