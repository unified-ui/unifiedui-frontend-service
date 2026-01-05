import { useState } from 'react';
import type { FC } from 'react';
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
} from '@tabler/icons-react';
import { ConfirmDeleteDialog } from '../../../../components/common';
import type { ApplicationResponse, ConversationResponse } from '../../../../api/types';
import classes from './ChatHeader.module.css';

interface ChatHeaderProps {
  conversation?: ConversationResponse | null;
  applications: ApplicationResponse[];
  selectedApplicationId?: string;
  isNewChat: boolean;
  isFavorite?: boolean;
  onApplicationChange: (applicationId: string) => void;
  onShare?: () => void;
  onToggleFavorite?: () => void;
  onDelete?: () => void;
}

export const ChatHeader: FC<ChatHeaderProps> = ({
  conversation,
  applications,
  selectedApplicationId,
  isNewChat,
  isFavorite = false,
  onApplicationChange,
  onShare,
  onToggleFavorite,
  onDelete,
}) => {
  const selectedApp = applications.find(a => a.id === selectedApplicationId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
              placeholder="Select Chat Agent"
              data={applicationOptions}
              value={selectedApplicationId}
              onChange={(value) => value && onApplicationChange(value)}
              leftSection={<IconSparkles size={18} />}
              rightSection={<IconChevronDown size={16} />}
              className={classes.applicationSelect}
              searchable
              nothingFoundMessage="No agents found"
              comboboxProps={{ position: 'bottom-start', shadow: 'md' }}
            />
          ) : (
            <Box className={classes.applicationInfo}>
              <Group gap="xs" wrap="nowrap">
                <IconSparkles size={20} className={classes.applicationIcon} />
                <Stack gap={0}>
                  <Text size="sm" fw={600} lineClamp={1}>
                    {selectedApp?.name || 'Unknown Agent'}
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
              <Tooltip label="Share conversation">
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
                  <ActionIcon variant="subtle" aria-label="More options">
                    <IconDots size={18} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconPinned size={16} />}
                    onClick={onToggleFavorite}
                    disabled={isNewChat}
                  >
                    {isFavorite ? 'Unpin chat' : 'Pin chat'}
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<IconTrash size={16} />}
                    onClick={handleDeleteClick}
                    disabled={isNewChat}
                  >
                    Delete chat
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
