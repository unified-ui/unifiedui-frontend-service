import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Center,
  Group,
  Loader,
  MultiSelect,
  SimpleGrid,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconAlertCircle, IconAlertTriangle, IconChartBar, IconMessage, IconThumbUp } from '@tabler/icons-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import {
  KPICard,
  FeedbackInsights,
  DateRangeFilter,
  defaultDateRange,
  computeRangeFromPreset,
  AccessDeniedBanner,
  type DateRangeValue,
  type DateRangePreset,
} from '../../components/common';
import { useIdentity } from '../../contexts';
import { usePermissions } from '../../hooks';
import { useUrlState } from '../../hooks/useUrlState';
import type {
  ChatAgentResponse,
  FeedbackStatsResponse,
  FeedbackStatsPerAgent,
  MessageStatsAggregate,
  MessageStatsPerAgent,
} from '../../api/types';
import classes from './AdminAnalyticsPage.module.css';

interface AgentRow {
  agent: ChatAgentResponse;
  messageStats: MessageStatsPerAgent | null;
  feedbackStats: FeedbackStatsPerAgent | null;
}

export const AdminAnalyticsPage: FC = () => {
  const { apiClient, selectedTenant } = useIdentity();
  const { isGlobalAdmin } = usePermissions();
  const { get, getAll, set: setUrl } = useUrlState();

  const [agentSearch, setAgentSearch] = useState<string>('');
  const [debouncedAgentSearch] = useDebouncedValue(agentSearch, 300);
  const [agentOptions, setAgentOptions] = useState<ChatAgentResponse[]>([]);
  const [agentLookup, setAgentLookup] = useState<Map<string, ChatAgentResponse>>(new Map());
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(() => getAll('agents'));
  const [range, setRange] = useState<DateRangeValue>(() => {
    const preset = (get('preset') as DateRangePreset | null) ?? null;
    const from = get('from');
    const to = get('to');
    if (preset && preset !== 'custom') {
      return computeRangeFromPreset(preset, from ?? '', to ?? '');
    }
    if (preset === 'custom' && from && to) {
      return { preset: 'custom', from, to };
    }
    if (from && to) {
      return { preset: 'custom', from, to };
    }
    return defaultDateRange();
  });
  const [aggregateMessages, setAggregateMessages] = useState<MessageStatsAggregate | null>(null);
  const [aggregateFeedback, setAggregateFeedback] = useState<FeedbackStatsResponse | null>(null);
  const [perAgentMessages, setPerAgentMessages] = useState<MessageStatsPerAgent[]>([]);
  const [perAgentFeedback, setPerAgentFeedback] = useState<FeedbackStatsPerAgent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTenant) return;
    let cancelled = false;
    void apiClient
      .listChatAgents(selectedTenant.id, {
        limit: 50,
        order_by: 'name',
        order_direction: 'asc',
        name: debouncedAgentSearch || undefined,
        fields: 'id,name,is_active',
      })
      .then((res) => {
        if (cancelled) return;
        const list = res as ChatAgentResponse[];
        setAgentOptions(list);
        setAgentLookup((prev) => {
          const next = new Map(prev);
          list.forEach((a) => next.set(a.id, a));
          return next;
        });
      });
    return () => {
      cancelled = true;
    };
  }, [apiClient, selectedTenant, debouncedAgentSearch]);

  useEffect(() => {
    if (!selectedTenant || selectedAgentIds.length === 0) return;
    const missing = selectedAgentIds.filter((id) => !agentLookup.has(id));
    if (missing.length === 0) return;
    let cancelled = false;
    void Promise.all(
      missing.map((id) =>
        apiClient.getChatAgent(selectedTenant.id, id).catch(() => null)
      )
    ).then((results) => {
      if (cancelled) return;
      setAgentLookup((prev) => {
        const next = new Map(prev);
        results.forEach((agent) => {
          if (agent) next.set(agent.id, agent);
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [apiClient, selectedTenant, selectedAgentIds, agentLookup]);

  useEffect(() => {
    setUrl({
      agents: selectedAgentIds,
      preset: range.preset,
      from: range.preset === 'custom' ? range.from : null,
      to: range.preset === 'custom' ? range.to : null,
    });
  }, [selectedAgentIds, range, setUrl]);

  const handleSelectedAgents = useCallback((ids: string[]) => {
    setSelectedAgentIds(ids);
  }, []);

  const load = useCallback(async (): Promise<void> => {
    if (!selectedTenant) return;
    setLoading(true);
    setError(null);
    try {
      const from = range.from ? new Date(range.from).toISOString() : undefined;
      const to = range.to ? new Date(`${range.to}T23:59:59`).toISOString() : undefined;
      const chatAgentIds = selectedAgentIds.length > 0 ? selectedAgentIds : undefined;

      const [msgs, fb] = await Promise.all([
        apiClient.getMessageStats(selectedTenant.id, { chatAgentIds, from, to }),
        apiClient.getFeedbackStats(selectedTenant.id, { chatAgentIds, from, to }),
      ]);

      setAggregateMessages(msgs.aggregate);
      setAggregateFeedback(fb.aggregate);
      setPerAgentMessages(msgs.per_agent);
      setPerAgentFeedback(fb.per_agent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [apiClient, selectedTenant, selectedAgentIds, range]);

  useEffect(() => {
    void load();
  }, [load]);

  const agentRows = useMemo<AgentRow[]>(() => {
    const messageById = new Map(perAgentMessages.map((m) => [m.chat_agent_id, m]));
    const feedbackById = new Map(perAgentFeedback.map((f) => [f.chat_agent_id, f]));
    const allIds = new Set<string>([...messageById.keys(), ...feedbackById.keys()]);
    const rows: AgentRow[] = [];
    allIds.forEach((id) => {
      const agent = agentLookup.get(id);
      if (!agent) return;
      rows.push({
        agent,
        messageStats: messageById.get(id) ?? null,
        feedbackStats: feedbackById.get(id) ?? null,
      });
    });
    rows.sort((a, b) => a.agent.name.localeCompare(b.agent.name));
    return rows;
  }, [perAgentMessages, perAgentFeedback, agentLookup]);

  const multiSelectData = useMemo(() => {
    const seen = new Map<string, string>();
    selectedAgentIds.forEach((id) => {
      const agent = agentLookup.get(id);
      if (agent) seen.set(id, agent.name);
    });
    agentOptions.forEach((a) => seen.set(a.id, a.name));
    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [agentOptions, agentLookup, selectedAgentIds]);

  const errorRate = useMemo(() => {
    if (aggregateMessages && aggregateMessages.total_messages > 0) {
      return ((aggregateMessages.failed_count / aggregateMessages.total_messages) * 100).toFixed(1);
    }
    return '0.0';
  }, [aggregateMessages]);

  const feedbackScore = aggregateFeedback?.score != null
    ? `${(aggregateFeedback.score * 100).toFixed(0)}%`
    : '—';

  return (
    <AdminLayout>
      {!isGlobalAdmin ? (
        <AccessDeniedBanner requiredRoles={['TENANT_GLOBAL_ADMIN']} />
      ) : (
      <div className={classes.pageLayout}>
        <div className={classes.header}>
          <Group gap="xs">
            <IconChartBar size={28} />
            <Title order={2}>Analytics</Title>
          </Group>

          <Group gap="md" align="flex-end" wrap="wrap" mt="lg">
            <MultiSelect
              data={multiSelectData}
              value={selectedAgentIds}
              onChange={handleSelectedAgents}
              searchValue={agentSearch}
              onSearchChange={setAgentSearch}
              placeholder="Select agents"
              clearable
              searchable
              filter={({ options }) => options}
              className={classes.filter}
            />
            <DateRangeFilter value={range} onChange={setRange} />
          </Group>
        </div>

        <div className={classes.scrollArea}>
          {loading && (
            <Center py="xl">
              <Loader />
            </Center>
          )}

          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />}>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <>
              <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md">
                <KPICard
                  label="Messages"
                  value={aggregateMessages?.total_messages ?? 0}
                  icon={<IconMessage size={24} />}
                  color="blue"
                />
                <KPICard
                  label="Error Rate"
                  value={`${errorRate}%`}
                  icon={<IconAlertTriangle size={24} />}
                  color={Number(errorRate) > 5 ? 'red' : 'green'}
                  hint={
                    aggregateMessages
                      ? `${aggregateMessages.failed_count} / ${aggregateMessages.total_messages}`
                      : undefined
                  }
                />
                <KPICard
                  label="Feedback Score"
                  value={feedbackScore}
                  icon={<IconThumbUp size={24} />}
                  color="teal"
                  hint={
                    aggregateFeedback
                      ? `${aggregateFeedback.thumbs_up} / ${aggregateFeedback.thumbs_down}`
                      : undefined
                  }
                />
              </SimpleGrid>

              {agentRows.length > 1 && (
                <Table striped highlightOnHover mt="xl">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Agent</Table.Th>
                      <Table.Th>Messages</Table.Th>
                      <Table.Th>Error Rate</Table.Th>
                      <Table.Th>Feedback Score</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {agentRows.map((row) => {
                      const rowErrorRate =
                        row.messageStats && row.messageStats.total_messages > 0
                          ? ((row.messageStats.failed_count / row.messageStats.total_messages) * 100).toFixed(1)
                          : '0.0';
                      const rowScore =
                        row.feedbackStats?.score != null
                          ? `${(row.feedbackStats.score * 100).toFixed(0)}%`
                          : '—';
                      return (
                        <Table.Tr key={row.agent.id}>
                          <Table.Td>
                            <Text size="sm" fw={500}>{row.agent.name}</Text>
                          </Table.Td>
                          <Table.Td>{row.messageStats?.total_messages ?? '—'}</Table.Td>
                          <Table.Td>{rowErrorRate}%</Table.Td>
                          <Table.Td>{rowScore}</Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              )}

              {aggregateFeedback && <FeedbackInsights stats={aggregateFeedback} />}
            </>
          )}
        </div>
      </div>
      )}
    </AdminLayout>
  );
};
