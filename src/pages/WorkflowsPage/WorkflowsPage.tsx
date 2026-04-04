import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { MainLayout } from '../../components/layout/MainLayout';
import { PageHeader, DataTable, ConfirmDeleteDialog, ConfirmDialog, EntityAvatar } from '../../components/common';
import type { DataTableItem } from '../../components/common';
import { CreateWorkflowDialog, EditWorkflowDialog } from '../../components/dialogs';
import { useIdentity, useSidebarData, useFavorites } from '../../contexts';
import { useEntityList, usePermissions } from '../../hooks';
import type { WorkflowResponse } from '../../api/types';
import { FavoriteResourceTypeEnum } from '../../api/types';

const SORT_STORAGE_KEY = 'unified-ui:sort:workflows';

export const WorkflowsPage: FC = () => {
  const navigate = useNavigate();
  const { apiClient } = useIdentity();
  const { refreshWorkflows } = useSidebarData();
  const { isFavorite: checkFavorite, toggleFavorite } = useFavorites();
  const { canCreate } = usePermissions();
  const canCreateWorkflow = canCreate('workflows');

  const isFavorite = useCallback(
    (id: string) => checkFavorite(FavoriteResourceTypeEnum.AUTONOMOUS_AGENT, id),
    [checkFavorite]
  );

  const handleToggleFavorite = useCallback(
    (id: string, name: string) => toggleFavorite(FavoriteResourceTypeEnum.AUTONOMOUS_AGENT, id, name),
    [toggleFavorite]
  );

  const mapToTableItem = useCallback((agent: WorkflowResponse): DataTableItem => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    type: 'Workflow',
    tags: agent.tags?.map(tag => tag.name) || [],
    isActive: agent.is_active,
    my_permission: agent.my_permission,
  }), []);

  const listEntities = useCallback(
    (tenantId: string, params: Parameters<NonNullable<typeof apiClient>['listWorkflows']>[1]) =>
      apiClient!.listWorkflows(tenantId, params) as Promise<WorkflowResponse[]>,
    [apiClient]
  );

  const listTags = useCallback(
    (tenantId: string, params: Parameters<NonNullable<typeof apiClient>['listWorkflowTypeTags']>[1]) =>
      apiClient!.listWorkflowTypeTags(tenantId, params),
    [apiClient]
  );

  const updateEntity = useCallback(
    (tenantId: string, id: string, data: { is_active: boolean }) =>
      apiClient!.updateWorkflow(tenantId, id, data),
    [apiClient]
  );

  const deleteEntity = useCallback(
    (tenantId: string, id: string) =>
      apiClient!.deleteWorkflow(tenantId, id),
    [apiClient]
  );

  const duplicateEntity = useCallback(
    (tenantId: string, id: string) =>
      apiClient!.duplicateWorkflow(tenantId, id),
    [apiClient]
  );

  const config = useMemo(() => ({
    sortStorageKey: SORT_STORAGE_KEY,
    errorMessage: 'Failed to load workflows',
    listEntities,
    listTags,
    updateEntity,
    deleteEntity,
    duplicateEntity,
    mapToTableItem,
    refreshSidebar: refreshWorkflows,
  }), [listEntities, listTags, updateEntity, deleteEntity, duplicateEntity, mapToTableItem, refreshWorkflows]);

  const {
    items, isLoading, isLoadingMore, hasMore, error, searchValue, sortBy, filters,
    availableTags, isCreateDialogOpen, deleteDialog, deactivateDialog, isDeleting, selectedId, editTab,
    rawDataRef, setIsCreateDialogOpen, handleLoadMore, handleSearchChange, handleTagSearch,
    handleSortChange, handleFilterChange, handleEdit, handleEditClose, handleEditTabChange,
    handleEditSuccess, handleManageAccess, handleDuplicate, handleStatusChange,
    handleDeleteClick, handleDeleteConfirm, handleDeleteClose, handleDeactivateConfirm,
    handleDeactivateClose, handleCreateSuccess,
  } = useEntityList<WorkflowResponse>(config);

  const handleOpen = useCallback((id: string) => {
    navigate(`/workflows/${id}`);
  }, [navigate]);

  const renderIcon = useCallback(() => (
    <EntityAvatar entityType="workflow" size="sm" />
  ), []);

  // eslint-disable-next-line react-hooks/refs
  const editInitialData = selectedId ? rawDataRef.current.get(selectedId) || null : null;

  return (
    <MainLayout>
      <PageHeader
        title="Workflows"
        description="Manage your workflow agents. These agents can perform tasks independently without user interaction."
        actionLabel="Create Workflow"
        onAction={canCreateWorkflow ? () => setIsCreateDialogOpen(true) : undefined}
      />

      <DataTable
        items={items}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        error={error}
        showStatus={true}
        searchPlaceholder="Search workflows..."
        emptyMessage="No workflows found"
        emptyActionLabel="Create Workflow"
        onEmptyAction={canCreateWorkflow ? () => setIsCreateDialogOpen(true) : undefined}
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
        onManageAccess={handleManageAccess}
        onDuplicate={handleDuplicate}
        onDelete={handleDeleteClick}
        renderIcon={renderIcon}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onLoadMore={handleLoadMore}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
      />

      <CreateWorkflowDialog
        opened={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditWorkflowDialog
        opened={!!selectedId}
        workflowId={selectedId}
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
        itemType="Workflow"
        isLoading={isDeleting}
      />

      <ConfirmDialog
        opened={deactivateDialog.open}
        onClose={handleDeactivateClose}
        onConfirm={handleDeactivateConfirm}
        type="warning"
        title="Deactivate Workflow"
        message={<>Are you sure you want to deactivate <strong>{deactivateDialog.name}</strong>? It will no longer be available until reactivated.</>}
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
      />
    </MainLayout>
  );
};
