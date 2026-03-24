import type { FC } from 'react';
import { useState } from 'react';
import { Group, Box, ActionIcon, TextInput, Text } from '@mantine/core';
import { IconPlus, IconX, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { WidgetTab } from './types';
import classes from './WidgetDesignerPage.module.css';

interface TabBarProps {
  tabs: WidgetTab[];
  activeTabIndex: number;
  onSelectTab: (index: number) => void;
  onAddTab: () => void;
  onRemoveTab: (index: number) => void;
  onRenameTab: (index: number, label: string) => void;
  onMoveTab: (fromIndex: number, toIndex: number) => void;
}

export const TabBar: FC<TabBarProps> = ({
  tabs,
  activeTabIndex,
  onSelectTab,
  onAddTab,
  onRemoveTab,
  onRenameTab,
  onMoveTab,
}) => {
  const { t } = useTranslation('widgetDesigner');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const startRename = (index: number) => {
    setEditingIndex(index);
    setEditValue(tabs[index].label);
  };

  const commitRename = () => {
    if (editingIndex !== null && editValue.trim()) {
      onRenameTab(editingIndex, editValue.trim());
    }
    setEditingIndex(null);
  };

  return (
    <div className={classes.tabBar}>
      <Group gap={0} wrap="nowrap" className={classes.tabBarScroll}>
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`${classes.tab} ${index === activeTabIndex ? classes.tabActive : ''}`}
          >
            {editingIndex === index ? (
              <TextInput
                value={editValue}
                onChange={(e) => setEditValue(e.currentTarget.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') setEditingIndex(null);
                }}
                size="xs"
                styles={{ input: { width: 100, padding: '2px 6px', height: 24 } }}
                autoFocus
              />
            ) : (
              <Box
                onClick={() => onSelectTab(index)}
                onDoubleClick={() => startRename(index)}
                className={classes.tabLabel}
                style={{ cursor: 'pointer' }}
              >
                <Group gap={4} wrap="nowrap">
                  {tabs.length > 1 && index > 0 && (
                    <ActionIcon
                      size={14}
                      variant="transparent"
                      onClick={(e) => { e.stopPropagation(); onMoveTab(index, index - 1); }}
                    >
                      <IconChevronLeft size={10} />
                    </ActionIcon>
                  )}
                  <Text size="sm" truncate maw={120}>
                    {tab.label}
                  </Text>
                  {tabs.length > 1 && index < tabs.length - 1 && (
                    <ActionIcon
                      size={14}
                      variant="transparent"
                      onClick={(e) => { e.stopPropagation(); onMoveTab(index, index + 1); }}
                    >
                      <IconChevronRight size={10} />
                    </ActionIcon>
                  )}
                </Group>
              </Box>
            )}
            {tabs.length > 1 && (
              <ActionIcon
                size="xs"
                variant="subtle"
                c="dimmed"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveTab(index);
                }}
                className={classes.tabClose}
              >
                <IconX size={10} />
              </ActionIcon>
            )}
          </div>
        ))}
        <ActionIcon
          size="sm"
          variant="subtle"
          onClick={onAddTab}
          ml={4}
          title={t('tabs.addTab')}
        >
          <IconPlus size={14} />
        </ActionIcon>
      </Group>
    </div>
  );
};
