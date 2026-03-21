import type { FC } from 'react';
import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Box, Badge, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import classes from './IframeWidget.module.css';

interface IframeConfig {
  url: string;
  width?: string | number;
  height?: string | number;
  allowFullscreen?: boolean;
}

interface IframeWidgetProps {
  config: IframeConfig;
  onSubmit: (data: string) => void;
  disabled?: boolean;
  submittedData?: string;
  widgetData?: Record<string, unknown>;
}

function parseOrigin(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return null;
  }
}

export const IframeWidget: FC<IframeWidgetProps> = ({
  config,
  onSubmit,
  disabled = false,
  submittedData,
  widgetData,
}) => {
  const { t } = useTranslation('widgets');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [localSubmitted, setLocalSubmitted] = useState(false);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const isSubmitted = !!submittedData;
  const effectiveSubmitted = isSubmitted || localSubmitted;

  const expectedOrigin = useMemo(() => parseOrigin(config.url), [config.url]);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (!expectedOrigin || event.origin !== expectedOrigin) return;
    if (effectiveSubmitted || disabled) return;

    const data = event.data;
    if (data && typeof data === 'object') {
      const json = JSON.stringify(data);
      setLocalSubmitted(true);
      onSubmit(json);
    }
  }, [expectedOrigin, effectiveSubmitted, disabled, onSubmit]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  useEffect(() => {
    if (widgetData && loadedUrl === config.url && iframeRef.current?.contentWindow && expectedOrigin) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'widget_data', data: widgetData },
        expectedOrigin,
      );
    }
  }, [widgetData, expectedOrigin, loadedUrl, config.url]);

  const width = config.width ?? '100%';
  const height = config.height ?? 400;
  const containerHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <Box className={classes.iframeWidget} style={{ height: containerHeight }}>
      {effectiveSubmitted && (
        <Badge
          leftSection={<IconCheck size={12} />}
          variant="light"
          color="green"
          size="sm"
          className={classes.submittedBadge}
        >
          {t('iframe.submitted')}
        </Badge>
      )}
      {!config.url ? (
        <Text size="sm" c="dimmed">{t('iframe.noUrl')}</Text>
      ) : (
        <iframe
          ref={iframeRef}
          src={config.url}
          title="Widget"
          style={{ width, height: '100%', border: 'none' }}
          sandbox="allow-scripts allow-same-origin allow-forms"
          allowFullScreen={config.allowFullscreen}
          onLoad={() => setLoadedUrl(config.url)}
        />
      )}
    </Box>
  );
};
