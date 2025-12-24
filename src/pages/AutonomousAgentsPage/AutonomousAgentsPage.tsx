import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconRobot } from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer, PageHeader, DataTable, ConfirmDeleteDialog } from '../../components/common';
import type { DataTableItem } from '../../components/common';
import { CreateAutonomousAgentDialog } from '../../components/dialogs';
import { useIdentity } from '../../contexts';

export const AutonomousAgentsPage: FC = () => {
  const navigate = useNavigate();
  const { apiClient, selectedTenant } = useIdentity();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [items, setItems] = useState<DataTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAutonomousAgents = useCallback(async () => {
    if (!apiClient || !selectedTenant) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.listAutonomousAgents(selectedTenant.id, { limit: 999 });
      const tableItems: DataTableItem[] = data.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        type: 'Autonomous',
        tags: [], // TODO: Add tags when available from API
        isActive: true, // TODO: Add status when available from API
      }));
      setItems(tableItems);
    } catch (err) {
      setError('Failed to load autonomous agents');
      console.error('Error loading autonomous agents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant]);

  useEffect(() => {
    fetchAutonomousAgents();
  }, [fetchAutonomousAgents]);

  const handleOpen = useCallback((id: string) => {
    navigate(`/autonomous-agents/${id}`);
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
      await apiClient.deleteAutonomousAgent(selectedTenant.id, deleteDialog.id);
      setDeleteDialog({ open: false, id: '', name: '' });
      fetchAutonomousAgents();
    } catch (err) {
      console.error('Error deleting autonomous agent:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [apiClient, selectedTenant, deleteDialog.id, fetchAutonomousAgents]);

  const handleCreateSuccess = useCallback(() => {
    fetchAutonomousAgents();
  }, [fetchAutonomousAgents]);

  const renderIcon = useCallback(() => (
    <IconRobot size={20} />
  ), []);

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Autonomous Agents"
          description="Manage your autonomous AI agents. These agents can perform tasks independently without user interaction."
          actionLabel="Create Autonomous Agent"
          onAction={() => setIsCreateDialogOpen(true)}
        />

        <DataTable
          items={items}
          isLoading={isLoading}
          error={error}
          showStatus={false}
          searchPlaceholder="Search autonomous agents..."
          emptyMessage="No autonomous agents found. Create your first one!"
          onOpen={handleOpen}
          onShare={handleShare}
          onDuplicate={handleDuplicate}
          onDelete={handleDeleteClick}
          renderIcon={renderIcon}
        />
      </PageContainer>

      <CreateAutonomousAgentDialog
        opened={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <ConfirmDeleteDialog
        opened={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: '', name: '' })}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.name}
        itemType="Autonomous Agent"
        isLoading={isDeleting}
      />
    </MainLayout>
  );
};
