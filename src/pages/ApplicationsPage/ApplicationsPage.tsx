import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { MainLayout } from '../../components/layout/MainLayout';
import { PageHeader, DataTable, ConfirmDeleteDialog, EntityAvatar } from '../../components/common';
import type { DataTableItem } from '../../components/common';
import { CreateApplicationDialog, EditApplicationDialog } from '../../components/dialogs';
import { useIdentity, useSidebarData, useFavorites } from '../../contexts';
import { useEntityList } from '../../hooks';
import type { ApplicationResponse } from '../../api/types';
import { FavoriteResourceTypeEnum } from '../../api/types';

const SORT_STORAGE_KEY = 'unified-ui:sort:applications';

export const ApplicationsPage: FC = () => {
  const navigate = useNavigate();
  const { apiClient } = useIdentity();
  const { refreshApplications } = useSidebarData();
  const { isFavorite: checkFavorite, toggleFavorite } = useFavorites();

  const isFavorite = useCallback(
    (id: string) => checkFavorite(FavoriteResourceTypeEnum.APPLICATION, id),
    [checkFavorite]
  );

  const handleToggleFavorite = useCallback(
    (id: string) => toggleFavorite(FavoriteResourceTypeEnum.APPLICATION, id),
    [toggleFavorite]
  );

  const mapToTableItem = useCallback((app: ApplicationResponse): DataTableItem => ({
    id: app.id,
    name: app.name,
    description: app.description,
    type: app.type.replace(/_/g, ' '),
    tags: app.tags?.map(tag => tag.name) || [],
    isActive: app.is_active,
  }), []);

  const listEntities = useCallback(
    (tenantId: string, params: Parameters<typeof apiClient.listApplications>[1]) =>
      apiClient!.listApplications(tenantId, params) as Promise<ApplicationResponse[]>,
    [apiClient]
  );

  const listTags = useCallback(
    (tenantId: string, params: Parameters<typeof apiClient.listApplicationTypeTags>[1]) =>
      apiClient!.listApplicationTypeTags(tenantId, params),
    [apiClient]
  );

  const updateEntity = useCallback(
    (tenantId: string, id: string, data: { is_active: boolean }) =>
      apiClient!.updateApplication(tenantId, id, data),
    [apiClient]
  );

  const deleteEntity = useCallback(
    (tenantId: string, id: string) =>
      apiClient!.deleteApplication(tenantId, id),
    [apiClient]
  );

  const config = useMemo(() => ({
    sortStorageKey: SORT_STORAGE_KEY,
    errorMessage: 'Failed to load applications',
    listEntities,
    listTags,
    updateEntity,
    deleteEntity,
    mapToTableItem,
    refreshSidebar: refreshApplications,
  }), [listEntities, listTags, updateEntity, deleteEntity, mapToTableItem, refreshApplications]);

  const {
    items, isLoading, isLoadingMore, hasMore, error, searchValue, sortBy, filters,
    availableTags, isCreateDialogOpen, deleteDialog, isDeleting, editItemId, editTab,
    rawDataRef, setIsCreateDialogOpen, handleLoadMore, handleSearchChange, handleTagSearch,
    handleSortChange, handleFilterChange, handleEdit, handleEditClose, handleEditTabChange,
    handleEditSuccess, handleManageAccess, handleDuplicate, handleStatusChange,
    handleDeleteClick, handleDeleteConfirm, handleDeleteClose, handleCreateSuccess,
  } = useEntityList<ApplicationResponse>(config);

  const handleOpen = useCallback((id: string) => {
    navigate(`/conversations?chat-agent=${id}`);
  }, [navigate]);

  const renderIcon = useCallback((item: DataTableItem) => (
    <EntityAvatar name={item.name} size="sm" />
  ), []);

  return (
    <MainLayout>
      <PageHeader
        title="Chat Agents"
        description="Manage your AI chat agents. Create, configure, and deploy conversational agents for your applications."
        actionLabel="Create Chat Agent"
        onAction={() => setIsCreateDialogOpen(true)}
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
        onEmptyAction={() => setIsCreateDialogOpen(true)}
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
        onDelete={handleDeleteClick}
        renderIcon={renderIcon}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onLoadMore={handleLoadMore}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
      />

      <CreateApplicationDialog
        opened={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditApplicationDialog
        opened={!!editItemId}
        onClose={handleEditClose}
        applicationId={editItemId}
        initialData={editItemId ? rawDataRef.current.get(editItemId) : undefined}
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
