import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { MainLayout } from '../../components/layout/MainLayout';
import { PageHeader, DataTable, ConfirmDeleteDialog, EntityAvatar } from '../../components/common';
import type { DataTableItem } from '../../components/common';
import { CreateChatWidgetDialog, EditChatWidgetDialog, StandardWidgetPromptDialog } from '../../components/dialogs';
import type { StandardWidgetType } from '../../components/dialogs';
import { useIdentity } from '../../contexts';
import { useEntityList, usePermissions } from '../../hooks';
import type { ChatWidgetResponse } from '../../api/types';
import { ChatWidgetTypeEnum } from '../../api/types';

const SORT_STORAGE_KEY = 'unified-ui:sort:chat-widgets';

const STANDARD_WIDGETS: DataTableItem[] = [
  {
    id: '__standard_yesno__',
    name: 'Yes / No',
    description: 'Interactive yes/no confirmation buttons for the chat.',
    type: 'Standard',
    hideActions: true,
  },
  {
    id: '__standard_survey__',
    name: 'Survey',
    description: 'Multi-question survey widget with structured answer options.',
    type: 'Standard',
    hideActions: true,
  },
];

const CHAT_WIDGET_TYPE_LABELS: Record<string, string> = {
  'CHAT': 'Chat',
  'EMBEDDED': 'Embedded',
  'POPUP': 'Popup',
  'FLOATING': 'Floating',
};

export const ChatWidgetsPage: FC = () => {
  const navigate = useNavigate();
  const { apiClient } = useIdentity();
  const { canCreate } = usePermissions();
  const canCreateWidget = canCreate('chat-widgets');

  const mapToTableItem = useCallback((widget: ChatWidgetResponse): DataTableItem => ({
    id: widget.id,
    name: widget.name,
    description: widget.description,
    type: CHAT_WIDGET_TYPE_LABELS[widget.type || ''] || widget.type || 'Chat',
    tags: widget.tags?.map(tag => tag.name) || [],
    isActive: widget.is_active,
    my_permission: widget.my_permission,
  }), []);

  const listEntities = useCallback(
    (tenantId: string, params: Parameters<NonNullable<typeof apiClient>['listChatWidgets']>[1]) =>
      apiClient!.listChatWidgets(tenantId, params) as Promise<ChatWidgetResponse[]>,
    [apiClient]
  );

  const listTags = useCallback(
    (tenantId: string, params: Parameters<NonNullable<typeof apiClient>['listChatWidgetTypeTags']>[1]) =>
      apiClient!.listChatWidgetTypeTags(tenantId, params),
    [apiClient]
  );

  const updateEntity = useCallback(
    (tenantId: string, id: string, data: { is_active: boolean }) =>
      apiClient!.updateChatWidget(tenantId, id, data),
    [apiClient]
  );

  const deleteEntity = useCallback(
    (tenantId: string, id: string) =>
      apiClient!.deleteChatWidget(tenantId, id),
    [apiClient]
  );

  const config = useMemo(() => ({
    sortStorageKey: SORT_STORAGE_KEY,
    errorMessage: 'Failed to load chat widgets',
    listEntities,
    listTags,
    updateEntity,
    deleteEntity,
    mapToTableItem,
  }), [listEntities, listTags, updateEntity, deleteEntity, mapToTableItem]);

  const {
    items, isLoading, isLoadingMore, hasMore, error, searchValue, sortBy, filters,
    availableTags, isCreateDialogOpen, deleteDialog, isDeleting, editItemId, editTab,
    rawDataRef, setIsCreateDialogOpen, handleLoadMore, handleSearchChange, handleTagSearch,
    handleSortChange, handleFilterChange, handleEdit, handleEditClose, handleEditTabChange,
    handleEditSuccess, handleManageAccess, handleDuplicate, handleStatusChange,
    handleDeleteClick, handleDeleteConfirm, handleDeleteClose, handleCreateSuccess,
  } = useEntityList<ChatWidgetResponse>(config);

  const [standardWidgetType, setStandardWidgetType] = useState<StandardWidgetType | null>(null);
  const [customPromptWidget, setCustomPromptWidget] = useState<{ id: string; name: string } | null>(null);

  const handleOpen = useCallback((id: string) => {
    if (id === '__standard_yesno__') {
      setStandardWidgetType('yesno');
      return;
    }
    if (id === '__standard_survey__') {
      setStandardWidgetType('survey');
      return;
    }
    const widget = rawDataRef.current.get(id) as ChatWidgetResponse | undefined;
    if (widget?.type === ChatWidgetTypeEnum.FORM) {
      navigate(`/widget-designer/${id}`);
    } else if (widget?.type === ChatWidgetTypeEnum.IFRAME) {
      navigate(`/chat-widgets/${id}/preview`);
    } else {
      handleEdit(id);
    }
  }, [navigate, handleEdit, rawDataRef]);

  const handleIntegrationPrompt = useCallback((id: string) => {
    const widget = rawDataRef.current.get(id) as ChatWidgetResponse | undefined;
    if (widget) {
      setCustomPromptWidget({ id: widget.id, name: widget.name });
    }
  }, [rawDataRef]);

  const handleShare = useCallback((_id: string) => {
    void _id;
  }, []);

  const renderIcon = useCallback(() => (
    <EntityAvatar entityType="chat-widget" size="sm" />
  ), []);
  // eslint-disable-next-line react-hooks/refs
  const editInitialData = editItemId ? rawDataRef.current.get(editItemId) || null : null;
  const handleWidgetCreated = useCallback((widget?: ChatWidgetResponse) => {
    handleCreateSuccess();
    if (widget?.type === ChatWidgetTypeEnum.FORM) {
      navigate(`/widget-designer/${widget.id}`);
    }
  }, [handleCreateSuccess, navigate]);

  return (
    <MainLayout>
      <PageHeader
        title="Chat Widgets"
        description="Manage your chat widgets. Create embeddable chat interfaces for your chat agents."
        actionLabel="Create Chat Widget"
        onAction={canCreateWidget ? () => setIsCreateDialogOpen(true) : undefined}
      />

      <DataTable
        items={items}
        staticItems={STANDARD_WIDGETS}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        error={error}
        showStatus={true}
        searchPlaceholder="Search chat widgets..."
        emptyMessage="No chat widgets found"
        emptyActionLabel="Create Chat Widget"
        onEmptyAction={canCreateWidget ? () => setIsCreateDialogOpen(true) : undefined}
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
        onIntegrationPrompt={handleIntegrationPrompt}
        onDelete={handleDeleteClick}
        renderIcon={renderIcon}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onLoadMore={handleLoadMore}
      />

      <CreateChatWidgetDialog
        opened={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleWidgetCreated}
      />

      <EditChatWidgetDialog
        opened={!!editItemId}
        chatWidgetId={editItemId}
        initialData={editInitialData}
        activeTab={editTab}
        onClose={handleEditClose}
        onSuccess={handleEditSuccess}
        onTabChange={handleEditTabChange}
      />

      <StandardWidgetPromptDialog
        opened={standardWidgetType !== null || customPromptWidget !== null}
        onClose={() => { setStandardWidgetType(null); setCustomPromptWidget(null); }}
        widgetType={customPromptWidget ? 'custom' : standardWidgetType}
        customWidgetId={customPromptWidget?.id}
        customWidgetName={customPromptWidget?.name}
      />

      <ConfirmDeleteDialog
        opened={deleteDialog.open}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.name}
        itemType="Chat Widget"
        isLoading={isDeleting}
      />
    </MainLayout>
  );
};
