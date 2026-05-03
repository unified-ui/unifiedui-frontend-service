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
  Code,
} from '@mantine/core';
import {
  IconRouter,
  IconAlertCircle,
  IconClock,
  IconCircleCheck,
  IconDatabase,
} from '@tabler/icons-react';
import { KPICard } from '../KPICard';
import { Sparkline } from '../Sparkline';
import { AnalyticsRangePicker } from '../AnalyticsRangePicker';
import { AnalyticsAgentPicker } from '../AnalyticsAgentPicker';
import { useAnalytics } from '../../../hooks';
import type { WorkflowAnalyticsResponse } from '../../../api/types';

interface WorkflowAnalyticsPanelProps {
  workflowId?: string;
  showAgentPicker?: boolean;
  toolbarExtras?: ReactNode;
}

export const WorkflowAnalyticsPanel: FC<WorkflowAnalyticsPanelProps> = ({
  workflowId,
  showAgentPicker = false,
  toolbarExtras,
}) => {
  const analytics = useAnalytics<WorkflowAnalyticsResponse>({
    resource: 'workflows',
    initialAgentIds: workflowId ? [workflowId] : [],
  });
  const { data, isLoading, error, range, agentIds, setRange, setAgentIds } = analytics;

  return (
    <Stack gap="lg">
      <Group gap="sm" justify="space-between" wrap="wrap">
        <AnalyticsRangePicker value={range} onChange={setRange} />
        <Group gap="sm">
          {showAgentPicker && !workflowId && (
            <AnalyticsAgentPicker
              value={agentIds}
              onChange={setAgentIds}
              resource="workflows"
              placeholder="All workflows"
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
            <KPICard label="Executions" value={data.total_executions} icon={<IconRouter size={16} />} />
            <KPICard
              label="Success Rate"
              value={`${(data.success_rate * 100).toFixed(1)}%`}
              icon={<IconCircleCheck size={16} />}
              color="green"
            />
            <KPICard
              label="Avg Duration"
              value={`${data.avg_duration_s.toFixed(2)} s`}
              icon={<IconClock size={16} />}
              color="orange"
            />
            <KPICard
              label="Tokens"
              value={data.kpis.total_tokens_input + data.kpis.total_tokens_output}
              icon={<IconDatabase size={16} />}
              color="violet"
            />
          </SimpleGrid>

          <Paper withBorder p="md" radius="md">
            <Text fw={600} mb="sm">
              Executions Trend
            </Text>
            <Sparkline
              data={data.executions_series.map((p) => p.executions)}
              width={600}
              height={100}
              color="var(--mantine-color-grape-6)"
              fillColor="var(--mantine-color-grape-1)"
            />
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Text fw={600} mb="sm">
              Recent Executions
            </Text>
            {data.recent_executions.length === 0 ? (
              <Text c="dimmed" size="sm">
                No executions yet.
              </Text>
            ) : (
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Timestamp</Table.Th>
                    <Table.Th>Workflow</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Latency (ms)</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.recent_executions.map((e) => (
                    <Table.Tr key={e.message_id}>
                      <Table.Td>
                        <Code>{new Date(e.timestamp).toLocaleString()}</Code>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" ff="monospace">
                          {e.workflow_id}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={e.status === 'SUCCESS' ? 'green' : 'red'} variant="light">
                          {e.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{e.latency_ms}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        </>
      )}
    </Stack>
  );
};
