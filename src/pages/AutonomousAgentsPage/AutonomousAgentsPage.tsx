import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { MainLayout } from '../../components/layout/MainLayout';
import { PageHeader, DataTable, ConfirmDeleteDialog, EntityAvatar } from '../../components/common';
import type { DataTableItem } from '../../components/common';
import { CreateAutonomousAgentDialog, EditAutonomousAgentDialog } from '../../components/dialogs';
import { useIdentity, useSidebarData, useFavorites } from '../../contexts';
import { useEntityList, usePermissions } from '../../hooks';
import type { AutonomousAgentResponse } from '../../api/types';
import { FavoriteResourceTypeEnum } from '../../api/types';

const SORT_STORAGE_KEY = 'unified-ui:sort:autonomous-agents';

export const AutonomousAgentsPage: FC = () => {
  const navigate = useNavigate();
  const { apiClient } = useIdentity();
  const { refreshAutonomousAgents } = useSidebarData();
  const { isFavorite: checkFavorite, toggleFavorite } = useFavorites();
  const { canCreate } = usePermissions();
  const canCreateAgent = canCreate('autonomous-agents');

  const isFavorite = useCallback(
    (id: string) => checkFavorite(FavoriteResourceTypeEnum.AUTONOMOUS_AGENT, id),
    [checkFavorite]
  );

  const handleToggleFavorite = useCallback(
    (id: string) => toggleFavorite(FavoriteResourceTypeEnum.AUTONOMOUS_AGENT, id),
    [toggleFavorite]
  );

  const mapToTableItem = useCallback((agent: AutonomousAgentResponse): DataTableItem => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    type: 'Autonomous',
    tags: agent.tags?.map(tag => tag.name) || [],
    isActive: agent.is_active,
    my_permission: agent.my_permission,
  }), []);

  const listEntities = useCallback(
    (tenantId: string, params: Parameters<typeof apiClient.listAutonomousAgents>[1]) =>
      apiClient!.listAutonomousAgents(tenantId, params) as Promise<AutonomousAgentResponse[]>,
    [apiClient]
  );

  const listTags = useCallback(
    (tenantId: string, params: Parameters<typeof apiClient.listAutonomousAgentTypeTags>[1]) =>
      apiClient!.listAutonomousAgentTypeTags(tenantId, params),
    [apiClient]
  );

  const updateEntity = useCallback(
    (tenantId: string, id: string, data: { is_active: boolean }) =>
      apiClient!.updateAutonomousAgent(tenantId, id, data),
    [apiClient]
  );

  const deleteEntity = useCallback(
    (tenantId: string, id: string) =>
      apiClient!.deleteAutonomousAgent(tenantId, id),
    [apiClient]
  );

  const config = useMemo(() => ({
    sortStorageKey: SORT_STORAGE_KEY,
    errorMessage: 'Failed to load autonomous agents',
    listEntities,
    listTags,
    updateEntity,
    deleteEntity,
    mapToTableItem,
    refreshSidebar: refreshAutonomousAgents,
  }), [listEntities, listTags, updateEntity, deleteEntity, mapToTableItem, refreshAutonomousAgents]);

  const {
    items, isLoading, isLoadingMore, hasMore, error, searchValue, sortBy, filters,
    availableTags, isCreateDialogOpen, deleteDialog, isDeleting, editItemId, editTab,
    rawDataRef, setIsCreateDialogOpen, handleLoadMore, handleSearchChange, handleTagSearch,
    handleSortChange, handleFilterChange, handleEdit, handleEditClose, handleEditTabChange,
    handleEditSuccess, handleManageAccess, handleDuplicate, handleStatusChange,
    handleDeleteClick, handleDeleteConfirm, handleDeleteClose, handleCreateSuccess,
  } = useEntityList<AutonomousAgentResponse>(config);

  const handleOpen = useCallback((id: string) => {
    navigate(`/autonomous-agents/${id}`);
  }, [navigate]);

  const handleShare = useCallback((_id: string) => {
    void _id;
  }, []);

  const handlePin = useCallback((_id: string, _isPinned: boolean) => {
    void _id;
    void _isPinned;
  }, []);

  const renderIcon = useCallback(() => (
    <EntityAvatar entityType="autonomous-agent" size="sm" />
  ), []);

  // eslint-disable-next-line react-hooks/refs
  const editInitialData = editItemId ? rawDataRef.current.get(editItemId) || null : null;

  return (
    <MainLayout>
      <PageHeader
        title="Autonomous Agents"
        description="Manage your autonomous AI agents. These agents can perform tasks independently without user interaction."
        actionLabel="Create Autonomous Agent"
        onAction={canCreateAgent ? () => setIsCreateDialogOpen(true) : undefined}
      />

      <DataTable
        items={items}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        error={error}
        showStatus={true}
        searchPlaceholder="Search autonomous agents..."
        emptyMessage="No autonomous agents found"
        emptyActionLabel="Create Autonomous Agent"
        onEmptyAction={canCreateAgent ? () => setIsCreateDialogOpen(true) : undefined}
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
        onShare={handleShare}
        onManageAccess={handleManageAccess}
        onDuplicate={handleDuplicate}
        onPin={handlePin}
        onDelete={handleDeleteClick}
        renderIcon={renderIcon}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onLoadMore={handleLoadMore}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
      />

      <CreateAutonomousAgentDialog
        opened={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditAutonomousAgentDialog
        opened={!!editItemId}
        autonomousAgentId={editItemId}
        initialData={editInitialData}
        activeTab={editTab}
        onClose={handleEditClose}
        onSuccess={handleEditSuccess}
        onTabChange={handleEditTabChange}
      />

      <ConfirmDeleteDialog
        opened={deleteDialog.open}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.name}
        itemType="Autonomous Agent"
        isLoading={isDeleting}
      />
    </MainLayout>
  );
};
