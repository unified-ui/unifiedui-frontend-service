import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  ActionIcon,
  SimpleGrid,
  Code,
  Tooltip,
  Tabs,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconChartBar,
  IconCode,
  IconEdit,
  IconInfoCircle,
  IconMessage,
} from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import {
  Breadcrumbs,
  ContentCard,
  DelayedTooltip,
  EntityAvatar,
  AccessDeniedBanner,
} from '../../components/common';
import { EditChatAgentDialog } from '../../components/dialogs/EditChatAgentDialog';
import type { EditDialogTab } from '../../components/dialogs/EditChatAgentDialog';
import { useIdentity, useRecentVisits } from '../../contexts';
import { useDialogParams } from '../../hooks';
import type { ChatAgentResponse } from '../../api/types';
import { PermissionError } from '../../api/errors';
import { AnalyticsTab } from './AnalyticsTab';
import { EmbedTab } from './EmbedTab';
import classes from './ChatAgentDetailsPage.module.css';

type PageTab = 'overview' | 'analytics' | 'embed';


export const ChatAgentDetailsPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { apiClient, selectedTenant } = useIdentity();
  const { trackVisit } = useRecentVisits();
  const { dialog, openDialog, closeDialog } = useDialogParams();
  const [editTab, setEditTab] = useState<EditDialogTab>('details');

  const activeTab: PageTab = (searchParams.get('tab') as PageTab) || 'overview';
  const setActiveTab = useCallback(
    (tab: string | null) => {
      if (!tab) return;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        return next;
      });
    },
    [setSearchParams]
  );

  const [agent, setAgent] = useState<ChatAgentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<PermissionError | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!id || !selectedTenant) return;
    setLoading(true);
    setError(null);
    setPermissionError(null);
    try {
      const result = await apiClient.getChatAgent(selectedTenant.id, id);
      setAgent(result);
      trackVisit({
        resource_type: 'chat-agent',
        resource_id: result.id,
        resource_name: result.name,
      });
    } catch (err) {
      if (err instanceof PermissionError) {
        setPermissionError(err);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load chat agent');
      }
    } finally {
      setLoading(false);
    }
  }, [apiClient, selectedTenant, id, trackVisit]);

  useEffect(() => {
    void load();
  }, [load]);

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

  if (permissionError) {
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
          <AccessDeniedBanner requiredRoles={permissionError.requiredRoles} />
        </Stack>
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
      <Breadcrumbs
        items={[
          { label: 'Chat Agents', path: '/chat-agents' },
          { label: agent.name },
        ]}
      />

      <div className={classes.header}>
        <Group gap="sm" mb="xs" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <EntityAvatar entityType="chat-agent" size="md" colored />
            <Title order={2} className={classes.title}>{agent.name}</Title>
            <Tooltip label="Edit">
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => { setEditTab('details'); openDialog('edit'); }}
              >
                <IconEdit size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
          <Group gap="sm">
            <Button
              leftSection={<IconMessage size={16} />}
              onClick={handleChatWithAgent}
            >
              Chat with Agent
            </Button>
          </Group>
        </Group>

        {agent.description ? (
          <DelayedTooltip label={agent.description}>
            <Text size="sm" c="dimmed" className={classes.description} ml={46}>
              {agent.description}
            </Text>
          </DelayedTooltip>
        ) : (
          <Text size="sm" c="dimmed" fs="italic" ml={46}>
            No description
          </Text>
        )}

        <Group gap="xs" mt="sm" ml={46}>
          <Badge variant="filled" size="sm" color="blue">
            {agent.type}
          </Badge>
          {agent.tags.map((tag) => (
            <Badge key={tag.id} variant="light" size="sm" color="gray">
              {tag.name}
            </Badge>
          ))}
          <Badge
            variant="dot"
            size="sm"
            color={agent.is_active ? 'green' : 'gray'}
          >
            {agent.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </Group>
      </div>

      <Tabs value={activeTab} onChange={setActiveTab} className={classes.tabs} keepMounted={false}>
        <Tabs.List className={classes.tabsList}>
          <Tabs.Tab value="overview" leftSection={<IconInfoCircle size={16} />} className={classes.tab}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="analytics" leftSection={<IconChartBar size={16} />} className={classes.tab}>
            Analytics
          </Tabs.Tab>
          <Tabs.Tab value="embed" leftSection={<IconCode size={16} />} className={classes.tab}>
            Embed
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" className={classes.tabPanel}>
          <ContentCard title="Info">
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Stack gap={2}>
                <Text size="xs" c="dimmed">Type</Text>
                <Text size="sm">{agent.type}</Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" c="dimmed">Status</Text>
                <Text size="sm">{agent.is_active ? 'Active' : 'Inactive'}</Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" c="dimmed">Created</Text>
                <Text size="sm">{new Date(agent.created_at).toLocaleString()}</Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" c="dimmed">Updated</Text>
                <Text size="sm">{new Date(agent.updated_at).toLocaleString()}</Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" c="dimmed">AI Models</Text>
                <Text size="sm">
                  {agent.ai_model_ids && agent.ai_model_ids.length > 0
                    ? `${agent.ai_model_ids.length} model(s) configured`
                    : '—'}
                </Text>
              </Stack>
              <Stack gap={2}>
                <Text size="xs" c="dimmed">Tools</Text>
                <Text size="sm">
                  {agent.tool_ids && agent.tool_ids.length > 0
                    ? `${agent.tool_ids.length} tool(s) configured`
                    : '—'}
                </Text>
              </Stack>
              <Stack gap={2} style={{ gridColumn: '1 / -1' }}>
                <Text size="xs" c="dimmed">System Prompt</Text>
                {agent.system_prompt ? (
                  <Code block style={{ maxHeight: 200, overflow: 'auto' }}>{agent.system_prompt}</Code>
                ) : (
                  <Text size="sm">—</Text>
                )}
              </Stack>
              <Stack gap={2} style={{ gridColumn: '1 / -1' }}>
                <Text size="xs" c="dimmed">Greeting Messages</Text>
                {agent.greeting_messages && agent.greeting_messages.length > 0 ? (
                  agent.greeting_messages.map((msg, idx) => (
                    <Text key={idx} size="sm">• {msg}</Text>
                  ))
                ) : (
                  <Text size="sm">—</Text>
                )}
              </Stack>
            </SimpleGrid>
          </ContentCard>
        </Tabs.Panel>

        <Tabs.Panel value="analytics" className={classes.tabPanel}>
          <AnalyticsTab chatAgentId={agent.id} />
        </Tabs.Panel>

        <Tabs.Panel value="embed" className={classes.tabPanel}>
          <EmbedTab agent={agent} />
        </Tabs.Panel>
      </Tabs>

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
