import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconSparkles } from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer, PageHeader, DataTable, ConfirmDeleteDialog } from '../../components/common';
import type { DataTableItem } from '../../components/common';
import type { SortOption } from '../../components/common/DataTable/DataTableToolbar';
import { CreateApplicationDialog } from '../../components/dialogs';
import { useIdentity, useSidebarData } from '../../contexts';
import type { ApplicationResponse } from '../../api/types';

export const ApplicationsPage: FC = () => {
  const navigate = useNavigate();
  const { apiClient, selectedTenant } = useIdentity();
  const { refreshApplications } = useSidebarData();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [items, setItems] = useState<DataTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('updated');

  // Map SortOption to Backend parameters
  const getSortParams = (sort: SortOption): { order_by: string; order_direction: 'asc' | 'desc' } => {
    switch (sort) {
      case 'name-asc':
        return { order_by: 'name', order_direction: 'asc' };
      case 'name-desc':
        return { order_by: 'name', order_direction: 'desc' };
      case 'created':
        return { order_by: 'created_at', order_direction: 'desc' };
      case 'updated':
      default:
        return { order_by: 'updated_at', order_direction: 'desc' };
    }
  };

  const fetchApplications = useCallback(async () => {
    if (!apiClient || !selectedTenant) return;

    setIsLoading(true);
    setError(null);

    try {
      const sortParams = getSortParams(sortBy);
      const data = await apiClient.listApplications(selectedTenant.id, { 
        limit: 999, 
        ...sortParams
      }) as ApplicationResponse[];
      const tableItems: DataTableItem[] = data.map((app) => ({
        id: app.id,
        name: app.name,
        description: app.description,
        type: 'Chat Agent',
        tags: app.tags?.map(tag => tag.name) || [],
        isActive: app.is_active,
      }));
      setItems(tableItems);
    } catch (err) {
      setError('Failed to load applications');
      console.error('Error loading applications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant, sortBy]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSortBy(newSort);
    // fetchApplications wird automatisch durch useEffect aufgerufen
  }, []);

  const handleOpen = useCallback((id: string) => {
    navigate(`/applications/${id}`);
  }, [navigate]);

  const handleShare = useCallback((id: string) => {
    // TODO: Implement share functionality
    console.log('Share:', id);
  }, []);

  const handleDuplicate = useCallback((id: string) => {
    // TODO: Implement duplicate functionality
    console.log('Duplicate:', id);
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    setDeleteDialog({ open: true, id, name: item?.name || '' });
  }, [items]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!apiClient || !selectedTenant || !deleteDialog.id) return;
    
    setIsDeleting(true);
    try {
      await apiClient.deleteApplication(selectedTenant.id, deleteDialog.id);
      setDeleteDialog({ open: false, id: '', name: '' });
      fetchApplications();
      refreshApplications(); // Update sidebar cache
    } catch (err) {
      console.error('Error deleting application:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [apiClient, selectedTenant, deleteDialog.id, fetchApplications, refreshApplications]);

  const handleCreateSuccess = useCallback(() => {
    fetchApplications();
    refreshApplications(); // Update sidebar cache
  }, [fetchApplications, refreshApplications]);

  const renderIcon = useCallback(() => (
    <IconSparkles size={20} />
  ), []);

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Chat Agents"
          description="Manage your AI chat agents. Create, configure, and deploy conversational agents for your applications."
          actionLabel="Create Chat Agent"
          onAction={() => setIsCreateDialogOpen(true)}
        />

        <DataTable
          items={items}
          isLoading={isLoading}
          error={error}
          showStatus={false}
          searchPlaceholder="Search chat agents..."
          emptyMessage="No chat agents found. Create your first one!"
          onOpen={handleOpen}
          onShare={handleShare}
          onDuplicate={handleDuplicate}
          onDelete={handleDeleteClick}
          renderIcon={renderIcon}
          sortBy={sortBy}
          onSortChange={handleSortChange}
        />
      </PageContainer>

      <CreateApplicationDialog
        opened={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <ConfirmDeleteDialog
        opened={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: '', name: '' })}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.name}
        itemType="Chat Agent"
        isLoading={isDeleting}
      />
    </MainLayout>
  );
};
