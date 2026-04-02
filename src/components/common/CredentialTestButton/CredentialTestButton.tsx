import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import { Button, Group, Text, Tooltip } from '@mantine/core';
import { IconCheck, IconX, IconPlugConnected } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useIdentity } from '../../../contexts';
import { CredentialTypeEnum } from '../../../api/types';
import classes from './CredentialTestButton.module.css';

interface CredentialTestButtonProps {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  scopes?: string[];
  disabled?: boolean;
}

export const CredentialTestButton: FC<CredentialTestButtonProps> = ({
  tenantId,
  clientId,
  clientSecret,
  scopes,
  disabled,
}) => {
  const { t } = useTranslation('credentials');
  const { t: tCommon } = useTranslation('common');
  const { apiClient, selectedTenant } = useIdentity();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    setTestResult(null);
  }, [tenantId, clientId, clientSecret, scopes]);

  const isDisabled = disabled || !tenantId || !clientId || !clientSecret;

  const handleTest = useCallback(async () => {
    if (!apiClient || !selectedTenant || isDisabled) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await apiClient.testCredentialConnection(
        selectedTenant.id,
        {
          credential_type: CredentialTypeEnum.ENTRA_ID_APP_REGISTRATION,
          tenant_id: tenantId,
          client_id: clientId,
          client_secret: clientSecret,
          scopes: scopes && scopes.length > 0 ? scopes : undefined,
        }
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
  }, [apiClient, selectedTenant, tenantId, clientId, clientSecret, scopes, isDisabled, t]);

  const button = (
    <Button
      variant="light"
      size="xs"
      leftSection={<IconPlugConnected size={14} />}
      onClick={handleTest}
      loading={isTesting}
      disabled={isDisabled}
    >
      {tCommon('testConnection')}
    </Button>
  );

  return (
    <Group gap="xs" mt={4}>
      {isDisabled && !disabled ? (
        <Tooltip label={t('testConnectionRequiresAllFields')} multiline w={280}>
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
