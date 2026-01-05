import type { FC } from 'react';
import { useState, useMemo } from 'react';
import {
  Stack,
  TextInput,
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
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconMessageCircle,
  IconPinned,
  IconTrash,
  IconDots,
  IconLayoutList,
  IconApps,
  IconX,
} from '@tabler/icons-react';
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
  onDeleteConversation,
  onSearchOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [groupMode, setGroupMode] = useState<GroupMode>('time');

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

      {/* Search */}
      <div className={classes.searchContainer}>
        <TextInput
          placeholder="Search conversations..."
          size="sm"
          leftSection={<IconSearch size={16} />}
          rightSection={
            searchQuery && (
              <ActionIcon
                size="xs"
                variant="subtle"
                onClick={() => setSearchQuery('')}
              >
                <IconX size={14} />
              </ActionIcon>
            )
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          className={classes.searchInput}
        />
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
                    onDelete={() => onDeleteConversation?.(conversation.id)}
                  />
                ))}
              </div>
            ))}
          </Stack>
        )}
      </ScrollArea>
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
  onDelete?: () => void;
}

const ConversationItem: FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  isFavorite,
  applicationName,
  onClick,
  onToggleFavorite,
  onDelete,
}) => {
  return (
    <UnstyledButton
      className={`${classes.conversationItem} ${isSelected ? classes.selected : ''}`}
      onClick={onClick}
    >
      <Group gap="sm" wrap="nowrap" className={classes.conversationContent}>
        <IconMessageCircle size={16} className={classes.conversationIcon} />
        <div className={classes.conversationInfo}>
          <Text size="sm" lineClamp={1} className={classes.conversationName}>
            {isFavorite && <IconPinned size={12} className={classes.pinnedIcon} />}
            {conversation.name}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={1}>
            {applicationName}
          </Text>
        </div>
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
            <Menu.Divider />
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </UnstyledButton>
  );
};
