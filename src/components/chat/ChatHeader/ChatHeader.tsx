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
  Modal,
  Button,
  ThemeIcon,
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
  IconCode,
} from '@tabler/icons-react';
import { ConfirmDeleteDialog } from '../../common';
import type { ChatAgentResponse, ConversationResponse, MessageResponse } from '../../../api/types';
import classes from './ChatHeader.module.css';

export interface ChatHeaderProps {
  conversation?: ConversationResponse | null;
  chatAgents: ChatAgentResponse[];
  selectedChatAgentId?: string;
  isNewChat: boolean;
  isFavorite?: boolean;
  tracingSidebarVisible?: boolean;
  hasTraces?: boolean;
  messages?: MessageResponse[];
  onChatAgentChange: (chatAgentId: string) => void;
  onNewChatWithAgent?: (chatAgentId: string) => void;
  onShare?: () => void;
  onToggleFavorite?: () => void;
  onDelete?: () => void;
  onToggleTracingSidebar?: () => void;
  onEmbedSetup?: () => void;
}

export const ChatHeader: FC<ChatHeaderProps> = ({
  conversation,
  chatAgents,
  selectedChatAgentId,
  isNewChat,
  isFavorite = false,
  tracingSidebarVisible = false,
  hasTraces = false,
  messages = [],
  onChatAgentChange,
  onNewChatWithAgent,
  onShare,
  onToggleFavorite,
  onDelete,
  onToggleTracingSidebar,
  onEmbedSetup,
}) => {
  const { t } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [switchAgentDialogOpen, setSwitchAgentDialogOpen] = useState(false);
  const [pendingSwitchAgentId, setPendingSwitchAgentId] = useState<string | null>(null);

  const handleExportMarkdown = () => {
    const title = conversation?.name || 'Conversation';
    const lines = [`# ${title}\n`];
    for (const msg of messages) {
      const role = msg.type === 'user' ? 'User' : 'Assistant';
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
        type: m.type,
        content: m.content,
        createdAt: m.createdAt,
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

  const handleAgentChange = (agentId: string) => {
    if (!isNewChat) {
      setPendingSwitchAgentId(agentId);
      setSwitchAgentDialogOpen(true);
    } else {
      onChatAgentChange(agentId);
    }
  };

  const handleSwitchAgentConfirm = () => {
    if (pendingSwitchAgentId) {
      onNewChatWithAgent?.(pendingSwitchAgentId);
    }
    setSwitchAgentDialogOpen(false);
    setPendingSwitchAgentId(null);
  };

  const handleSwitchAgentCancel = () => {
    setSwitchAgentDialogOpen(false);
    setPendingSwitchAgentId(null);
  };

  const chatAgentOptions = chatAgents
    .filter(app => app.is_active)
    .map(app => ({
      value: app.id,
      label: app.name,
    }));

  const perm = conversation?.my_permission;
  const canAdminConv = !perm || perm === 'ADMIN';

  return (
    <div className={classes.header}>
      <Group justify="space-between" align="center" wrap="nowrap" className={classes.headerContent}>
        <Box className={classes.leftSection}>
          <Select
            placeholder={t('conversations:selectAgent')}
            data={chatAgentOptions}
            value={selectedChatAgentId}
            onChange={(value) => value && handleAgentChange(value)}
            leftSection={<IconSparkles size={18} />}
            rightSection={<IconChevronDown size={16} />}
            className={classes.chatAgentSelect}
            searchable
            nothingFoundMessage={t('conversations:noAgentsFound')}
            comboboxProps={{ position: 'bottom-start', shadow: 'md' }}
          />
        </Box>

        <Group gap="xs" className={classes.rightSection}>
          {selectedChatAgentId && (
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

              {canAdminConv && (
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
              )}

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
                  {onEmbedSetup && (
                    <Menu.Item
                      leftSection={<IconCode size={16} />}
                      onClick={onEmbedSetup}
                    >
                      {t('common:embedSetup')}
                    </Menu.Item>
                  )}
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
                  {canAdminConv && (
                  <>
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<IconTrash size={16} />}
                    onClick={handleDeleteClick}
                    disabled={isNewChat}
                  >
                    {t('conversations:deleteChat')}
                  </Menu.Item>
                  </>
                  )}
                </Menu.Dropdown>
              </Menu>
            </>
          )}
        </Group>
      </Group>

      <ConfirmDeleteDialog
        opened={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={conversation?.name || 'this conversation'}
        itemType="Conversation"
        isLoading={isDeleting}
      />

      <Modal
        opened={switchAgentDialogOpen}
        onClose={handleSwitchAgentCancel}
        title={
          <Group gap="sm">
            <ThemeIcon color="primary" variant="light" size="lg" radius="xl">
              <IconSparkles size={20} />
            </ThemeIcon>
            <Text fw={600} size="lg">{t('conversations:switchAgentTitle')}</Text>
          </Group>
        }
        centered
        size="sm"
      >
        <Stack gap="lg" mt="md">
          <Text size="sm" c="dimmed">
            {t('conversations:switchAgentMessage', {
              agentName: chatAgents.find(a => a.id === pendingSwitchAgentId)?.name || t('conversations:unknownAgent'),
            })}
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={handleSwitchAgentCancel}>
              {t('conversations:cancel')}
            </Button>
            <Button onClick={handleSwitchAgentConfirm}>
              {t('conversations:switchAgentConfirm')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};
