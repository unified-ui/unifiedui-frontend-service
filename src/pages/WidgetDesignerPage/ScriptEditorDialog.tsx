import type { FC } from 'react';
import { useState, useCallback } from 'react';
import {
  Modal,
  Group,
  Stack,
  Button,
  Textarea,
  Text,
  Alert,
  Select,
  Box,
  Badge,
} from '@mantine/core';
import { IconPlayerPlay, IconAlertTriangle, IconCheck, IconCode } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface ScriptEditorDialogProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  script: string;
  onSave: (script: string) => void;
  mode: 'validation' | 'fieldChange' | 'formLoad' | 'beforeSubmit';
  fieldIds?: string[];
}

const TEMPLATES: Record<string, { label: string; code: string }[]> = {
  validation: [
    {
      label: 'Required If',
      code: `function validate(value, fields, context) {
  if (fields.country === 'DE' && !value) {
    return 'This field is required for Germany';
  }
  return null;
}`,
    },
    {
      label: 'Regex Match',
      code: `function validate(value, fields, context) {
  if (value && !/^\\d{5}$/.test(value)) {
    return 'Must be exactly 5 digits';
  }
  return null;
}`,
    },
    {
      label: 'Cross-Field Comparison',
      code: `function validate(value, fields, context) {
  if (Number(value) < Number(fields.min_value)) {
    return 'Must be greater than minimum value';
  }
  return null;
}`,
    },
  ],
  fieldChange: [
    {
      label: 'Show/Hide Field',
      code: `function onFieldChange(fieldId, fields, actions) {
  if (fieldId === 'role') {
    actions.setFieldVisible('admin_notes', fields.role === 'admin');
  }
}`,
    },
    {
      label: 'Update Options',
      code: `function onFieldChange(fieldId, fields, actions) {
  if (fieldId === 'country') {
    const cityMap = {
      'DE': ['Berlin', 'Munich', 'Hamburg'],
      'US': ['New York', 'Chicago', 'LA'],
    };
    actions.setFieldOptions('city', cityMap[fields.country] || []);
  }
}`,
    },
  ],
  formLoad: [
    {
      label: 'Initialize Fields',
      code: `function onFormLoad(fields, actions, context) {
  // Set default values based on context
  actions.setFieldValue('locale', context.locale);
}`,
    },
  ],
  beforeSubmit: [
    {
      label: 'Confirm & Validate',
      code: `function onBeforeSubmit(fields, actions, context) {
  // Return false to cancel submission
  if (!fields.agree_terms) {
    return false;
  }
  return true;
}`,
    },
  ],
};

