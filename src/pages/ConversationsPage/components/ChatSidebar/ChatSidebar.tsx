import type { FC } from 'react';
import { useState, useMemo } from 'react';
import {
  Stack,
  ActionIcon,
  Text,
  UnstyledButton,
  Group,
  ScrollArea,
  Tooltip,
  Menu,
  Divider,
  SegmentedControl,
  Skeleton,
  Box,
  TextInput,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconMessage,
  IconPinned,
  IconTrash,
  IconDots,
  IconLayoutList,
  IconApps,
  IconEdit,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { ConfirmDeleteDialog } from '../../../../components/common';
import { useIdentity } from '../../../../contexts';
import type { ConversationResponse, ApplicationResponse } from '../../../../api/types';
import classes from './ChatSidebar.module.css';

interface ChatSidebarProps {
  conversations: ConversationResponse[];
  applications: ApplicationResponse[];
  selectedConversationId?: string;
  favoriteIds: Set<string>;
  isLoading?: boolean;
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onNewChat: () => void;
  onSelectConversation: (conversationId: string) => void;
  onToggleFavorite?: (conversationId: string) => void;
  onRenameConversation?: (conversationId: string, newName: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onSearchOpen?: () => void;
}

type GroupMode = 'time' | 'application';

interface GroupedConversations {
  label: string;
  conversations: ConversationResponse[];
}

export const ChatSidebar: FC<ChatSidebarProps> = ({
  conversations,
  applications,
  selectedConversationId,
  favoriteIds,
  isLoading,
  isCollapsed,
  onCollapsedChange,
  onNewChat,
  onSelectConversation,
  onToggleFavorite,
  onRenameConversation,
  onDeleteConversation,
  onSearchOpen,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [searchQuery] = useState('');
  const [groupMode, setGroupMode] = useState<GroupMode>('time');

  // Rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Delete state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    conversationId: string;
    conversationName: string;
  }>({ open: false, conversationId: '', conversationName: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // Rename handlers
  const handleRenameStart = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleRenameSave = async () => {
    if (!editingId || !apiClient || !selectedTenant) return;
    
    try {
      await apiClient.updateConversation(selectedTenant.id, editingId, {
        name: editingName,
      });
      
      // Update parent state immediately
      onRenameConversation?.(editingId, editingName);
      
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      console.error('Failed to rename conversation:', error);
    }
  };

  const handleRenameCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  // Delete handlers
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteDialog({ open: true, conversationId: id, conversationName: name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.conversationId) return;
    
    setIsDeleting(true);
    try {
      await onDeleteConversation?.(deleteDialog.conversationId);
      setDeleteDialog({ open: false, conversationId: '', conversationName: '' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Get application name by ID
  const getApplicationName = (applicationId: string): string => {
    const app = applications.find(a => a.id === applicationId);
    return app?.name || 'Unknown Application';
  };

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      conv => conv.name.toLowerCase().includes(query) ||
        conv.description?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  // Group conversations
  const groupedConversations = useMemo((): GroupedConversations[] => {
    const pinned = filteredConversations.filter(c => favoriteIds.has(c.id));
    const unpinned = filteredConversations.filter(c => !favoriteIds.has(c.id));

    if (groupMode === 'application') {
      // Group by application
      const appGroups = new Map<string, ConversationResponse[]>();
      
      unpinned.forEach(conv => {
        const appId = conv.application_id;
        if (!appGroups.has(appId)) {
          appGroups.set(appId, []);
        }
        appGroups.get(appId)!.push(conv);
      });

      const result: GroupedConversations[] = [];
      
      if (pinned.length > 0) {
        result.push({ label: 'Pinned', conversations: pinned });
      }
      
      // Sort groups by most recent conversation
      const sortedGroups = Array.from(appGroups.entries()).sort((a, b) => {
        const aLatest = Math.max(...a[1].map(c => new Date(c.updated_at).getTime()));
        const bLatest = Math.max(...b[1].map(c => new Date(c.updated_at).getTime()));
        return bLatest - aLatest;
      });

      sortedGroups.forEach(([appId, convs]) => {
        result.push({
          label: getApplicationName(appId),
          conversations: convs.sort((a, b) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          ),
        });
      });

      return result;
    } else {
      // Group by time
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 86400000);
      const weekAgo = new Date(today.getTime() - 7 * 86400000);
      const monthAgo = new Date(today.getTime() - 30 * 86400000);

      const groups: Record<string, ConversationResponse[]> = {
        'Pinned': [],
        'Today': [],
        'Yesterday': [],
        'Previous 7 days': [],
        'Previous 30 days': [],
        'Older': [],
      };

      pinned.forEach(conv => groups['Pinned'].push(conv));

      unpinned.forEach(conv => {
        const date = new Date(conv.updated_at);
        if (date >= today) {
          groups['Today'].push(conv);
        } else if (date >= yesterday) {
          groups['Yesterday'].push(conv);
        } else if (date >= weekAgo) {
          groups['Previous 7 days'].push(conv);
        } else if (date >= monthAgo) {
          groups['Previous 30 days'].push(conv);
        } else {
          groups['Older'].push(conv);
        }
      });

      // Sort each group by updated_at descending
      Object.values(groups).forEach(group => {
        group.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      });

      return Object.entries(groups)
        .filter(([, convs]) => convs.length > 0)
        .map(([label, convs]) => ({ label, conversations: convs }));
    }
  }, [filteredConversations, groupMode, applications]);

  if (isCollapsed) {
    return (
      <div className={classes.sidebarCollapsed}>
        <Tooltip label="Expand sidebar" position="right">
          <ActionIcon
            variant="subtle"
            className={classes.expandButton}
            onClick={() => onCollapsedChange(false)}
          >
            <IconChevronRight size={18} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="New Chat" position="right">
          <ActionIcon
            variant="filled"
            color="primary"
            className={classes.newChatButtonCollapsed}
            onClick={onNewChat}
          >
            <IconPlus size={18} />
          </ActionIcon>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className={classes.sidebar}>
      {/* Header */}
      <div className={classes.header}>
        <Group justify="space-between" align="center">
          <Text fw={600} size="lg">Chats</Text>
          <ActionIcon
            variant="subtle"
            onClick={() => onCollapsedChange(true)}
            aria-label="Collapse sidebar"
          >
            <IconChevronLeft size={18} />
          </ActionIcon>
        </Group>
      </div>

      {/* Actions */}
      <div className={classes.actions}>
        <UnstyledButton className={classes.newChatButton} onClick={onNewChat}>
          <IconPlus size={18} />
          <Text size="sm">New Chat</Text>
        </UnstyledButton>

        <Tooltip label="Search chats">
          <ActionIcon
            variant="subtle"
            onClick={onSearchOpen}
            aria-label="Search chats"
          >
            <IconSearch size={18} />
          </ActionIcon>
        </Tooltip>
      </div>

      {/* Group Mode Toggle */}
      <div className={classes.groupToggle}>
        <SegmentedControl
          size="xs"
          value={groupMode}
          onChange={(value) => setGroupMode(value as GroupMode)}
          data={[
            {
              value: 'time',
              label: (
                <Group gap={4}>
                  <IconLayoutList size={14} />
                  <span>Time</span>
                </Group>
              ),
            },
            {
              value: 'application',
              label: (
                <Group gap={4}>
                  <IconApps size={14} />
                  <span>Agent</span>
                </Group>
              ),
            },
          ]}
          fullWidth
        />
      </div>

      <Divider />

      {/* Conversation List */}
      <ScrollArea className={classes.conversationList} scrollbarSize={6}>
        {isLoading ? (
          <Stack gap="xs" p="sm">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height={48} radius="sm" />
            ))}
          </Stack>
        ) : groupedConversations.length === 0 ? (
          <Box p="md" ta="center">
            <Text c="dimmed" size="sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </Text>
            <Text c="dimmed" size="xs" mt="xs">
              Start a new chat to begin
            </Text>
          </Box>
        ) : (
          <Stack gap={0}>
            {groupedConversations.map((group) => (
              <div key={group.label} className={classes.group}>
                <Text size="xs" c="dimmed" className={classes.groupLabel}>
                  {group.label}
                </Text>
                {group.conversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={conversation.id === selectedConversationId}
                    isFavorite={favoriteIds.has(conversation.id)}
                    applicationName={getApplicationName(conversation.application_id)}
                    onClick={() => onSelectConversation(conversation.id)}
                    onToggleFavorite={() => onToggleFavorite?.(conversation.id)}
                    onRename={(id) => handleRenameStart(id, conversation.name)}
                    onDelete={(id) => handleDeleteClick(id, conversation.name)}
                    isEditing={editingId === conversation.id}
                    editingName={editingName}
                    onEditingNameChange={setEditingName}
                    onSaveRename={handleRenameSave}
                    onCancelRename={handleRenameCancel}
                  />
                ))}
              </div>
            ))}
          </Stack>
        )}
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        opened={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, conversationId: '', conversationName: '' })}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.conversationName}
        itemType="Conversation"
        isLoading={isDeleting}
      />
    </div>
  );
};

