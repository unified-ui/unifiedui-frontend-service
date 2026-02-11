import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { MainLayout } from '../../components/layout/MainLayout';
import { PageHeader, DataTable, ConfirmDeleteDialog, EntityAvatar } from '../../components/common';
import type { DataTableItem } from '../../components/common';
import { EditReActAgentDialog } from '../../components/dialogs';
import { useIdentity } from '../../contexts';
import { useEntityList, usePermissions } from '../../hooks';
import type { ReActAgentResponse } from '../../api/types';

const SORT_STORAGE_KEY = 'unified-ui:sort:re-act-agents';

export const ReActAgentsPage: FC = () => {
  const { t } = useTranslation('reactAgent');
  const navigate = useNavigate();
  const { apiClient, selectedTenant } = useIdentity();
  const { canCreate } = usePermissions();
  const canCreateAgent = canCreate('re-act-agents');

  const mapToTableItem = useCallback((agent: ReActAgentResponse): DataTableItem => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    tags: agent.tags?.map(tag => tag.name) || [],
    isActive: agent.is_active,
    my_permission: agent.my_permission,
  }), []);

  const listEntities = useCallback(
    (tenantId: string, params: Parameters<NonNullable<typeof apiClient>['listReActAgents']>[1]) =>
      apiClient!.listReActAgents(tenantId, params) as Promise<ReActAgentResponse[]>,
    [apiClient]
  );

  const listTags = useCallback(
    (tenantId: string, params: Parameters<NonNullable<typeof apiClient>['listReActAgentTypeTags']>[1]) =>
      apiClient!.listReActAgentTypeTags(tenantId, params),
    [apiClient]
  );

  const updateEntity = useCallback(
    (tenantId: string, id: string, data: { is_active: boolean }) =>
      apiClient!.updateReActAgent(tenantId, id, data),
    [apiClient]
  );

  const deleteEntity = useCallback(
    (tenantId: string, id: string) =>
      apiClient!.deleteReActAgent(tenantId, id),
    [apiClient]
  );

  const config = useMemo(() => ({
    sortStorageKey: SORT_STORAGE_KEY,
    errorMessage: t('loadFailed'),
    listEntities,
    listTags,
    updateEntity,
    deleteEntity,
    mapToTableItem,
  }), [listEntities, listTags, updateEntity, deleteEntity, mapToTableItem, t]);

  const {
    items, isLoading, isLoadingMore, hasMore, error, searchValue, sortBy, filters,
    availableTags, deleteDialog, isDeleting, editItemId, editTab,
    rawDataRef, handleLoadMore, handleSearchChange, handleTagSearch,
    handleSortChange, handleFilterChange, handleEdit, handleEditClose, handleEditTabChange,
    handleEditSuccess, handleManageAccess, handleDuplicate, handleStatusChange,
    handleDeleteClick, handleDeleteConfirm, handleDeleteClose,
  } = useEntityList<ReActAgentResponse>(config);

  const handleOpen = useCallback((id: string) => {
    navigate(`/re-act-agents/${id}`);
  }, [navigate]);

  const handleCreate = useCallback(async () => {
    if (!apiClient || !selectedTenant) return;
    try {
      const agent = await apiClient.createReActAgent(selectedTenant.id, {
        name: t('untitledAgent'),
      });
      navigate(`/re-act-agents/${agent.id}`);
    } catch {
      /* handled by API client */
    }
  }, [apiClient, selectedTenant, navigate, t]);

  const handleShare = useCallback((_id: string) => {
    void _id;
  }, []);

  const renderIcon = useCallback(() => (
    <EntityAvatar entityType="re-act-agent" size="sm" />
  ), []);

  return (
    <MainLayout>
      <PageHeader
        title={t('listTitle')}
        description={t('listDescription')}
        actionLabel={t('createAgent')}
        onAction={canCreateAgent ? handleCreate : undefined}
      />

      <DataTable
        items={items}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        error={error}
        showStatus={true}
        searchPlaceholder={t('searchPlaceholder')}
        emptyMessage={t('emptyMessage')}
        emptyActionLabel={t('createAgent')}
        onEmptyAction={canCreateAgent ? handleCreate : undefined}
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
        onDelete={handleDeleteClick}
        renderIcon={renderIcon}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onLoadMore={handleLoadMore}
      />

      <EditReActAgentDialog
        opened={!!editItemId}
        agentId={editItemId}
        initialData={editItemId ? rawDataRef.current.get(editItemId) || null : null}
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
        itemType={t('agentItemType')}
        isLoading={isDeleting}
      />
    </MainLayout>
  );
};
