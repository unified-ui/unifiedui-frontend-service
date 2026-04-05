import type { FC } from 'react';
import { useState, useCallback } from 'react';
import { Box, Button, Group, Modal, Text, Code } from '@mantine/core';
import { IconClipboard } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { WidgetErrorBoundary } from '../../components/common';
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
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <WidgetErrorBoundary>
        <FormWidget
          tabs={schema.tabs}
          enableTabs={schema.settings.enableTabs}
          onSubmit={handleSubmit}
          submitButtonText={schema.settings.submitButtonText}
          description={schema.settings.description}
          successMessage={schema.settings.successMessage}
          scripts={schema.scripts}
          fillHeight
        />
      </WidgetErrorBoundary>

      <Group justify="center" mt="sm" style={{ flexShrink: 0 }}>
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
    </div>
  );
};
