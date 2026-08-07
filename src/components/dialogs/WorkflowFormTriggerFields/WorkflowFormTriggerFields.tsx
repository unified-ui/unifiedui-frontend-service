import type { FC, ReactNode } from 'react';
import { Stack, Switch, TextInput, SegmentedControl, Input } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { WorkflowFormOpenModeEnum } from '../../../api/types';

interface WorkflowFormTriggerFieldsProps {
  enabled: boolean;
  url: string;
  urlError?: ReactNode;
  openMode: string;
  onEnabledChange: (enabled: boolean) => void;
  onUrlChange: (url: string) => void;
  onOpenModeChange: (openMode: string) => void;
}

export const WorkflowFormTriggerFields: FC<WorkflowFormTriggerFieldsProps> = ({
  enabled,
  url,
  urlError,
  openMode,
  onEnabledChange,
  onUrlChange,
  onOpenModeChange,
}) => {
  const { t } = useTranslation('common');

  return (
    <Stack gap="md">
      <Switch
        label={t('workflowFormTrigger')}
        description={t('workflowFormTriggerDescription')}
        checked={enabled}
        onChange={(e) => onEnabledChange(e.currentTarget.checked)}
      />

      {enabled && (
        <>
          <TextInput
            label={t('workflowFormTriggerUrl')}
            placeholder="https://your-n8n.com/form/{id}"
            description={t('workflowFormTriggerUrlDescription')}
            required
            withAsterisk
            value={url}
            error={urlError}
            onChange={(e) => onUrlChange(e.currentTarget.value)}
          />

          <Input.Wrapper
            label={t('workflowFormOpenMode')}
            description={t('workflowFormOpenModeDescription')}
          >
            <SegmentedControl
              mt="xs"
              fullWidth
              value={openMode}
              onChange={onOpenModeChange}
              data={[
                { value: WorkflowFormOpenModeEnum.TAB, label: t('workflowFormOpenModeTab') },
                { value: WorkflowFormOpenModeEnum.WINDOW, label: t('workflowFormOpenModeWindow') },
              ]}
            />
          </Input.Wrapper>
        </>
      )}
    </Stack>
  );
};
