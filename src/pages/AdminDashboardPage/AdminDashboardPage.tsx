import type { FC } from 'react';
import { useEffect, useState, useCallback } from 'react';
import {
  Stack,
  Title,
  Text,
  Group,
  Loader,
  Center,
  Alert,
  Paper,
  SimpleGrid,
} from '@mantine/core';
import {
  IconLayoutDashboard,
  IconAlertCircle,
  IconRobot,
  IconRouter,
  IconClock,
  IconCircleCheck,
  IconMessage,
  IconDatabase,
} from '@tabler/icons-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { KPICard } from '../../components/common/KPICard';
import { Sparkline } from '../../components/common/Sparkline';
import { useIdentity } from '../../contexts';
import type {
  ChatAgentAnalyticsResponse,
  WorkflowAnalyticsResponse,
} from '../../api/types';

export const AdminDashboardPage: FC = () => {
  const { apiClient, selectedTenant } = useIdentity();
  const [chatStats, setChatStats] = useState<ChatAgentAnalyticsResponse | null>(null);
  const [workflowStats, setWorkflowStats] = useState<WorkflowAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!selectedTenant) return;
    setLoading(true);
    setError(null);
    try {
      const [chat, wf] = await Promise.all([
        apiClient.getChatAgentAnalytics(selectedTenant.id),
        apiClient.getWorkflowAnalytics(selectedTenant.id),
      ]);
      setChatStats(chat);
      setWorkflowStats(wf);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [apiClient, selectedTenant]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminLayout>
      <Stack gap="lg">
        <Group gap="xs">
          <IconLayoutDashboard size={28} />
          <Title order={2}>Admin Overview</Title>
        </Group>
        <Text c="dimmed" size="sm">Aggregated activity across the tenant for the last 30 days.</Text>

        {error && <Alert color="red" icon={<IconAlertCircle size={16} />}>{error}</Alert>}

        {loading ? (
          <Center p="xl"><Loader /></Center>
        ) : (
          <>
            <Title order={4}>Chat Agents</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <KPICard
                label="Messages"
                value={chatStats?.kpis.total_messages ?? 0}
                icon={<IconMessage size={16} />}
              />
              <KPICard
                label="Tokens (in/out)"
                value={`${chatStats?.kpis.total_tokens_input ?? 0} / ${chatStats?.kpis.total_tokens_output ?? 0}`}
                icon={<IconDatabase size={16} />}
                color="violet"
              />
              <KPICard
                label="Avg Latency"
                value={`${Math.round(chatStats?.kpis.avg_latency_ms ?? 0)} ms`}
                icon={<IconClock size={16} />}
                color="orange"
              />
              <KPICard
                label="Error Rate"
                value={`${((chatStats?.kpis.error_rate ?? 0) * 100).toFixed(1)}%`}
                icon={<IconAlertCircle size={16} />}
                color="red"
              />
            </SimpleGrid>

            <Title order={4} mt="lg">Workflows</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <KPICard
                label="Executions"
                value={workflowStats?.total_executions ?? 0}
                icon={<IconRouter size={16} />}
              />
              <KPICard
                label="Success Rate"
                value={`${((workflowStats?.success_rate ?? 0) * 100).toFixed(1)}%`}
                icon={<IconCircleCheck size={16} />}
                color="green"
              />
              <KPICard
                label="Avg Duration"
                value={`${(workflowStats?.avg_duration_s ?? 0).toFixed(2)} s`}
                icon={<IconClock size={16} />}
                color="orange"
              />
              <KPICard
                label="Tokens"
                value={(workflowStats?.kpis.total_tokens_input ?? 0) + (workflowStats?.kpis.total_tokens_output ?? 0)}
                icon={<IconDatabase size={16} />}
                color="violet"
              />
            </SimpleGrid>

            <Paper withBorder p="md" radius="md" mt="lg">
              <Group gap="xs" mb="sm">
                <IconRobot size={18} />
                <Text fw={600}>Chat Agents — Token Trend (input)</Text>
              </Group>
              <Sparkline data={(chatStats?.token_series ?? []).map((p) => p.tokens_in)} width={500} height={80} />
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Group gap="xs" mb="sm">
                <IconRouter size={18} />
                <Text fw={600}>Workflows — Executions Trend</Text>
              </Group>
              <Sparkline
                data={(workflowStats?.executions_series ?? []).map((p) => p.executions)}
                width={500}
                height={80}
                color="var(--mantine-color-grape-6)"
                fillColor="var(--mantine-color-grape-1)"
              />
            </Paper>
          </>
        )}
      </Stack>
    </AdminLayout>
  );
};
