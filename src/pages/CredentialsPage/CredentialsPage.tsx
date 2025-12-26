import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconKey } from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer, PageHeader, DataTable, ConfirmDeleteDialog } from '../../components/common';
import type { DataTableItem } from '../../components/common';
import type { SortOption } from '../../components/common/DataTable/DataTableToolbar';
import { CreateCredentialDialog } from '../../components/dialogs';
import { useIdentity, useSidebarData } from '../../contexts';
import type { CredentialResponse } from '../../api/types';

export const CredentialsPage: FC = () => {
  const navigate = useNavigate();
  const { apiClient, selectedTenant } = useIdentity();
  const { refreshCredentials } = useSidebarData();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [items, setItems] = useState<DataTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('updated');

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

  const fetchCredentials = useCallback(async () => {
    if (!apiClient || !selectedTenant) return;

    setIsLoading(true);
    setError(null);

    try {
      const sortParams = getSortParams(sortBy);
      const data = await apiClient.listCredentials(selectedTenant.id, { 
        limit: 999, 
        ...sortParams
      }) as CredentialResponse[];
      const tableItems: DataTableItem[] = data.map((cred) => ({
        id: cred.id,
        name: cred.name,
        description: cred.description,
        type: cred.type,
        tags: [], // TODO: Add tags when available from API
        isActive: true, // TODO: Add status when available from API
      }));
      setItems(tableItems);
    } catch (err) {
      setError('Failed to load credentials');
      console.error('Error loading credentials:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant, sortBy]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSortBy(newSort);
  }, []);

  const handleOpen = useCallback((id: string) => {
    navigate(`/credentials/${id}`);
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
      await apiClient.deleteCredential(selectedTenant.id, deleteDialog.id);
      setDeleteDialog({ open: false, id: '', name: '' });
      fetchCredentials();
      refreshCredentials(); // Update sidebar cache
    } catch (err) {
      console.error('Error deleting credential:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [apiClient, selectedTenant, deleteDialog.id, fetchCredentials, refreshCredentials]);

  const handleCreateSuccess = useCallback(() => {
    fetchCredentials();
    refreshCredentials(); // Update sidebar cache
  }, [fetchCredentials, refreshCredentials]);

  const renderIcon = useCallback(() => (
    <IconKey size={20} />
  ), []);

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Credentials"
          description="Securely manage API keys, tokens, and other credentials used by your agents and applications."
          actionLabel="Create Credential"
          onAction={() => setIsCreateDialogOpen(true)}
        />

        <DataTable
          items={items}
          isLoading={isLoading}
          error={error}
          showStatus={false}
          searchPlaceholder="Search credentials..."
          emptyMessage="No credentials found. Create your first one!"
          onOpen={handleOpen}
          onShare={handleShare}
          onDuplicate={handleDuplicate}
          onDelete={handleDeleteClick}
          renderIcon={renderIcon}
          sortBy={sortBy}
          onSortChange={handleSortChange}
        />
      </PageContainer>

      <CreateCredentialDialog
        opened={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <ConfirmDeleteDialog
        opened={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: '', name: '' })}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.name}
        itemType="Credential"
        isLoading={isDeleting}
      />
    </MainLayout>
  );
};
