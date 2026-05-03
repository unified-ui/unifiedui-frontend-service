import type { FC, ReactNode } from 'react';
import {
  Stack,
  Group,
  Loader,
  Center,
  Alert,
  Paper,
  Text,
  Table,
  Badge,
  SimpleGrid,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconClock,
  IconMessage,
  IconDatabase,
  IconThumbUp,
} from '@tabler/icons-react';
import { KPICard } from '../KPICard';
import { Sparkline } from '../Sparkline';
import { AnalyticsRangePicker } from '../AnalyticsRangePicker';
import { AnalyticsAgentPicker } from '../AnalyticsAgentPicker';
import { useAnalytics } from '../../../hooks';
import type { ChatAgentAnalyticsResponse } from '../../../api/types';

interface ChatAgentAnalyticsPanelProps {
  agentId?: string;
  showAgentPicker?: boolean;
  toolbarExtras?: ReactNode;
}

export const ChatAgentAnalyticsPanel: FC<ChatAgentAnalyticsPanelProps> = ({
  agentId,
  showAgentPicker = false,
  toolbarExtras,
}) => {
  const { data, isLoading, error, range, agentIds, setRange, setAgentIds } = useAnalytics<ChatAgentAnalyticsResponse>({
    resource: 'chat-agents',
    initialAgentIds: agentId ? [agentId] : [],
  });

  return (
    <Stack gap="lg">
      <Group gap="sm" justify="space-between" wrap="wrap">
        <AnalyticsRangePicker value={range} onChange={setRange} />
        <Group gap="sm">
          {showAgentPicker && !agentId && (
            <AnalyticsAgentPicker
              value={agentIds}
              onChange={setAgentIds}
              resource="chat-agents"
              placeholder="All agents"
            />
          )}
          {toolbarExtras}
        </Group>
      </Group>

      {error && (
        <Alert color="red" icon={<IconAlertCircle size={16} />}>
          {error.message || 'Failed to load analytics'}
        </Alert>
      )}

      {isLoading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : !data ? (
        <Text c="dimmed">No data.</Text>
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
            <KPICard label="Messages" value={data.kpis.total_messages} icon={<IconMessage size={16} />} />
            <KPICard
              label="Tokens In"
              value={data.kpis.total_tokens_input}
              icon={<IconDatabase size={16} />}
              color="violet"
            />
            <KPICard
              label="Tokens Out"
              value={data.kpis.total_tokens_output}
              icon={<IconDatabase size={16} />}
              color="indigo"
            />
            <KPICard
              label="Feedback Score"
              value={data.kpis.feedback_score == null ? '—' : `${(data.kpis.feedback_score * 100).toFixed(0)}%`}
              icon={<IconThumbUp size={16} />}
              color="green"
            />
            <KPICard
              label="Avg Latency"
              value={`${Math.round(data.kpis.avg_latency_ms)} ms`}
              icon={<IconClock size={16} />}
              color="orange"
            />
            <KPICard
              label="Error Rate"
              value={`${(data.kpis.error_rate * 100).toFixed(1)}%`}
              icon={<IconAlertCircle size={16} />}
              color="red"
            />
          </SimpleGrid>

          <Paper withBorder p="md" radius="md">
            <Text fw={600} mb="sm">
              Token Series (input)
            </Text>
            <Sparkline data={data.token_series.map((p) => p.tokens_in)} width={600} height={100} />
          </Paper>

          {!agentId && (
            <Paper withBorder p="md" radius="md">
              <Text fw={600} mb="sm">
                Top Agents by Tokens
              </Text>
              {data.top_agents_by_tokens.length === 0 ? (
                <Text c="dimmed" size="sm">
                  No data.
                </Text>
              ) : (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Agent ID</Table.Th>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Total Tokens</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {data.top_agents_by_tokens.map((a) => (
                      <Table.Tr key={a.agent_id}>
                        <Table.Td>
                          <Text size="xs" ff="monospace">
                            {a.agent_id}
                          </Text>
                        </Table.Td>
                        <Table.Td>{a.name ?? '—'}</Table.Td>
                        <Table.Td>{a.total_tokens}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>
          )}

          <Paper withBorder p="md" radius="md">
            <Text fw={600} mb="sm">
              Feedback Breakdown
            </Text>
            {data.feedback_breakdown.length === 0 ? (
              <Text c="dimmed" size="sm">
                No feedback received.
              </Text>
            ) : (
              <Stack gap="xs">
                {data.feedback_breakdown.map((f, idx) => (
                  <Group key={idx} justify="space-between">
                    <Group gap="xs">
                      <Badge color={f.rating === 'THUMBS_UP' ? 'green' : 'red'} variant="light">
                        {f.rating}
                      </Badge>
                      <Text size="sm">{f.reasons.length > 0 ? f.reasons.join(', ') : '—'}</Text>
                    </Group>
                    <Text fw={600}>{f.count}</Text>
                  </Group>
                ))}
              </Stack>
            )}
          </Paper>
        </>
      )}
    </Stack>
  );
};
