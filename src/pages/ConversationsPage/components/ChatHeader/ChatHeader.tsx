import { useState } from 'react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Group,
  Select,
  Text,
  ActionIcon,
  Menu,
  Tooltip,
  Box,
  Stack,
} from '@mantine/core';
import {
  IconShare,
  IconDots,
  IconPinned,
  IconTrash,
  IconChevronDown,
  IconSparkles,
  IconChartDots,
  IconFileText,
  IconFileTypePdf,
  IconFileTypeJs,
} from '@tabler/icons-react';
import { ConfirmDeleteDialog } from '../../../../components/common';
import type { ApplicationResponse, ConversationResponse, MessageResponse } from '../../../../api/types';
import classes from './ChatHeader.module.css';

interface ChatHeaderProps {
  conversation?: ConversationResponse | null;
  applications: ApplicationResponse[];
  selectedApplicationId?: string;
  isNewChat: boolean;
  isFavorite?: boolean;
  tracingSidebarVisible?: boolean;
  hasTraces?: boolean;
  messages?: MessageResponse[];
  onApplicationChange: (applicationId: string) => void;
  onShare?: () => void;
  onToggleFavorite?: () => void;
  onDelete?: () => void;
  onToggleTracingSidebar?: () => void;
}

export const ChatHeader: FC<ChatHeaderProps> = ({
  conversation,
  applications,
  selectedApplicationId,
  isNewChat,
  isFavorite = false,
  tracingSidebarVisible = false,
  hasTraces = false,
  messages = [],
  onApplicationChange,
  onShare,
  onToggleFavorite,
  onDelete,
  onToggleTracingSidebar,
}) => {
  const selectedApp = applications.find(a => a.id === selectedApplicationId);
  const { t } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportMarkdown = () => {
    const title = conversation?.name || 'Conversation';
    const lines = [`# ${title}\n`];
    for (const msg of messages) {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      lines.push(`## ${role}\n`);
      lines.push(`${msg.content}\n`);
    }
    downloadFile(`${title}.md`, lines.join('\n'), 'text/markdown');
  };

  const handleExportJson = () => {
    const title = conversation?.name || 'Conversation';
    const data = {
      conversation: { id: conversation?.id, name: title },
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        created_at: m.created_at,
      })),
      exported_at: new Date().toISOString(),
    };
    downloadFile(`${title}.json`, JSON.stringify(data, null, 2), 'application/json');
  };

  const handleExportPdf = () => {
    window.print();
  };

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete?.();
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Prepare application options for select
  const applicationOptions = applications
    .filter(app => app.is_active)
    .map(app => ({
      value: app.id,
      label: app.name,
    }));

  return (
    <div className={classes.header}>
      <Group justify="space-between" align="center" wrap="nowrap" className={classes.headerContent}>
        {/* Left side - Application selector */}
        <Box className={classes.leftSection}>
          {isNewChat ? (
            <Select
              placeholder={t('conversations:selectAgent')}
              data={applicationOptions}
              value={selectedApplicationId}
              onChange={(value) => value && onApplicationChange(value)}
              leftSection={<IconSparkles size={18} />}
              rightSection={<IconChevronDown size={16} />}
              className={classes.applicationSelect}
              searchable
              nothingFoundMessage={t('conversations:noAgentsFound')}
              comboboxProps={{ position: 'bottom-start', shadow: 'md' }}
            />
          ) : (
            <Box className={classes.applicationInfo}>
              <Group gap="xs" wrap="nowrap">
                <IconSparkles size={20} className={classes.applicationIcon} />
                <Stack gap={0}>
                  <Text size="sm" fw={600} lineClamp={1}>
                    {selectedApp?.name || t('conversations:unknownAgent')}
                  </Text>
                  {selectedApp?.description && (
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {selectedApp.description}
                    </Text>
                  )}
                </Stack>
              </Group>
            </Box>
          )}
        </Box>

        {/* Right side - Actions */}
        <Group gap="xs" className={classes.rightSection}>
          {selectedApplicationId && (
            <>
              <Tooltip label={tracingSidebarVisible ? t('tracing:hideTracing') : t('tracing:showTracing')}>
                <ActionIcon
                  variant={tracingSidebarVisible ? 'filled' : 'subtle'}
                  color={tracingSidebarVisible ? 'primary' : undefined}
                  onClick={onToggleTracingSidebar}
                  aria-label="Toggle tracing sidebar"
                  disabled={isNewChat || !hasTraces}
                >
                  <IconChartDots size={18} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label={t('conversations:shareConversation')}>
                <ActionIcon
                  variant="subtle"
                  onClick={onShare}
                  aria-label="Share conversation"
                  disabled={isNewChat}
                >
                  <IconShare size={18} />
                </ActionIcon>
              </Tooltip>

              <Menu position="bottom-end" shadow="md" withinPortal>
                <Menu.Target>
                  <ActionIcon variant="subtle" aria-label={t('conversations:moreOptions')}>
                    <IconDots size={18} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconPinned size={16} />}
                    onClick={onToggleFavorite}
                    disabled={isNewChat}
                  >
                    {isFavorite ? t('conversations:unpinChat') : t('conversations:pinChat')}
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Label>{t('conversations:export')}</Menu.Label>
                  <Menu.Item
                    leftSection={<IconFileText size={16} />}
                    onClick={handleExportMarkdown}
                    disabled={isNewChat || messages.length === 0}
                  >
                    {t('conversations:exportMarkdown')}
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconFileTypePdf size={16} />}
                    onClick={handleExportPdf}
                    disabled={isNewChat || messages.length === 0}
                  >
                    {t('conversations:exportPdf')}
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconFileTypeJs size={16} />}
                    onClick={handleExportJson}
                    disabled={isNewChat || messages.length === 0}
                  >
                    {t('conversations:exportJson')}
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<IconTrash size={16} />}
                    onClick={handleDeleteClick}
                    disabled={isNewChat}
                  >
                    {t('conversations:deleteChat')}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </>
          )}
        </Group>
      </Group>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        opened={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={conversation?.name || 'this conversation'}
        itemType="Conversation"
        isLoading={isDeleting}
      />
    </div>
  );
};
