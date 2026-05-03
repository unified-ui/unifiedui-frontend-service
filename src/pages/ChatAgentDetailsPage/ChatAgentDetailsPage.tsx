import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Stack,
  Group,
  Title,
  Text,
  Badge,
  Button,
  Loader,
  Center,
  Alert,
  Menu,
  ActionIcon,
  Paper,
  SimpleGrid,
  Code,
  CopyButton,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconCheck,
  IconCopy,
  IconDots,
  IconEdit,
  IconMessage,
  IconShieldLock,
} from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import {
  Breadcrumbs,
  EntityAvatar,
  ContentCard,
  ChatAgentAnalyticsPanel,
} from '../../components/common';
import { EditChatAgentDialog } from '../../components/dialogs/EditChatAgentDialog';
import type { EditDialogTab } from '../../components/dialogs/EditChatAgentDialog';
import { useIdentity, useRecentVisits } from '../../contexts';
import { useDialogParams } from '../../hooks';
import type { ChatAgentResponse } from '../../api/types';
import classes from './ChatAgentDetailsPage.module.css';

export const ChatAgentDetailsPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { apiClient, selectedTenant } = useIdentity();
  const { trackVisit } = useRecentVisits();
  const { dialog, openDialog, closeDialog } = useDialogParams();
  const [editTab, setEditTab] = useState<EditDialogTab>('details');

  const [agent, setAgent] = useState<ChatAgentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!id || !selectedTenant) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getChatAgent(selectedTenant.id, id);
      setAgent(result);
      trackVisit({
        resource_type: 'chat-agent',
        resource_id: result.id,
        resource_name: result.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat agent');
    } finally {
      setLoading(false);
    }
  }, [apiClient, selectedTenant, id, trackVisit]);

  useEffect(() => {
    void load();
  }, [load]);

  const embedSnippet = useMemo(() => {
    if (!agent) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-unifiedui-domain';
    return `<iframe
  src="${origin}/embed/chat/${agent.id}"
  width="420"
  height="600"
  style="border:0;border-radius:12px;"
  title="${agent.name}"
></iframe>`;
  }, [agent]);

  const handleChatWithAgent = useCallback((): void => {
    if (!agent) return;
    navigate(`/conversations?agent=${agent.id}&selected=${agent.id}`);
  }, [agent, navigate]);

  if (loading) {
    return (
      <MainLayout>
        <Center h="60vh">
          <Loader />
        </Center>
      </MainLayout>
    );
  }

  if (error || !agent) {
    return (
      <MainLayout>
        <Stack gap="md" p="md">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/chat-agents')}
            style={{ alignSelf: 'flex-start' }}
          >
            Back to Chat Agents
          </Button>
          <Alert color="red" icon={<IconAlertCircle size={16} />}>
            {error || 'Chat agent not found'}
          </Alert>
        </Stack>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={classes.scrollWrapper}>
        <Stack gap="lg" className={classes.root} p="md">
          <Breadcrumbs
            items={[
              { label: 'Chat Agents', to: '/chat-agents' },
              { label: agent.name },
            ]}
          />

          <Group justify="space-between" align="flex-start" className={classes.header} wrap="nowrap">
            <Group gap="md" align="center" wrap="nowrap">
              <EntityAvatar entityType="chat-agent" size="lg" colored />
              <Stack gap={4}>
                <Title order={2}>{agent.name}</Title>
                <Group gap="xs">
                  <Badge variant="light">{agent.type}</Badge>
                  <Badge variant="light" color={agent.is_active ? 'green' : 'gray'}>
                    {agent.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {agent.tags.map((tag) => (
                    <Badge key={tag.id} variant="dot">
                      {tag.name}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </Group>
            <Group gap="sm">
              <Button
                leftSection={<IconMessage size={16} />}
                onClick={handleChatWithAgent}
              >
                Chat with Agent
              </Button>
              <Menu position="bottom-end" withinPortal>
                <Menu.Target>
                  <ActionIcon variant="light" size="lg">
                    <IconDots size={18} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconEdit size={14} />}
                    onClick={() => { setEditTab('details'); openDialog('edit'); }}
                  >
                    Edit
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconShieldLock size={14} />}
                    onClick={() => { setEditTab('iam'); openDialog('edit'); }}
                  >
                    Manage Access
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>

          <ContentCard title="Info">
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  Type
                </Text>
                <Text size="sm">{agent.type}</Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  Status
                </Text>
                <Text size="sm">{agent.is_active ? 'Active' : 'Inactive'}</Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  Created
                </Text>
                <Text size="sm">{new Date(agent.created_at).toLocaleString()}</Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  Updated
                </Text>
                <Text size="sm">{new Date(agent.updated_at).toLocaleString()}</Text>
              </Stack>
              {agent.description && (
                <Stack gap={2} style={{ gridColumn: '1 / -1' }}>
                  <Text size="xs" c="dimmed">
                    Description
                  </Text>
                  <Text size="sm">{agent.description}</Text>
                </Stack>
              )}
            </SimpleGrid>
          </ContentCard>

          <ContentCard title="Analytics">
            <ChatAgentAnalyticsPanel agentId={agent.id} />
          </ContentCard>

          <Paper withBorder p="md" radius="md" className={classes.embedSection}>
            <Group justify="space-between" mb="sm">
              <Text fw={600}>Embed Snippet</Text>
              <CopyButton value={embedSnippet}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied!' : 'Copy'}>
                    <ActionIcon variant="light" onClick={copy}>
                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
            <Code block>{embedSnippet}</Code>
          </Paper>
        </Stack>
      </div>

      {dialog === 'edit' && (
        <EditChatAgentDialog
          opened
          onClose={() => closeDialog()}
          chatAgentId={agent.id}
          initialData={agent}
          initialTab={editTab}
          onTabChange={setEditTab}
          onSuccess={() => {
            closeDialog();
            void load();
          }}
        />
      )}
      {dialog === 'access' && (
        <EditChatAgentDialog
          opened
          onClose={() => closeDialog()}
          chatAgentId={agent.id}
          initialData={agent}
          initialTab="iam"
          onSuccess={() => {
            closeDialog();
            void load();
          }}
        />
      )}
    </MainLayout>
  );
};
