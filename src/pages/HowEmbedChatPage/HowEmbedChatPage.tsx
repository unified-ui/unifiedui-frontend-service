import type { FC } from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stack,
  Text,
  TextInput,
  NumberInput,
  Select,
  Button,
  Group,
  ActionIcon,
  CopyButton,
  Tooltip,
  TagsInput,
  Loader,
  Center,
} from '@mantine/core';
import {
  IconCheck,
  IconCopy,
  IconPlus,
  IconTrash,
  IconMessageCircle,
  IconX,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '../../components/layout/MainLayout';
import { Breadcrumbs } from '../../components/common';
import { useIdentity } from '../../contexts';
import type { ApplicationResponse } from '../../api/types';
import classes from './HowEmbedChatPage.module.css';

interface ContextParam {
  key: string;
  value: string;
}

export const HowEmbedChatPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { apiClient, selectedTenant } = useIdentity();

  const [application, setApplication] = useState<ApplicationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [theme, setTheme] = useState<string>('auto');
  const [lang, setLang] = useState<string>('en');
  const [width, setWidth] = useState<number>(400);
  const [height, setHeight] = useState<number>(600);
  const [contextParams, setContextParams] = useState<ContextParam[]>([]);
  const [allowedOrigins, setAllowedOrigins] = useState<string[]>([]);
  const [isSavingOrigins, setIsSavingOrigins] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasPreviewChanges, setHasPreviewChanges] = useState(true);

  useEffect(() => {
    if (!apiClient || !selectedTenant?.id || !id) return;

    setIsLoading(true);
    apiClient.getApplication(selectedTenant.id, id)
      .then((app) => {
        setApplication(app);
        setAllowedOrigins(
          app.embed_allowed_origins
            ? app.embed_allowed_origins.split(';').filter(Boolean)
            : []
        );
      })
      .catch(() => setError(t('loadFailed')))
      .finally(() => setIsLoading(false));
  }, [apiClient, selectedTenant?.id, id, t]);

  const baseUrl = useMemo(() => {
    return `${window.location.origin}/embed/chat/${id}`;
  }, [id]);

  const embedUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedTenant?.id) params.set('tenantId', selectedTenant.id);
    if (theme !== 'auto') params.set('theme', theme);
    if (lang) params.set('lang', lang);
    contextParams.forEach((cp) => {
      if (cp.key && cp.value) {
        params.set(`ctx_${cp.key}`, cp.value);
      }
    });
    return `${baseUrl}?${params.toString()}`;
  }, [baseUrl, selectedTenant?.id, theme, lang, contextParams]);

  useEffect(() => {
    setHasPreviewChanges(true);
  }, [embedUrl, width, height]);

  const handleApplyPreview = useCallback(() => {
    setPreviewUrl(embedUrl);
    setHasPreviewChanges(false);
    if (!previewOpen) setPreviewOpen(true);
  }, [embedUrl, previewOpen]);

  const iframeSnippet = useMemo(() => {
    return `<iframe\n  src="${embedUrl}"\n  width="${width}"\n  height="${height}"\n  style="border: none; border-radius: 12px;"\n  allow="clipboard-write"\n></iframe>`;
  }, [embedUrl, width, height]);

  const handleAddContextParam = useCallback(() => {
    setContextParams((prev) => [...prev, { key: '', value: '' }]);
  }, []);

  const handleRemoveContextParam = useCallback((index: number) => {
    setContextParams((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleContextParamChange = useCallback(
    (index: number, field: 'key' | 'value', val: string) => {
      setContextParams((prev) =>
        prev.map((cp, i) => (i === index ? { ...cp, [field]: val } : cp))
      );
    },
    []
  );

  const handleSaveOrigins = useCallback(async () => {
    if (!apiClient || !selectedTenant?.id || !id) return;
    setIsSavingOrigins(true);
    try {
      await apiClient.updateApplication(selectedTenant.id, id, {
        embed_allowed_origins: allowedOrigins.join(';'),
      });
    } catch {
      // silent
    } finally {
      setIsSavingOrigins(false);
    }
  }, [apiClient, selectedTenant?.id, id, allowedOrigins]);

  if (isLoading) {
    return (
      <MainLayout>
        <Center style={{ height: '60vh' }}>
          <Loader size="md" />
        </Center>
      </MainLayout>
    );
  }

  if (error || !application) {
    return (
      <MainLayout>
        <Center style={{ height: '60vh' }}>
          <Stack align="center" gap="md">
            <Text c="red">{error || t('loadFailed')}</Text>
            <Button variant="light" onClick={() => navigate('/applications')}>
              {t('back')}
            </Button>
          </Stack>
        </Center>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Breadcrumbs
        items={[
          { label: t('applications'), path: '/applications' },
          { label: application.name },
          { label: t('howEmbedChat.title') },
        ]}
      />

      <Text size="lg" fw={700} mt="md" mb="xs">
        {t('howEmbedChat.title')}
      </Text>
      <Text size="sm" c="dimmed" mb="lg">
        {t('howEmbedChat.description', { name: application.name })}
      </Text>

      <div className={classes.scrollWrapper}>
        <Stack gap="lg">
          <div className={classes.sectionCard}>
            <Text className={classes.sectionTitle}>{t('howEmbedChat.configuration')}</Text>
            <Stack gap="md">
              <div className={classes.configRow}>
                <TextInput
                  label={t('howEmbedChat.baseUrl')}
                  value={baseUrl}
                  readOnly
                />
                <TextInput
                  label={t('howEmbedChat.tenantId')}
                  value={selectedTenant?.id || ''}
                  readOnly
                />
              </div>

              <div className={classes.configRow}>
                <Select
                  label={t('howEmbedChat.theme')}
                  data={[
                    { value: 'auto', label: t('howEmbedChat.themeAuto') },
                    { value: 'light', label: t('howEmbedChat.themeLight') },
                    { value: 'dark', label: t('howEmbedChat.themeDark') },
                  ]}
                  value={theme}
                  onChange={(v) => setTheme(v || 'auto')}
                />
                <TextInput
                  label={t('howEmbedChat.language')}
                  value={lang}
                  onChange={(e) => setLang(e.currentTarget.value)}
                  placeholder="en"
                />
              </div>

              <div className={classes.configRow}>
                <NumberInput
                  label={t('howEmbedChat.width')}
                  value={width}
                  onChange={(v) => setWidth(Number(v) || 400)}
                  min={200}
                  max={1200}
                  suffix="px"
                />
                <NumberInput
                  label={t('howEmbedChat.height')}
                  value={height}
                  onChange={(v) => setHeight(Number(v) || 600)}
                  min={300}
                  max={1200}
                  suffix="px"
                />
              </div>

              <Group justify="flex-end">
                <Button
                  leftSection={<IconPlayerPlay size={16} />}
                  onClick={handleApplyPreview}
                  disabled={!hasPreviewChanges}
                >
                  {t('howEmbedChat.preview')}
                </Button>
              </Group>

              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>{t('howEmbedChat.contextParams')}</Text>
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconPlus size={14} />}
                    onClick={handleAddContextParam}
                  >
                    {t('howEmbedChat.addParam')}
                  </Button>
                </Group>
                <Text size="xs" c="dimmed">{t('howEmbedChat.contextParamsHint')}</Text>
                {contextParams.map((cp, index) => (
                  <div key={index} className={classes.contextParamRow}>
                    <TextInput
                      placeholder={t('howEmbedChat.paramKey')}
                      value={cp.key}
                      onChange={(e) =>
                        handleContextParamChange(index, 'key', e.currentTarget.value)
                      }
                      leftSection={
                        <Text size="xs" c="dimmed">ctx_</Text>
                      }
                    />
                    <TextInput
                      placeholder={t('howEmbedChat.paramValue')}
                      value={cp.value}
                      onChange={(e) =>
                        handleContextParamChange(index, 'value', e.currentTarget.value)
                      }
                    />
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleRemoveContextParam(index)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </div>
                ))}
              </Stack>
            </Stack>
          </div>

          <div className={classes.sectionCard}>
            <Text className={classes.sectionTitle}>{t('howEmbedChat.embedCode')}</Text>
            <div className={classes.codeBlock}>
              <CopyButton value={iframeSnippet} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? t('messageCopied') : t('howEmbedChat.copyCode')}>
                    <ActionIcon
                      className={classes.copyButton}
                      variant="subtle"
                      color={copied ? 'teal' : 'gray'}
                      onClick={copy}
                    >
                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
              <pre>{iframeSnippet}</pre>
            </div>
          </div>

          <div className={classes.sectionCard}>
            <Text className={classes.sectionTitle}>{t('howEmbedChat.generatedUrl')}</Text>
            <div className={classes.codeBlock}>
              <CopyButton value={embedUrl} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? t('messageCopied') : t('howEmbedChat.copyUrl')}>
                    <ActionIcon
                      className={classes.copyButton}
                      variant="subtle"
                      color={copied ? 'teal' : 'gray'}
                      onClick={copy}
                    >
                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
              <pre>{embedUrl}</pre>
            </div>
          </div>

          <div className={classes.sectionCard}>
            <Text className={classes.sectionTitle}>{t('embedAllowedOrigins')}</Text>
            <Text size="sm" c="dimmed" mb="md">
              {t('embedAllowedOriginsDescription')}
            </Text>
            <TagsInput
              value={allowedOrigins}
              onChange={setAllowedOrigins}
              splitChars={[',', ' ']}
              placeholder={t('embedAllowedOriginsPlaceholder')}
            />
            <Group justify="flex-end" mt="md">
              <Button
                size="sm"
                onClick={handleSaveOrigins}
                loading={isSavingOrigins}
              >
                {t('save')}
              </Button>
            </Group>
          </div>
        </Stack>
      </div>

      <div
        className={classes.previewBubble}
        onClick={() => setPreviewOpen((o) => !o)}
      >
        {previewOpen ? <IconX size={24} /> : <IconMessageCircle size={24} />}
      </div>

      {previewOpen && (
        <>
          <div
            className={classes.previewOverlay}
            onClick={() => setPreviewOpen(false)}
          />
          <div className={classes.previewWindow} style={{ width: width, height: height }}>
            <iframe key={previewUrl} src={previewUrl || ''} title={t('howEmbedChat.preview')} />
          </div>
        </>
      )}
    </MainLayout>
  );
};
