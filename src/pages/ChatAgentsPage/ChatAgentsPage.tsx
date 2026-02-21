import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { MainLayout } from '../../components/layout/MainLayout';
import { PageHeader, DataTable, ConfirmDeleteDialog, EntityAvatar } from '../../components/common';
import type { DataTableItem } from '../../components/common';
import { CreateChatAgentDialog, EditChatAgentDialog } from '../../components/dialogs';
import { useIdentity, useSidebarData, useFavorites } from '../../contexts';
import { useEntityList, usePermissions } from '../../hooks';
import type { ChatAgentResponse } from '../../api/types';
import { FavoriteResourceTypeEnum } from '../../api/types';

const SORT_STORAGE_KEY = 'unified-ui:sort:chat-agents';

export const ChatAgentsPage: FC = () => {
  const navigate = useNavigate();
  const { apiClient } = useIdentity();
  const { refreshChatAgents } = useSidebarData();
  const { isFavorite: checkFavorite, toggleFavorite } = useFavorites();
  const { canCreate } = usePermissions();
  const canCreateChatAgent = canCreate('chat-agents');

  const isFavorite = useCallback(
    (id: string) => checkFavorite(FavoriteResourceTypeEnum.CHAT_AGENT, id),
    [checkFavorite]
  );

  const handleToggleFavorite = useCallback(
    (id: string) => toggleFavorite(FavoriteResourceTypeEnum.CHAT_AGENT, id),
    [toggleFavorite]
  );

  const mapToTableItem = useCallback((app: ChatAgentResponse): DataTableItem => ({
    id: app.id,
    name: app.name,
    description: app.description,
    type: app.type.replace(/_/g, ' '),
    tags: app.tags?.map(tag => tag.name) || [],
    isActive: app.is_active,
    my_permission: app.my_permission,
  }), []);

  const listEntities = useCallback(
    (tenantId: string, params: Parameters<NonNullable<typeof apiClient>['listChatAgents']>[1]) =>
      apiClient!.listChatAgents(tenantId, params) as Promise<ChatAgentResponse[]>,
    [apiClient]
  );

  const listTags = useCallback(
    (tenantId: string, params: Parameters<NonNullable<typeof apiClient>['listChatAgentTypeTags']>[1]) =>
      apiClient!.listChatAgentTypeTags(tenantId, params),
    [apiClient]
  );

  const updateEntity = useCallback(
    (tenantId: string, id: string, data: { is_active: boolean }) =>
      apiClient!.updateChatAgent(tenantId, id, data),
    [apiClient]
  );

  const deleteEntity = useCallback(
    (tenantId: string, id: string) =>
      apiClient!.deleteChatAgent(tenantId, id),
    [apiClient]
  );

  const config = useMemo(() => ({
    sortStorageKey: SORT_STORAGE_KEY,
    errorMessage: 'Failed to load chat agents',
    listEntities,
    listTags,
    updateEntity,
    deleteEntity,
    mapToTableItem,
    refreshSidebar: refreshChatAgents,
  }), [listEntities, listTags, updateEntity, deleteEntity, mapToTableItem, refreshChatAgents]);

  const {
    items, isLoading, isLoadingMore, hasMore, error, searchValue, sortBy, filters,
    availableTags, isCreateDialogOpen, deleteDialog, isDeleting, editItemId, editTab,
    rawDataRef, setIsCreateDialogOpen, handleLoadMore, handleSearchChange, handleTagSearch,
    handleSortChange, handleFilterChange, handleEdit, handleEditClose, handleEditTabChange,
    handleEditSuccess, handleManageAccess, handleDuplicate, handleStatusChange,
    handleDeleteClick, handleDeleteConfirm, handleDeleteClose, handleCreateSuccess,
  } = useEntityList<ChatAgentResponse>(config);

  const handleOpen = useCallback((id: string) => {
    navigate(`/conversations?chat-agent=${id}&selected-chatAgentId=${id}`);
  }, [navigate]);

  const handleEmbedSetup = useCallback((id: string) => {
    navigate(`/chat-agents/${id}/embed-chat`);
  }, [navigate]);

  const renderIcon = useCallback(() => (
    <EntityAvatar entityType="chat-agent" size="sm" />
  ), []);

  // eslint-disable-next-line react-hooks/refs
  const editInitialData = editItemId ? rawDataRef.current.get(editItemId) : undefined;

  return (
    <MainLayout>
      <PageHeader
        title="Chat Agents"
        description="Manage your AI chat agents. Create, configure, and deploy conversational agents for your use cases."
        actionLabel="Create Chat Agent"
        onAction={canCreateChatAgent ? () => setIsCreateDialogOpen(true) : undefined}
      />

      <DataTable
        items={items}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        error={error}
        showStatus={true}
        searchPlaceholder="Search chat agents..."
        emptyMessage="No chat agents found"
        emptyActionLabel="Create Chat Agent"
        onEmptyAction={canCreateChatAgent ? () => setIsCreateDialogOpen(true) : undefined}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        availableTags={availableTags}
        filters={filters}
        onFilterChange={handleFilterChange}
        onTagSearch={handleTagSearch}
        onStatusChange={handleStatusChange}
        onRowClick={handleOpen}
        onOpen={handleOpen}
        onEdit={handleEdit}
        onShare={handleManageAccess}
        onDuplicate={handleDuplicate}
        onEmbedSetup={handleEmbedSetup}
        onDelete={handleDeleteClick}
        renderIcon={renderIcon}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onLoadMore={handleLoadMore}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
      />

      <CreateChatAgentDialog
        opened={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditChatAgentDialog
        opened={!!editItemId}
        onClose={handleEditClose}
        chatAgentId={editItemId}
        initialData={editInitialData}
        initialTab={editTab}
        onTabChange={handleEditTabChange}
        onSuccess={handleEditSuccess}
      />

      <ConfirmDeleteDialog
        opened={deleteDialog.open}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.name}
        itemType="Chat Agent"
        isLoading={isDeleting}
      />
    </MainLayout>
  );
};
