import type { FC } from 'react';
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  SimpleGrid, Card, Image, Text, Group, Menu, ActionIcon,
  Stack, Center, Loader,
} from '@mantine/core';
import { IconDots, IconEdit, IconTrash, IconAppWindow } from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageHeader, ConfirmDeleteDialog } from '../../components/common';
import { CreateExternalAppDialog, EditExternalAppDialog } from '../../components/dialogs';
import { useIdentity } from '../../contexts';
import { usePermissions } from '../../hooks';
import type { ExternalAppResponse } from '../../api/types';
import classes from './ExternalAppsPage.module.css';

export const ExternalAppsPage: FC = () => {
  const { t } = useTranslation('externalApps');
  const { t: tc } = useTranslation('common');
  const navigate = useNavigate();
  const { apiClient, selectedTenant } = useIdentity();
  const { canCreate, isResourceAdmin } = usePermissions();
  const canCreateApp = canCreate('external-apps');
  const isAdmin = isResourceAdmin('external-apps');

  const [apps, setApps] = useState<ExternalAppResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ExternalAppResponse | null>(null);
  const [deletingApp, setDeletingApp] = useState<ExternalAppResponse | null>(null);

  const fetchApps = useCallback(async () => {
    if (!selectedTenant || !apiClient) return;
    setIsLoading(true);
    try {
      const data = await apiClient.listExternalApps(selectedTenant.id);
      setApps(data);
    } catch {
      /* handled by apiClient */
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTenant]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleDelete = useCallback(async () => {
    if (!selectedTenant || !deletingApp || !apiClient) return;
    try {
      await apiClient.deleteExternalApp(selectedTenant.id, deletingApp.id);
      setDeletingApp(null);
      fetchApps();
    } catch {
      /* handled by apiClient */
    }
  }, [apiClient, selectedTenant, deletingApp, fetchApps]);

  if (isLoading) {
    return (
      <MainLayout>
        <Center h="50vh"><Loader /></Center>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actionLabel={canCreateApp ? t('addApp') : undefined}
        onAction={canCreateApp ? () => setIsCreateOpen(true) : undefined}
      />

      {apps.length === 0 ? (
        <Center h="40vh">
          <Stack align="center" gap="sm">
            <IconAppWindow size={48} stroke={1} color="var(--text-secondary)" />
            <Text c="dimmed" size="lg">{t('noApps')}</Text>
            <Text c="dimmed" size="sm">{t('noAppsDescription')}</Text>
          </Stack>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
          {apps.map((app) => (
            <Card
              key={app.id}
              shadow="sm"
              radius="md"
              withBorder
              className={classes.card}
              onClick={() => navigate(`/external-apps/${app.id}`)}
            >
              <Card.Section>
                <Image
                  src={app.image_url}
                  height={160}
                  alt={app.name}
                  fallbackSrc="https://placehold.co/400x160?text=App"
                />
              </Card.Section>

              <Group justify="space-between" mt="md" mb="xs" wrap="nowrap">
                <Text fw={500} lineClamp={1}>{app.name}</Text>
                {isAdmin && (
                  <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
                      <Menu.Item
                        leftSection={<IconEdit size={14} />}
                        onClick={() => setEditingApp(app)}
                      >
                        {tc('edit')}
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconTrash size={14} />}
                        color="red"
                        onClick={() => setDeletingApp(app)}
                      >
                        {tc('delete')}
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                )}
              </Group>

              {app.description && (
                <Text size="sm" c="dimmed" lineClamp={2}>{app.description}</Text>
              )}
            </Card>
          ))}
        </SimpleGrid>
      )}

      <CreateExternalAppDialog
        opened={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchApps}
      />

      {editingApp && (
        <EditExternalAppDialog
          opened={!!editingApp}
          externalAppId={editingApp.id}
          initialData={editingApp}
          onClose={() => setEditingApp(null)}
          onSuccess={fetchApps}
        />
      )}

      <ConfirmDeleteDialog
        opened={!!deletingApp}
        onClose={() => setDeletingApp(null)}
        onConfirm={handleDelete}
        itemName={deletingApp?.name}
      />
    </MainLayout>
  );
};
