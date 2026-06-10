import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Anchor,
  Center,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Title,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconLayoutDashboard,
  IconMessage,
  IconThumbUp,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { KPICard } from '../../components/common';
import { useIdentity } from '../../contexts';
import type { FeedbackStatsResponse, MessageStatsAggregate } from '../../api/types';

export const AdminDashboardPage: FC = () => {
  const { apiClient, selectedTenant } = useIdentity();
  const [messageStats, setMessageStats] = useState<MessageStatsAggregate | null>(null);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!apiClient || !selectedTenant) return;
    setLoading(true);
    setError(null);
    try {
      const [msgs, fb] = await Promise.all([
        apiClient.getMessageStats(selectedTenant.id),
        apiClient.getFeedbackStats(selectedTenant.id),
      ]);
      setMessageStats(msgs.aggregate);
      setFeedbackStats(fb.aggregate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [apiClient, selectedTenant]);

  useEffect(() => {
    void load();
  }, [load]);

  const errorRate =
    messageStats && messageStats.total_messages > 0
      ? ((messageStats.failed_count / messageStats.total_messages) * 100).toFixed(1)
      : '0.0';

  const feedbackScore =
    feedbackStats?.score != null ? `${(feedbackStats.score * 100).toFixed(0)}%` : '—';

  return (
    <AdminLayout>
      <Stack gap="lg">
        <Group gap="xs">
          <IconLayoutDashboard size={28} />
          <Title order={2}>Admin Overview</Title>
        </Group>

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
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <KPICard
                label="Total Messages"
                value={messageStats?.total_messages ?? 0}
                icon={<IconMessage size={18} />}
                color="blue"
              />
              <KPICard
                label="Error Rate"
                value={`${errorRate}%`}
                icon={<IconAlertTriangle size={18} />}
                color={Number(errorRate) > 5 ? 'red' : 'green'}
                hint={`${messageStats?.failed_count ?? 0} failed`}
              />
              <KPICard
                label="Feedback Score"
                value={feedbackScore}
                icon={<IconThumbUp size={18} />}
                color="teal"
                hint={
                  feedbackStats
                    ? `${feedbackStats.thumbs_up} positive / ${feedbackStats.thumbs_down} negative`
                    : undefined
                }
              />
            </SimpleGrid>

            <Anchor component={Link} to="/admin/analytics" size="sm">
              View detailed analytics →
            </Anchor>
          </>
        )}
      </Stack>
    </AdminLayout>
  );
};
