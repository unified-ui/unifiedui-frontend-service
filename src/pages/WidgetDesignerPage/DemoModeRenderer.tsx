import type { FC } from 'react';
import { useState, useCallback } from 'react';
import { Box, Button, Group, Modal, Text, Code } from '@mantine/core';
import { IconClipboard } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { FormWidget } from '../../components/chat/widgets/FormWidget';
import type { WidgetFormSchema } from './types';

interface DemoModeRendererProps {
  schema: WidgetFormSchema;
}

export const DemoModeRenderer: FC<DemoModeRendererProps> = ({ schema }) => {
  const { t } = useTranslation('widgetDesigner');
  const [submittedData, setSubmittedData] = useState<string | null>(null);
  const [showPayload, setShowPayload] = useState(false);

  const handleSubmit = useCallback((data: string) => {
    setSubmittedData(data);
  }, []);

  const handleShowPayload = useCallback(() => {
    setShowPayload(true);
  }, []);

  return (
    <>
      <FormWidget
        tabs={schema.tabs}
        enableTabs={schema.settings.enableTabs}
        onSubmit={handleSubmit}
        submitButtonText={schema.settings.submitButtonText}
        maxHeight={600}
      />

      <Group justify="center" mt="sm">
        <Button
          variant="light"
          size="sm"
          leftSection={<IconClipboard size={14} />}
          onClick={handleShowPayload}
        >
          {t('demo.showPayload')}
        </Button>
      </Group>

      <Modal
        opened={showPayload}
        onClose={() => setShowPayload(false)}
        title={t('demo.payloadTitle')}
        size="lg"
      >
        <Box>
          {submittedData ? (
            <Code block style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
              {JSON.stringify(JSON.parse(submittedData), null, 2)}
            </Code>
          ) : (
            <Text size="sm" c="dimmed">{t('demo.noData')}</Text>
          )}
        </Box>
      </Modal>
    </>
  );
};