export const ScriptEditorDialog: FC<ScriptEditorDialogProps> = ({
  opened,
  onClose,
  title,
  script,
  onSave,
  mode,
  fieldIds,
}) => {
  const { t } = useTranslation('widgetDesigner');
  const [code, setCode] = useState(script);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [mockData, setMockData] = useState('{}');

  const templates = TEMPLATES[mode] ?? [];

  const handleTest = useCallback(() => {
    try {
      const iframe = document.createElement('iframe');
      iframe.sandbox.add('allow-scripts');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const timeout = setTimeout(() => {
        document.body.removeChild(iframe);
        setTestResult({ success: false, message: t('scriptEditor.timeout') });
      }, 2000);

      const handler = (event: MessageEvent) => {
        if (event.source === iframe.contentWindow) {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          document.body.removeChild(iframe);
          const data = event.data as { success: boolean; result?: unknown; error?: string };
          if (data.success) {
            setTestResult({ success: true, message: JSON.stringify(data.result, null, 2) ?? 'null' });
          } else {
            setTestResult({ success: false, message: data.error ?? 'Unknown error' });
          }
        }
      };
      window.addEventListener('message', handler);

      let parsedMock = {};
      try { parsedMock = JSON.parse(mockData); } catch { /* use empty */ }

      const scriptContent = `
        <script>
          try {
            ${code}
            const fn = typeof validate === 'function' ? validate
                     : typeof onFieldChange === 'function' ? onFieldChange
                     : typeof onFormLoad === 'function' ? onFormLoad
                     : typeof onBeforeSubmit === 'function' ? onBeforeSubmit
                     : null;
            const mockFields = ${JSON.stringify(parsedMock)};
            const result = fn ? fn('test', mockFields, { tenantId: 'test', userId: 'test', locale: 'en' }) : 'No function found';
            parent.postMessage({ success: true, result }, '*');
          } catch (e) {
            parent.postMessage({ success: false, error: e.message }, '*');
          }
        </script>
      `;
      iframe.srcdoc = scriptContent;
    } catch (err) {
      setTestResult({ success: false, message: String(err) });
    }
  }, [code, mockData, t]);

  const handleSave = () => {
    onSave(code);
    onClose();
  };

  const applyTemplate = (templateCode: string) => {
    setCode(templateCode);
    setTestResult(null);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size="xl"
      fullScreen
      styles={{ body: { height: 'calc(100% - 60px)', display: 'flex', flexDirection: 'column' } }}
    >
      <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 'var(--spacing-md)' }}>
        <Stack style={{ flex: 7, minHeight: 0 }} gap="sm">
          <Group justify="space-between">
            <Group gap="xs">
              <IconCode size={16} />
              <Text size="sm" fw={600}>{t('scriptEditor.code')}</Text>
            </Group>
            {templates.length > 0 && (
              <Select
                placeholder={t('scriptEditor.templates')}
                data={templates.map((tpl, i) => ({ value: String(i), label: tpl.label }))}
                onChange={(v) => {
                  if (v !== null) applyTemplate(templates[Number(v)].code);
                }}
                size="xs"
                clearable
                w={200}
              />
            )}
          </Group>
          <Textarea
            value={code}
            onChange={(e) => { setCode(e.currentTarget.value); setTestResult(null); }}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                const el = e.currentTarget;
                const start = el.selectionStart;
                const end = el.selectionEnd;
                const newCode = code.substring(0, start) + '  ' + code.substring(end);
                setCode(newCode);
                requestAnimationFrame(() => {
                  el.selectionStart = start + 2;
                  el.selectionEnd = start + 2;
                });
              }
            }}
            styles={{
              root: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 },
              wrapper: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 },
              input: {
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.5',
                flex: 1,
                minHeight: 0,
                resize: 'none',
              },
            }}
          />
        </Stack>

        <Stack style={{ flex: 3 }} gap="sm">
          <Text size="sm" fw={600}>{t('scriptEditor.mockData')}</Text>
          <Textarea
            value={mockData}
            onChange={(e) => setMockData(e.currentTarget.value)}
            autosize
            minRows={8}
            maxRows={15}
            styles={{
              input: {
                fontFamily: 'monospace',
                fontSize: '12px',
              },
            }}
            placeholder='{ "fieldId": "value" }'
          />

          {fieldIds && fieldIds.length > 0 && (
            <Box>
              <Text size="xs" c="dimmed" mb={4}>{t('scriptEditor.availableFields')}</Text>
              <Group gap={4}>
                {fieldIds.map((id) => (
                  <Badge key={id} size="xs" variant="outline">{id}</Badge>
                ))}
              </Group>
            </Box>
          )}

          <Button
            leftSection={<IconPlayerPlay size={14} />}
            onClick={handleTest}
            variant="light"
            size="sm"
          >
            {t('scriptEditor.runTest')}
          </Button>

          {testResult && (
            <Alert
              icon={testResult.success ? <IconCheck size={14} /> : <IconAlertTriangle size={14} />}
              color={testResult.success ? 'green' : 'red'}
              variant="light"
              title={testResult.success ? t('scriptEditor.testPassed') : t('scriptEditor.testFailed')}
            >
              <Text size="xs" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {testResult.message}
              </Text>
            </Alert>
          )}
        </Stack>
      </div>

      <Group justify="flex-end" mt="md" style={{ flexShrink: 0 }}>
        <Button variant="default" onClick={onClose}>{t('scriptEditor.cancel')}</Button>
        <Button onClick={handleSave}>{t('scriptEditor.apply')}</Button>
      </Group>
    </Modal>
  );
};
