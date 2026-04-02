import type { FC } from 'react';
import { useRef } from 'react';
import { Menu, ActionIcon } from '@mantine/core';
import { IconDotsVertical, IconDownload, IconUpload } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { validateSchema } from './schemaValidation';
import { loadWidgetSchema } from './schemaMigration';
import type { WidgetFormSchema } from './types';

interface ImportExportActionsProps {
  schema: WidgetFormSchema;
  widgetName: string;
  onImport: (schema: WidgetFormSchema) => void;
}

export const ImportExportActions: FC<ImportExportActionsProps> = ({
  schema,
  widgetName,
  onImport,
}) => {
  const { t } = useTranslation('widgetDesigner');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${widgetName || 'widget'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string) as Record<string, unknown>;
        const imported = loadWidgetSchema(raw);
        const errors = validateSchema(imported);
        if (errors.length > 0) {
          return;
        }
        onImport(imported);
      } catch {
        /* invalid JSON */
      }
    };
    reader.readAsText(file);

    e.target.value = '';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Menu position="bottom-end" shadow="md">
        <Menu.Target>
          <ActionIcon variant="subtle" size="sm">
            <IconDotsVertical size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<IconDownload size={14} />} onClick={handleExport}>
            {t('importExport.export')}
          </Menu.Item>
          <Menu.Item leftSection={<IconUpload size={14} />} onClick={handleImportClick}>
            {t('importExport.import')}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  );
};
