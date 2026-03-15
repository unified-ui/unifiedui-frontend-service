import type { FC } from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Text,
  ActionIcon,
  Group,
  Stack,
  ScrollArea,
  SegmentedControl,
  Badge,
  Loader,
  Code,
} from '@mantine/core';
import { IconArrowLeft, IconCheck, IconClock } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useIdentity } from '../../../contexts';
import type { ChatWidgetResponse } from '../../../api/types';
import { ChatWidgetTypeEnum } from '../../../api/types';
import type { FormFieldConfig } from '../../../pages/WidgetDesignerPage/types';
import { FormWidget } from '../widgets/FormWidget';
import classes from './WidgetSidebar.module.css';

export interface WidgetInteraction {
  widgetId: string;
  messageIndex: number;
  submittedData?: string;
}

interface WidgetSidebarProps {
  interactions: WidgetInteraction[];
}

export const WidgetSidebar: FC<WidgetSidebarProps> = ({ interactions }) => {
  const { t } = useTranslation('widgets');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleBack = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const handleSelect = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  if (selectedIndex !== null && interactions[selectedIndex]) {
    return (
      <WidgetDetailView
        interaction={interactions[selectedIndex]}
        index={selectedIndex}
        onBack={handleBack}
      />
    );
  }

  return (
    <Box className={classes.sidebar}>
      <Box className={classes.sidebarHeader}>
        <Text fw={600} size="sm">{t('sidebar.title')}</Text>
      </Box>
      <ScrollArea className={classes.sidebarContent}>
        {interactions.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            {t('sidebar.noWidgets')}
          </Text>
        ) : (
          <Stack gap="xs" p="sm">
            {interactions.map((interaction, index) => (
              <WidgetListItem
                key={`${interaction.widgetId}-${interaction.messageIndex}`}
                interaction={interaction}
                index={index}
                onClick={() => handleSelect(index)}
              />
            ))}
          </Stack>
        )}
      </ScrollArea>
    </Box>
  );
};

interface WidgetListItemProps {
  interaction: WidgetInteraction;
  index: number;
  onClick: () => void;
}

const WidgetListItem: FC<WidgetListItemProps> = ({ interaction, onClick }) => {
  const { t } = useTranslation('widgets');
  const { apiClient, selectedTenant } = useIdentity();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!apiClient || !selectedTenant?.id) return;
    let cancelled = false;
    apiClient.getChatWidget(selectedTenant.id, interaction.widgetId)
      .then((def) => { if (!cancelled) setName(def.name); })
      .catch(() => { if (!cancelled) setName(interaction.widgetId.slice(0, 8)); });
    return () => { cancelled = true; };
  }, [apiClient, selectedTenant?.id, interaction.widgetId]);

  return (
    <Box className={classes.listItem} onClick={onClick}>
      <Group justify="space-between" wrap="nowrap">
        <Text size="sm" fw={500} truncate>
          {name ?? interaction.widgetId.slice(0, 8)}
        </Text>
        <Badge
          size="xs"
          variant="light"
          color={interaction.submittedData ? 'green' : 'gray'}
          leftSection={interaction.submittedData ? <IconCheck size={10} /> : <IconClock size={10} />}
        >
          {interaction.submittedData ? t('sidebar.submitted') : t('sidebar.pending')}
        </Badge>
      </Group>
    </Box>
  );
};

interface WidgetDetailViewProps {
  interaction: WidgetInteraction;
  index: number;
  onBack: () => void;
}

const WidgetDetailView: FC<WidgetDetailViewProps> = ({ interaction, onBack }) => {
  const { t } = useTranslation('widgets');
  const { apiClient, selectedTenant } = useIdentity();
  const [widgetDef, setWidgetDef] = useState<ChatWidgetResponse | null>(null);
  const [viewMode, setViewMode] = useState<string>('form');

  const shouldFetch = !!apiClient && !!selectedTenant?.id;
  const [loading, setLoading] = useState(shouldFetch);

  useEffect(() => {
    if (!shouldFetch || !apiClient || !selectedTenant?.id) return;
    let cancelled = false;
    apiClient.getChatWidget(selectedTenant.id, interaction.widgetId)
      .then((def) => {
        if (!cancelled) {
          setWidgetDef(def);
          if (def.type === ChatWidgetTypeEnum.IFRAME) {
            setViewMode('json');
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [shouldFetch, apiClient, selectedTenant?.id, interaction.widgetId]);

  const formattedJson = useMemo(() => {
    if (!interaction.submittedData) return null;
    try {
      return JSON.stringify(JSON.parse(interaction.submittedData), null, 2);
    } catch {
      return interaction.submittedData;
    }
  }, [interaction.submittedData]);

  const isFormType = widgetDef?.type === ChatWidgetTypeEnum.FORM;

  return (
    <Box className={classes.sidebar}>
      <Box className={classes.detailHeader}>
        <Group gap="xs" wrap="nowrap">
          <ActionIcon variant="subtle" onClick={onBack} size="sm">
            <IconArrowLeft size={16} />
          </ActionIcon>
          <Text fw={600} size="sm" truncate>
            {widgetDef?.name ?? interaction.widgetId.slice(0, 8)}
          </Text>
        </Group>
        {isFormType && interaction.submittedData && (
          <SegmentedControl
            value={viewMode}
            onChange={setViewMode}
            data={[
              { label: t('sidebar.formView'), value: 'form' },
              { label: t('sidebar.jsonView'), value: 'json' },
            ]}
            size="xs"
          />
        )}
      </Box>
      <ScrollArea className={classes.sidebarContent}>
        <Box p="sm">
          {loading ? (
            <Loader size="sm" />
          ) : viewMode === 'json' && formattedJson ? (
            <Code block>{formattedJson}</Code>
          ) : isFormType && widgetDef ? (
            <FormWidget
              fields={(widgetDef.config?.fields as FormFieldConfig[]) || []}
              onSubmit={() => {}}
              disabled
              submittedData={interaction.submittedData}
            />
          ) : !interaction.submittedData ? (
            <Text size="sm" c="dimmed">{t('sidebar.notSubmitted')}</Text>
          ) : (
            <Code block>{formattedJson}</Code>
          )}
        </Box>
      </ScrollArea>
    </Box>
  );
};
