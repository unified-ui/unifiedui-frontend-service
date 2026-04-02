import type { FC } from 'react';
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  SimpleGrid, Card, Text, Group, Menu, ActionIcon,
  Stack, Center, Loader, Badge, Popover,
} from '@mantine/core';
import { IconDots, IconEdit, IconTrash, IconAppWindow, IconShieldLock } from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageHeader, ConfirmDeleteDialog, AuthImage } from '../../components/common';
import { CreateExternalAppDialog, EditExternalAppDialog } from '../../components/dialogs';
import { useIdentity } from '../../contexts';
import { usePermissions } from '../../hooks';
import type { ExternalAppResponse } from '../../api/types';
import type { EditDialogTab } from '../../components/dialogs/EditExternalAppDialog';
import classes from './ExternalAppsPage.module.css';

const MAX_VISIBLE_TAGS = 3;

const TagBadges: FC<{ tags: string[] }> = ({ tags }) => {
  const [popoverOpened, setPopoverOpened] = useState(false);
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenTags = tags.slice(MAX_VISIBLE_TAGS);

  if (tags.length === 0) return null;

  return (
    <Group gap={4} wrap="wrap" onClick={(e) => e.stopPropagation()}>
      {visibleTags.map((tag) => (
        <Badge key={tag} size="sm" variant="light" radius="sm">
          {tag}
        </Badge>
      ))}
      {hiddenTags.length > 0 && (
        <Popover
          position="top"
          withArrow
          shadow="md"
          withinPortal
          opened={popoverOpened}
          onChange={setPopoverOpened}
        >
          <Popover.Target>
            <div
              onMouseEnter={() => setPopoverOpened(true)}
              onMouseLeave={() => setPopoverOpened(false)}
              style={{ display: 'inline-block', lineHeight: 1 }}
            >
              <Badge size="sm" variant="outline" radius="sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                +{hiddenTags.length}
              </Badge>
            </div>
          </Popover.Target>
          <Popover.Dropdown
            onMouseEnter={() => setPopoverOpened(true)}
            onMouseLeave={() => setPopoverOpened(false)}
          >
            <Group gap={4} wrap="wrap" maw={300}>
              {hiddenTags.map((tag) => (
                <Badge key={tag} size="sm" variant="light" radius="sm">
                  {tag}
                </Badge>
              ))}
            </Group>
          </Popover.Dropdown>
        </Popover>
      )}
    </Group>
  );
};

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
  const [editDialogTab, setEditDialogTab] = useState<EditDialogTab>('details');
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
                <AuthImage
                  src={app.image_file_id || app.image_url}
                  h={160}
                  alt={app.name}
                  fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='160'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%234158D0'/%3E%3Cstop offset='50%25' stop-color='%23C850C0'/%3E%3Cstop offset='100%25' stop-color='%23FFCC70'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='160' fill='url(%23g)' rx='0'/%3E%3Ctext x='200' y='88' text-anchor='middle' font-family='system-ui,sans-serif' font-size='18' font-weight='600' fill='white' opacity='0.9'%3EApp%3C/text%3E%3C/svg%3E"
                />
              </Card.Section>

              <Group justify="space-between" mt="md" mb="xs" wrap="nowrap">
                <Text fw={500} lineClamp={1}>{app.name}</Text>
                {(isAdmin || app.my_permission) && (
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
                        onClick={() => { setEditDialogTab('details'); setEditingApp(app); }}
                      >
                        {tc('edit')}
                      </Menu.Item>
                      {(isAdmin || app.my_permission === 'ADMIN') && (
                        <Menu.Item
                          leftSection={<IconShieldLock size={14} />}
                          onClick={() => { setEditDialogTab('iam'); setEditingApp(app); }}
                        >
                          {tc('manageAccess')}
                        </Menu.Item>
                      )}
                      {(isAdmin || app.my_permission === 'ADMIN') && (
                        <Menu.Item
                          leftSection={<IconTrash size={14} />}
                          color="red"
                          onClick={() => setDeletingApp(app)}
                        >
                          {tc('delete')}
                        </Menu.Item>
                      )}
                    </Menu.Dropdown>
                  </Menu>
                )}
              </Group>

              <TagBadges tags={app.tags?.map((tag) => tag.name) || []} />

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
          activeTab={editDialogTab}
          onClose={() => setEditingApp(null)}
          onSuccess={fetchApps}
          onTabChange={setEditDialogTab}
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
