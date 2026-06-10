import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  Badge,
  Drawer,
  Group,
  Loader,
  Center,
  Pagination,
  Paper,
  Stack,
  Text,
  Table,
  Tooltip,
} from '@mantine/core';
import { LineChart } from '@mantine/charts';
import { IconThumbDown, IconUser, IconRobot, IconChartLine } from '@tabler/icons-react';
import type { FeedbackStatsResponse, RecentFeedbackEntry } from '../../../api/types';
import { useIdentity } from '../../../contexts';
import classes from './FeedbackInsights.module.css';

const PAGE_SIZE = 10;

interface FeedbackInsightsProps {
  stats: FeedbackStatsResponse;
}

const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const FeedbackInsights: FC<FeedbackInsightsProps> = ({ stats }) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [drawerLoading, setDrawerLoading] = useState<boolean>(false);
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [assistantMessage, setAssistantMessage] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<RecentFeedbackEntry | null>(null);
  const [page, setPage] = useState<number>(1);

  const totalPages = Math.ceil(stats.recent_negative.length / PAGE_SIZE);
  const paginatedItems = useMemo(
    () => stats.recent_negative.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [stats.recent_negative, page]
  );

  const chartData = useMemo(() => {
    if (!stats.timeline || stats.timeline.length === 0) return [];
    return stats.timeline.map((entry) => ({
      date: new Date(entry.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      score: entry.cumulative,
    }));
  }, [stats.timeline]);

  const openDrawerForFeedback = useCallback(
    async (fb: RecentFeedbackEntry): Promise<void> => {
      if (!apiClient || !selectedTenant) return;
      setSelectedFeedback(fb);
      setDrawerOpen(true);
      setDrawerLoading(true);
      setUserMessage(null);
      setAssistantMessage(null);
      try {
        const res = await apiClient.getMessageWithContext(
          selectedTenant.id,
          fb.conversation_id,
          fb.message_id
        );
        setAssistantMessage(res.message?.content ?? null);
        setUserMessage(res.userMessage?.content ?? null);
      } catch {
        setAssistantMessage('Failed to load messages.');
      } finally {
        setDrawerLoading(false);
      }
    },
    [apiClient, selectedTenant]
  );

  if (stats.total_feedbacks === 0) {
    return (
      <Paper p="md">
        <Text c="dimmed" size="sm">No feedback data available yet.</Text>
      </Paper>
    );
  }

  return (
    <>
      <Stack gap={48} className={classes.section}>
        {chartData.length > 1 && (
          <div style={{ width: '100%' }}>
            <Text className={classes.sectionTitle}>
              <IconChartLine size={16} />
              Feedback Score Over Time
            </Text>
            <div style={{ width: '100%', minWidth: 0, height: 220 }}>
              <LineChart
                h={220}
                w="100%"
                data={chartData}
                dataKey="date"
                series={[{ name: 'score', color: 'teal.6', label: 'Score' }]}
                curveType="linear"
                withDots={chartData.length < 50}
                gridAxis="y"
                yAxisProps={{ allowDecimals: false }}
                referenceLines={[{ y: 0, color: 'gray.5', label: '0' }]}
              />
            </div>
          </div>
        )}

        {stats.reason_breakdown.length > 0 && (
          <div>
            <Text className={classes.sectionTitle}>Negative Feedback Reasons</Text>
            <Group gap="xs" wrap="wrap">
              {stats.reason_breakdown.map((entry) => (
                <Tooltip key={entry.reason} label={`${entry.count} occurrences`}>
                  <Badge variant="light" color="red" size="lg" className={classes.reasonBadge}>
                    {entry.reason.replaceAll('_', ' ')} ({entry.count})
                  </Badge>
                </Tooltip>
              ))}
            </Group>
          </div>
        )}

        {stats.recent_negative.length > 0 && (
          <div>
            <Text className={classes.sectionTitle}>
              <IconThumbDown size={16} />
              Negative Feedbacks ({stats.recent_negative.length})
            </Text>
            <Table striped highlightOnHover className={classes.table}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 170 }}>Date</Table.Th>
                  <Table.Th style={{ width: 200 }}>Chat Agent</Table.Th>
                  <Table.Th>Reasons</Table.Th>
                  <Table.Th>Comment</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedItems.map((fb) => (
                  <Table.Tr
                    key={`${fb.message_id}-${fb.created_at}`}
                    className={classes.clickableRow}
                    onClick={() => {
                      void openDrawerForFeedback(fb);
                    }}
                  >
                    <Table.Td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(fb.created_at)}</Table.Td>
                    <Table.Td>
                      <Text size="sm" lineClamp={1}>
                        {fb.chat_agent_name ?? '—'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {fb.reasons.length > 0 ? (
                        <Group gap={4} wrap="wrap">
                          {fb.reasons.map((r) => (
                            <Badge key={r} size="xs" variant="outline" color="red">
                              {r.replaceAll('_', ' ')}
                            </Badge>
                          ))}
                        </Group>
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" lineClamp={2}>{fb.comment || '—'}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            {totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
              </Group>
            )}
          </div>
        )}
      </Stack>

      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Message Details"
        position="right"
        size="lg"
        zIndex={1000}
        scrollAreaComponent={undefined}
        styles={{
          body: { height: 'calc(100% - 60px)', overflowY: 'auto' },
          content: { display: 'flex', flexDirection: 'column' },
        }}
      >
        {drawerLoading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : (
          <Stack gap="md">
            {selectedFeedback && (
              <div className={classes.feedbackBlock}>
                <Group gap="xs" mb={4}>
                  <IconThumbDown size={14} />
                  <Text size="xs" fw={600}>Feedback</Text>
                  <Text size="xs" c="dimmed">{formatDateTime(selectedFeedback.created_at)}</Text>
                </Group>
                {selectedFeedback.chat_agent_name && (
                  <Text size="xs" c="dimmed" mb={4}>
                    Agent: {selectedFeedback.chat_agent_name}
                  </Text>
                )}
                {selectedFeedback.reasons.length > 0 && (
                  <Group gap={4} mb={4}>
                    {selectedFeedback.reasons.map((r) => (
                      <Badge key={r} size="xs" variant="outline" color="red">
                        {r.replaceAll('_', ' ')}
                      </Badge>
                    ))}
                  </Group>
                )}
                {selectedFeedback.comment && (
                  <Text size="sm" fs="italic">{selectedFeedback.comment}</Text>
                )}
              </div>
            )}
            {userMessage && (
              <Paper withBorder p="md" radius="md">
                <Group gap="xs" mb="xs">
                  <IconUser size={16} />
                  <Text fw={600} size="sm">User Message</Text>
                </Group>
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{userMessage}</Text>
              </Paper>
            )}
            {assistantMessage && (
              <Paper withBorder p="md" radius="md">
                <Group gap="xs" mb="xs">
                  <IconRobot size={16} />
                  <Text fw={600} size="sm">Assistant Response</Text>
                </Group>
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{assistantMessage}</Text>
              </Paper>
            )}
            {!userMessage && !assistantMessage && !drawerLoading && (
              <Text c="dimmed" size="sm">No messages found.</Text>
            )}
          </Stack>
        )}
      </Drawer>
    </>
  );
};