interface ConversationItemProps {
  conversation: ConversationResponse;
  isSelected: boolean;
  isFavorite: boolean;
  applicationName: string;
  onClick: () => void;
  onToggleFavorite?: () => void;
  onRename?: (id: string) => void;
  onDelete?: (id: string) => void;
  isEditing?: boolean;
  editingName?: string;
  onEditingNameChange?: (name: string) => void;
  onSaveRename?: () => void;
  onCancelRename?: () => void;
}

const ConversationItem: FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  isFavorite,
  applicationName,
  onClick,
  onToggleFavorite,
  onRename,
  onDelete,
  isEditing = false,
  editingName = '',
  onEditingNameChange,
  onSaveRename,
  onCancelRename,
}) => {
  return (
    <Box
      className={`${classes.conversationItem} ${isSelected ? classes.selected : ''}`}
      onClick={isEditing ? undefined : onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <Group gap="sm" wrap="nowrap" className={classes.conversationContent}>
        <IconMessage size={16} className={classes.conversationIcon} />
        <div className={classes.conversationInfo}>
          {isEditing ? (
            <div className={classes.editingContainer}>
              <TextInput
                value={editingName}
                onChange={(e) => onEditingNameChange?.(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onSaveRename?.();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancelRename?.();
                  }
                }}
                onBlur={onSaveRename}
                autoFocus
                size="xs"
                className={classes.editInput}
              />
              <ActionIcon
                size="xs"
                color="green"
                variant="subtle"
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveRename?.();
                }}
              >
                <IconCheck size={14} />
              </ActionIcon>
              <ActionIcon
                size="xs"
                color="red"
                variant="subtle"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelRename?.();
                }}
              >
                <IconX size={14} />
              </ActionIcon>
            </div>
          ) : (
            <Text size="sm" lineClamp={1} className={classes.conversationName}>
              {isFavorite && <IconPinned size={12} className={classes.pinnedIcon} />}
              {conversation.name}
            </Text>
          )}
          <Text size="xs" c="dimmed" lineClamp={1}>
            {applicationName}
          </Text>
        </div>
        {!isEditing && (
          <Menu position="right-start" withinPortal shadow="md">
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                size="sm"
                className={classes.menuButton}
                onClick={(e) => e.stopPropagation()}
              >
                <IconDots size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconPinned size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite?.();
                }}
              >
                {isFavorite ? 'Unpin' : 'Pin'}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onRename?.(conversation.id);
                }}
              >
                Rename
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(conversation.id);
                }}
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </Box>
  );
};
