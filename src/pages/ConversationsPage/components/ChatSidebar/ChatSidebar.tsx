import type { FC } from 'react';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  Stack,
  ActionIcon,
  Text,
  UnstyledButton,
  Group,
  ScrollArea,
  Tooltip,
  Menu,
  Skeleton,
  Box,
  TextInput,
  Loader,
  CopyButton,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconMessage,
  IconPinned,
  IconTrash,
  IconDots,
  IconLayoutList,
  IconApps,
  IconEdit,
  IconCheck,
  IconX,
  IconCopy,
  IconFileExport,
  IconChevronDown,
} from '@tabler/icons-react';
import { ConfirmDeleteDialog } from '../../../../components/common';
import { ApplicationSelectDialog } from '../../../../components/dialogs/ApplicationSelectDialog';
import { useIdentity } from '../../../../contexts';
import type { ConversationResponse, ApplicationResponse, QuickListItemResponse } from '../../../../api/types';
import classes from './ChatSidebar.module.css';

interface ChatSidebarProps {
  conversations: ConversationResponse[];
  applications: ApplicationResponse[];
  selectedConversationId?: string;
  favoriteIds: Set<string>;
  isLoading?: boolean;
  isCollapsed: boolean;
  hasMore?: boolean;
  searchQuery?: string;
  onCollapsedChange: (collapsed: boolean) => void;
  onNewChat: () => void;
  onSelectConversation: (conversationId: string) => void;
  onToggleFavorite?: (conversationId: string) => void;
  onRenameConversation?: (conversationId: string, newName: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onSearchOpen?: () => void;
  onSearchChange?: (query: string) => void;
  onLoadMore?: () => void;
}

type GroupMode = 'time' | 'application';

interface GroupedConversations {
  label: string;
  conversations: ConversationResponse[];
}

const STORAGE_KEY_GROUP_MODE = 'chatSidebar.groupMode';

export const ChatSidebar: FC<ChatSidebarProps> = ({
  conversations,
  applications,
  selectedConversationId,
  favoriteIds,
  isLoading,
  isCollapsed,
  hasMore = false,
  searchQuery = '',
  onCollapsedChange,
  onNewChat,
  onSelectConversation,
  onToggleFavorite,
  onRenameConversation,
  onDeleteConversation,
  onSearchOpen,
  onSearchChange,
  onLoadMore,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [groupMode, setGroupMode] = useState<GroupMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_GROUP_MODE);
    return (stored === 'time' || stored === 'application') ? stored : 'time';
  });
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    conversationId: string;
    conversationName: string;
  }>({ open: false, conversationId: '', conversationName: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [applicationSelectDialogOpen, setApplicationSelectDialogOpen] = useState(false);

  const selectedApplicationId = searchParams.get('selected-applicationId');
  
  const selectedApplication = useMemo(() => {
    if (!selectedApplicationId) return null;
    return applications.find(app => app.id === selectedApplicationId) || null;
  }, [selectedApplicationId, applications]);

  const isFilterActive = !!selectedApplicationId;

  const effectiveGroupMode: GroupMode = isFilterActive ? 'time' : groupMode;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GROUP_MODE, groupMode);
  }, [groupMode]);

  const handleClearFilter = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('selected-applicationId');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleSelectApplication = useCallback((app: QuickListItemResponse) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('selected-applicationId', app.id);
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleScrollPositionChange = useCallback(({ y }: { x: number; y: number }) => {
    if (!scrollAreaRef.current || !hasMore || !onLoadMore) return;
    const scrollHeight = scrollAreaRef.current.scrollHeight;
    const clientHeight = scrollAreaRef.current.clientHeight;
    if (scrollHeight - y - clientHeight < 100) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore]);

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

  const getApplicationName = (applicationId: string): string => {
    const app = applications.find(a => a.id === applicationId);
    return app?.name || 'Unknown Application';
  };

  const filteredConversations = useMemo(() => {
    if (!selectedApplicationId) return conversations;
    return conversations.filter(c => c.application_id === selectedApplicationId);
  }, [conversations, selectedApplicationId]);

  const groupedConversations = useMemo((): GroupedConversations[] => {
    const pinned = filteredConversations.filter(c => favoriteIds.has(c.id));
    const unpinned = filteredConversations.filter(c => !favoriteIds.has(c.id));

    if (effectiveGroupMode === 'application') {
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
        result.push({ label: t('conversations:pinned'), conversations: pinned });
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
        [t('conversations:pinned')]: [],
        [t('conversations:today')]: [],
        [t('conversations:yesterday')]: [],
        [t('conversations:previous7Days')]: [],
        [t('conversations:previous30Days')]: [],
        [t('conversations:older')]: [],
      };

      pinned.forEach(conv => groups[t('conversations:pinned')].push(conv));

      unpinned.forEach(conv => {
        const date = new Date(conv.updated_at);
        if (date >= today) {
          groups[t('conversations:today')].push(conv);
        } else if (date >= yesterday) {
          groups[t('conversations:yesterday')].push(conv);
        } else if (date >= weekAgo) {
          groups[t('conversations:previous7Days')].push(conv);
        } else if (date >= monthAgo) {
          groups[t('conversations:previous30Days')].push(conv);
        } else {
          groups[t('conversations:older')].push(conv);
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
  }, [filteredConversations, effectiveGroupMode, applications, favoriteIds]);

  if (isCollapsed) {
    return (
      <div className={classes.sidebarCollapsed}>
        <Tooltip label={t('conversations:expandSidebar')} position="right">
          <ActionIcon
            variant="subtle"
            className={classes.expandButton}
            onClick={() => onCollapsedChange(false)}
          >
            <IconLayoutSidebarLeftExpand size={18} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={t('conversations:newChat')} position="right">
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
      {/* Header: sidebar toggle + search */}
      <div className={classes.header}>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={() => onCollapsedChange(true)}
          aria-label="Collapse sidebar"
          className={classes.headerButton}
        >
          <IconLayoutSidebarLeftCollapse size={20} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={onSearchOpen}
          aria-label="Search"
          className={classes.headerButton}
        >
          <IconSearch size={18} />
        </ActionIcon>
      </div>

      {/* New Chat Button */}
      <div className={classes.actions}>
        <UnstyledButton className={classes.newChatButton} onClick={onNewChat}>
          <IconPlus size={18} />
          <Text size="sm">{t('conversations:newChat')}</Text>
        </UnstyledButton>
      </div>

      {/* Group Mode Toggle */}
      <div className={classes.groupToggle}>
        <div className={classes.customSegmentedControl}>
          <UnstyledButton
            className={`${classes.segmentedTab} ${effectiveGroupMode === 'time' ? classes.segmentedTabActive : ''}`}
            onClick={() => !isFilterActive && setGroupMode('time')}
          >
            <Group gap={4} wrap="nowrap">
              <IconLayoutList size={14} />
              <span>{t('conversations:groupByTime')}</span>
            </Group>
          </UnstyledButton>
          
          {isFilterActive ? (
            <div className={classes.segmentedTabFilter}>
              <Group gap={4} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                <IconApps size={14} style={{ flexShrink: 0 }} />
                <Text size="xs" lineClamp={1} style={{ flex: 1, minWidth: 0 }}>
                  {selectedApplication?.name || t('conversations:unknownAgent')}
                </Text>
              </Group>
              <ActionIcon
                size="xs"
                variant="subtle"
                onClick={handleClearFilter}
                className={classes.clearFilterButton}
              >
                <IconX size={12} />
              </ActionIcon>
            </div>
          ) : (
            <UnstyledButton
              className={`${classes.segmentedTab} ${groupMode === 'application' ? classes.segmentedTabActive : ''}`}
              onClick={() => setGroupMode('application')}
            >
              <Group gap={4} wrap="nowrap" justify="space-between" style={{ width: '100%' }}>
                <Group gap={4} wrap="nowrap">
                  <IconApps size={14} />
                  <span>{t('conversations:groupByAgent')}</span>
                </Group>
                <Box
                  component="span"
                  className={classes.dropdownArrow}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setApplicationSelectDialogOpen(true);
                  }}
                >
                  <IconChevronDown size={12} />
                </Box>
              </Group>
            </UnstyledButton>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea
        className={classes.conversationList}
        scrollbarSize={6}
        viewportRef={scrollAreaRef}
        onScrollPositionChange={handleScrollPositionChange}
      >
        {isLoading ? (
          <Stack gap="xs" p="sm">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height={48} radius="sm" />
            ))}
          </Stack>
        ) : groupedConversations.length === 0 ? (
          <Box p="md" ta="center">
            <Text className={classes.emptyStateText} size="sm">
              {searchQuery ? t('conversations:noConversationsFound') : t('conversations:noConversations')}
            </Text>
            <Text className={classes.emptyStateSubtext} size="xs" mt="xs">
              {t('conversations:startNewChat')}
            </Text>
          </Box>
        ) : (
          <Stack gap={0}>
            {groupedConversations.map((group) => (
              <div key={group.label} className={classes.group}>
                <div className={classes.groupLabelWrapper}>
                  <Text size="xs" fw={800} className={classes.groupLabel}>
                    {group.label}
                  </Text>
                </div>
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
            {hasMore && (
              <Box ta="center" py="sm">
                <Loader size="xs" />
              </Box>
            )}
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

      {/* Application Select Dialog */}
      <ApplicationSelectDialog
        opened={applicationSelectDialogOpen}
        onClose={() => setApplicationSelectDialogOpen(false)}
        onSelect={handleSelectApplication}
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
  const { t } = useTranslation();

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
        {isFavorite ? (
          <IconPinned size={16} className={classes.pinnedIcon} />
        ) : (
          <IconMessage size={16} className={classes.conversationIcon} />
        )}
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
              {conversation.name}
            </Text>
          )}
          <Text size="xs" className={classes.applicationName} lineClamp={1}>
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
                {isFavorite ? t('conversations:unpin') : t('conversations:pin')}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onRename?.(conversation.id);
                }}
              >
                {t('conversations:rename')}
              </Menu.Item>
              <CopyButton value={conversation.id}>
                {({ copy }) => (
                  <Menu.Item
                    leftSection={<IconCopy size={14} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      copy();
                    }}
                  >
                    {t('conversations:copyId')}
                  </Menu.Item>
                )}
              </CopyButton>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(conversation.id);
                }}
              >
                {t('conversations:deleteConversation')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </Box>
  );
};
