import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconSparkles } from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer, PageHeader, DataTable, ConfirmDeleteDialog } from '../../components/common';
import type { DataTableItem } from '../../components/common';
import { CreateApplicationDialog } from '../../components/dialogs';
import { useIdentity } from '../../contexts';

export const ApplicationsPage: FC = () => {
  const navigate = useNavigate();
  const { apiClient, selectedTenant } = useIdentity();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [items, setItems] = useState<DataTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    if (!apiClient || !selectedTenant) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.listApplications(selectedTenant.id, { limit: 999 });
      const tableItems: DataTableItem[] = data.map((app) => ({
        id: app.id,
        name: app.name,
        description: app.description,
        type: 'Chat Agent',
        tags: [], // TODO: Add tags when available from API
        isActive: true, // TODO: Add status when available from API
      }));
      setItems(tableItems);
    } catch (err) {
      setError('Failed to load applications');
      console.error('Error loading applications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

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
    } catch (err) {
      console.error('Error deleting application:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [apiClient, selectedTenant, deleteDialog.id, fetchApplications]);

  const handleCreateSuccess = useCallback(() => {
    fetchApplications();
  }, [fetchApplications]);

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
