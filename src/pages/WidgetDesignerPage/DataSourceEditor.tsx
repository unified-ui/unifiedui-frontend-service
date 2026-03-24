import type { FC } from 'react';
import { useState } from 'react';
import {
  Stack,
  TextInput,
  Select,
  NumberInput,
  Group,
  Button,
  ActionIcon,
  Text,
  Box,
  Collapse,
  UnstyledButton,
  Badge,
} from '@mantine/core';
import {
  IconPlus,
  IconX,
  IconChevronDown,
  IconChevronRight,
  IconDatabase,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { DataSourceConfig, WidgetFieldConfig } from './types';

interface DataSourceEditorProps {
  dataSources: DataSourceConfig[];
  allFields: WidgetFieldConfig[];
  onChange: (dataSources: DataSourceConfig[]) => void;
}

interface DataSourceItemProps {
  source: DataSourceConfig;
  allFields: WidgetFieldConfig[];
  onChange: (source: DataSourceConfig) => void;
  onRemove: () => void;
}

const DataSourceItem: FC<DataSourceItemProps> = ({ source, allFields, onChange, onRemove }) => {
  const { t } = useTranslation('widgetDesigner');
  const [opened, setOpened] = useState(true);

  const update = (partial: Partial<DataSourceConfig>) => {
    onChange({ ...source, ...partial });
  };

  const fieldOptions = allFields.map((f) => ({ value: f.id, label: f.label ?? f.id }));

  return (
    <Box p="xs" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
      <Group justify="space-between" mb={opened ? 'xs' : 0}>
        <UnstyledButton onClick={() => setOpened((o) => !o)}>
          <Group gap={4}>
            {opened ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
            <Text size="sm" fw={500}>{source.id || t('dataSources.unnamed')}</Text>
            <Badge size="xs" variant="light">{source.type}</Badge>
          </Group>
        </UnstyledButton>
        <ActionIcon size="xs" variant="subtle" color="red" onClick={onRemove}>
          <IconX size={12} />
        </ActionIcon>
      </Group>

      <Collapse in={opened}>
        <Stack gap="xs">
          <TextInput
            label={t('dataSources.id')}
            value={source.id}
            onChange={(e) => update({ id: e.currentTarget.value })}
            size="xs"
          />
          <Select
            label={t('dataSources.type')}
            value={source.type}
            onChange={(v) => update({ type: (v as 'static' | 'api' | 'dependent') ?? 'static' })}
            data={[
              { value: 'static', label: t('dataSources.typeStatic') },
              { value: 'api', label: t('dataSources.typeApi') },
              { value: 'dependent', label: t('dataSources.typeDependent') },
            ]}
            size="xs"
          />

          {source.type === 'api' && (
            <>
              <TextInput
                label={t('dataSources.url')}
                value={source.url ?? ''}
                onChange={(e) => update({ url: e.currentTarget.value })}
                size="xs"
                placeholder="https://api.example.com/data"
              />
              <Select
                label={t('dataSources.method')}
                value={source.method ?? 'GET'}
                onChange={(v) => update({ method: (v as 'GET' | 'POST') ?? 'GET' })}
                data={['GET', 'POST']}
                size="xs"
              />
              <TextInput
                label={t('dataSources.responsePath')}
                value={source.responsePath ?? ''}
                onChange={(e) => update({ responsePath: e.currentTarget.value })}
                size="xs"
                placeholder="data.items"
              />
              <TextInput
                label={t('dataSources.labelField')}
                value={source.labelField ?? ''}
                onChange={(e) => update({ labelField: e.currentTarget.value })}
                size="xs"
                placeholder="name"
              />
              <TextInput
                label={t('dataSources.valueField')}
                value={source.valueField ?? ''}
                onChange={(e) => update({ valueField: e.currentTarget.value })}
                size="xs"
                placeholder="id"
              />
              <NumberInput
                label={t('dataSources.cacheTtl')}
                value={source.cache?.ttl ?? ''}
                onChange={(val) => update({ cache: val ? { ttl: Number(val) } : undefined })}
                size="xs"
                min={0}
                suffix=" s"
              />
            </>
          )}

          {source.type === 'dependent' && (
            <>
              <Select
                label={t('dataSources.dependsOn')}
                value={source.dependsOn ?? ''}
                onChange={(v) => update({ dependsOn: v ?? undefined })}
                data={fieldOptions}
                size="xs"
                placeholder={t('visibility.selectField')}
              />
              <Text size="xs" c="dimmed">{t('dataSources.mappingHint')}</Text>
            </>
          )}

          {source.type !== 'dependent' && (
            <Select
              label={t('dataSources.refreshOn')}
              value={source.refreshOn ?? []}
              onChange={(v) => update({ refreshOn: v ? [v] : undefined })}
              data={fieldOptions}
              size="xs"
              clearable
              placeholder={t('dataSources.refreshOnPlaceholder')}
            />
          )}
        </Stack>
      </Collapse>
    </Box>
  );
};

export const DataSourceEditor: FC<DataSourceEditorProps> = ({
  dataSources,
  allFields,
  onChange,
}) => {
  const { t } = useTranslation('widgetDesigner');

  const addDataSource = () => {
    const id = `ds_${dataSources.length + 1}`;
    onChange([
      ...dataSources,
      { id, type: 'static' },
    ]);
  };

  const updateSource = (index: number, source: DataSourceConfig) => {
    onChange(dataSources.map((s, i) => (i === index ? source : s)));
  };

  const removeSource = (index: number) => {
    onChange(dataSources.filter((_, i) => i !== index));
  };

  return (
    <Stack gap="xs">
      <Group gap="xs">
        <IconDatabase size={14} />
        <Text size="xs" fw={600} tt="uppercase" c="dimmed">{t('dataSources.title')}</Text>
      </Group>

      {dataSources.map((source, index) => (
        <DataSourceItem
          key={source.id}
          source={source}
          allFields={allFields}
          onChange={(s) => updateSource(index, s)}
          onRemove={() => removeSource(index)}
        />
      ))}

      <Button
        variant="light"
        size="xs"
        leftSection={<IconPlus size={12} />}
        onClick={addDataSource}
        fullWidth
      >
        {t('dataSources.add')}
      </Button>
    </Stack>
  );
};
