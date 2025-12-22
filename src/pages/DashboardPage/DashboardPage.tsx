import type { FC } from 'react';
import { Title, Text, Stack, Paper, Group, Badge, Grid, Loader } from '@mantine/core';
import { IconBuildingCommunity, IconUser, IconClock } from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { useIdentity } from '../../contexts';

export const DashboardPage: FC = () => {
  const { user, selectedTenant, tenants, isLoading } = useIdentity();

  if (isLoading) {
    return (
      <MainLayout>
        <Stack align="center" justify="center" h="50vh">
          <Loader size="xl" />
          <Text c="dimmed">Lade Dashboard...</Text>
        </Stack>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Stack gap="lg">
        <div>
          <Title order={1}>Dashboard</Title>
          <Text c="dimmed">Willkommen zurück, {user?.display_name || 'Benutzer'}!</Text>
        </div>

        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper shadow="sm" p="lg" radius="md" withBorder>
              <Stack gap="xs">
                <Group gap="xs">
                  <IconUser size={20} />
                  <Text fw={500}>Benutzer</Text>
                </Group>
                <Text size="xl" fw={700}>{user?.display_name}</Text>
                <Text size="xs" c="dimmed">{user?.email}</Text>
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper shadow="sm" p="lg" radius="md" withBorder>
              <Stack gap="xs">
                <Group gap="xs">
                  <IconBuildingCommunity size={20} />
                  <Text fw={500}>Aktueller Tenant</Text>
                </Group>
                <Text size="xl" fw={700}>{selectedTenant?.name || 'Kein Tenant'}</Text>
                {selectedTenant && (
                  <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                    ID: {selectedTenant.id}
                  </Text>
                )}
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper shadow="sm" p="lg" radius="md" withBorder>
              <Stack gap="xs">
                <Group gap="xs">
                  <IconClock size={20} />
                  <Text fw={500}>Verfügbare Tenants</Text>
                </Group>
                <Text size="xl" fw={700}>{tenants.length}</Text>
                <Group gap="xs" mt="xs">
                  {tenants.slice(0, 3).map((tenant) => (
                    <Badge key={tenant.id} size="sm" variant="light">
                      {tenant.name}
                    </Badge>
                  ))}
                  {tenants.length > 3 && (
                    <Badge size="sm" variant="light" color="gray">
                      +{tenants.length - 3} weitere
                    </Badge>
                  )}
                </Group>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {selectedTenant && (
          <Paper shadow="sm" p="lg" radius="md" withBorder>
            <Stack gap="md">
              <Title order={3}>Tenant Details</Title>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Name:</Text>
                    <Text size="sm" c="dimmed">{selectedTenant.name}</Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Beschreibung:</Text>
                    <Text size="sm" c="dimmed">
                      {selectedTenant.description || 'Keine Beschreibung verfügbar'}
                    </Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Erstellt am:</Text>
                    <Text size="sm" c="dimmed">
                      {new Date(selectedTenant.created_at).toLocaleString('de-DE')}
                    </Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Zuletzt aktualisiert:</Text>
                    <Text size="sm" c="dimmed">
                      {new Date(selectedTenant.updated_at).toLocaleString('de-DE')}
                    </Text>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Stack>
          </Paper>
        )}

        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Title order={3}>Nächste Schritte</Title>
            <Text size="sm" c="dimmed">
              • Erstellen Sie Applications, um AI-Agenten zu verwalten
            </Text>
            <Text size="sm" c="dimmed">
              • Konfigurieren Sie Credentials für sichere API-Zugriffe
            </Text>
            <Text size="sm" c="dimmed">
              • Starten Sie Conversations mit Ihren AI-Agenten
            </Text>
            <Text size="sm" c="dimmed">
              • Richten Sie Autonomous Agents für Background-Tasks ein
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </MainLayout>
  );
};
