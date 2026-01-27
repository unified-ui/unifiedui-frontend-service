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
                <Text size="xs" c="dimmed">{user?.mail}</Text>
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
                    <Text size="sm" fw={500}>Description:</Text>
                    <Text size="sm" c="dimmed">
                      {selectedTenant.description || 'No description available'}
                    </Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Created at:</Text>
                    <Text size="sm" c="dimmed">
                      {new Date(selectedTenant.created_at).toLocaleString('en-US')}
                    </Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Last updated:</Text>
                    <Text size="sm" c="dimmed">
                      {new Date(selectedTenant.updated_at).toLocaleString('en-US')}
                    </Text>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Stack>
          </Paper>
        )}

        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Title order={3}>Next Steps</Title>
            <Text size="sm" c="dimmed">
              • Create Applications to manage AI agents
            </Text>
            <Text size="sm" c="dimmed">
              • Configure Credentials for secure API access
            </Text>
            <Text size="sm" c="dimmed">
              • Start Conversations with your AI agents
            </Text>
            <Text size="sm" c="dimmed">
              • Set up Autonomous Agents for background tasks
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </MainLayout>
  );
};
