import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stack,
  Group,
  Title,
  Text,
  ActionIcon,
  Button,
  TextInput,
  NumberInput,
  Switch,
  Paper,
  CopyButton,
  Tooltip,
  Code,
  Badge,
  Skeleton,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconEdit,
  IconDeviceFloppy,
  IconCopy,
  IconCheck,
  IconRefresh,
} from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { Breadcrumbs } from '../../components/common';
import { EditChatWidgetDialog } from '../../components/dialogs';
import { useIdentity } from '../../contexts';
import { useDialogParams } from '../../hooks';
import type { ChatWidgetResponse } from '../../api/types';
import classes from './IframeWidgetPreviewPage.module.css';

interface IframeConfig {
  url: string;
  width: number;
  height: number;
  allowFullscreen: boolean;
}

const DEFAULT_CONFIG: IframeConfig = {
  url: '',
  width: 800,
  height: 600,
  allowFullscreen: true,
};

export const IframeWidgetPreviewPage: FC = () => {
  const { widgetId } = useParams<{ widgetId: string }>();
  const navigate = useNavigate();
  const { apiClient, selectedTenant } = useIdentity();
  const { dialog, openDialog, closeDialog } = useDialogParams();

  const [widget, setWidget] = useState<ChatWidgetResponse | null>(null);
  const [config, setConfig] = useState<IframeConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const tenantId = selectedTenant?.id;

  const loadWidget = useCallback(async () => {
    if (!tenantId || !apiClient || !widgetId) return;
    setIsLoading(true);
    try {
      const data = await apiClient.getChatWidget(tenantId, widgetId);
      setWidget(data);
      const widgetConfig = data.config as Partial<IframeConfig>;
      setConfig({
        url: widgetConfig.url || '',
        width: widgetConfig.width || 800,
        height: widgetConfig.height || 600,
        allowFullscreen: widgetConfig.allowFullscreen ?? true,
      });
    } catch (error) {
      console.error('Failed to load widget:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, apiClient, widgetId]);

  useEffect(() => {
    loadWidget();
  }, [loadWidget]);

  const updateConfig = useCallback(<K extends keyof IframeConfig>(key: K, value: IframeConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!tenantId || !apiClient || !widgetId) return;
    setIsSaving(true);
    try {
      await apiClient.updateChatWidget(tenantId, widgetId, {
        config: {
          ...widget?.config,
          url: config.url,
          width: config.width,
          height: config.height,
          allowFullscreen: config.allowFullscreen,
        },
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save widget:', error);
    } finally {
      setIsSaving(false);
    }
  }, [tenantId, apiClient, widgetId, widget, config]);

  const handleRefreshPreview = useCallback(() => {
    setIframeKey(prev => prev + 1);
  }, []);

  const embedCode = useMemo(() => {
    if (!config.url) return '';
    const fullscreenAttr = config.allowFullscreen ? ' allowfullscreen' : '';
    return `<iframe src="${config.url}" width="${config.width}" height="${config.height}" frameborder="0"${fullscreenAttr}></iframe>`;
  }, [config]);

  if (isLoading) {
    return (
      <MainLayout>
        <Stack gap="md" className={classes.page}>
          <Skeleton height={16} width={180} radius="sm" />
          <Group justify="space-between" align="flex-start">
            <Group gap="sm">
              <Skeleton height={36} width={36} radius="md" />
              <div>
                <Skeleton height={24} width={200} radius="sm" />
                <Skeleton height={14} width={300} radius="sm" mt={4} />
              </div>
            </Group>
            <Group gap="sm">
              <Skeleton height={36} width={120} radius="md" />
              <Skeleton height={36} width={120} radius="md" />
            </Group>
          </Group>
          <Skeleton height={400} radius="md" />
        </Stack>
      </MainLayout>
    );
  }

  if (!widget) {
    return (
      <MainLayout>
        <Stack align="center" justify="center" h="50vh">
          <Text c="dimmed">Widget not found</Text>
          <Button variant="light" onClick={() => navigate('/chat-widgets')}>
            Back to Chat Widgets
          </Button>
        </Stack>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Stack gap="md" className={classes.page}>
        <Breadcrumbs
          items={[
            { label: 'Chat Widgets', path: '/chat-widgets' },
            { label: widget.name },
          ]}
        />

        <Group justify="space-between" align="flex-start">
          <Group gap="sm">
            <ActionIcon variant="subtle" onClick={() => navigate('/chat-widgets')} size="lg">
              <IconArrowLeft size={20} />
            </ActionIcon>
            <div>
              <Title order={2}>{widget.name}</Title>
              {widget.description && (
                <Text size="sm" c="dimmed">{widget.description}</Text>
              )}
            </div>
            <Badge variant="light" color="blue">IFRAME</Badge>
          </Group>
          <Group gap="sm">
            <Button
              variant="light"
              leftSection={<IconEdit size={16} />}
              onClick={() => openDialog('edit')}
            >
              Edit Details
            </Button>
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSave}
              loading={isSaving}
              disabled={!hasChanges}
            >
              Save Changes
            </Button>
          </Group>
        </Group>

        <div className={classes.contentGrid}>
          <Paper className={classes.previewPanel} withBorder p="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={600}>Preview</Text>
                <Tooltip label="Refresh preview">
                  <ActionIcon variant="subtle" onClick={handleRefreshPreview}>
                    <IconRefresh size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
              <div className={classes.iframeContainer}>
                {config.url ? (
                  <iframe
                    key={iframeKey}
                    src={config.url}
                    width={config.width}
                    height={config.height}
                    frameBorder="0"
                    allowFullScreen={config.allowFullscreen}
                    title={widget.name}
                    className={classes.iframe}
                  />
                ) : (
                  <div className={classes.emptyPreview}>
                    <Text c="dimmed">Enter a URL to preview the iframe</Text>
                  </div>
                )}
              </div>
            </Stack>
          </Paper>

          <Paper className={classes.configPanel} withBorder p="md">
            <Stack gap="md">
              <Text fw={600}>Configuration</Text>

              <TextInput
                label="Source URL"
                placeholder="https://example.com/embed"
                value={config.url}
                onChange={(e) => updateConfig('url', e.currentTarget.value)}
              />

              <Group grow>
                <NumberInput
                  label="Width (px)"
                  value={config.width}
                  onChange={(val) => updateConfig('width', typeof val === 'number' ? val : 800)}
                  min={100}
                  max={2000}
                />
                <NumberInput
                  label="Height (px)"
                  value={config.height}
                  onChange={(val) => updateConfig('height', typeof val === 'number' ? val : 600)}
                  min={100}
                  max={2000}
                />
              </Group>

              <Switch
                label="Allow Fullscreen"
                checked={config.allowFullscreen}
                onChange={(e) => updateConfig('allowFullscreen', e.currentTarget.checked)}
              />

              <Stack gap="xs">
                <Group justify="space-between">
                  <Text fw={600} size="sm">Embed Code</Text>
                  <CopyButton value={embedCode}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Copied!' : 'Copy embed code'}>
                        <ActionIcon variant="subtle" onClick={copy} disabled={!embedCode}>
                          {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
                <Code block className={classes.embedCode}>
                  {embedCode || '// Configure URL to generate embed code'}
                </Code>
              </Stack>
            </Stack>
          </Paper>
        </div>
      </Stack>

      <EditChatWidgetDialog
        opened={dialog === 'edit'}
        chatWidgetId={widgetId || null}
        initialData={widget || undefined}
        onClose={closeDialog}
        onSuccess={loadWidget}
      />
    </MainLayout>
  );
};
