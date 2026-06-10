import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Center, Loader, SimpleGrid, Stack } from '@mantine/core';
import { IconAlertCircle, IconMessage, IconThumbUp, IconAlertTriangle } from '@tabler/icons-react';
import { useIdentity } from '../../contexts';
import {
  KPICard,
  FeedbackInsights,
  DateRangeFilter,
  defaultDateRange,
  computeRangeFromPreset,
  type DateRangeValue,
  type DateRangePreset,
} from '../../components/common';
import { useUrlState } from '../../hooks/useUrlState';
import type { FeedbackStatsResponse, MessageStatsAggregate } from '../../api/types';

interface AnalyticsTabProps {
  chatAgentId: string;
}

export const AnalyticsTab: FC<AnalyticsTabProps> = ({ chatAgentId }) => {
  const { apiClient, selectedTenant } = useIdentity();
  const { get, set: setUrl } = useUrlState();
  const [messageStats, setMessageStats] = useState<MessageStatsAggregate | null>(null);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
    return defaultDateRange();
  });

  useEffect(() => {
    setUrl({
      preset: range.preset,
      from: range.preset === 'custom' ? range.from : null,
      to: range.preset === 'custom' ? range.to : null,
    });
  }, [range, setUrl]);

  const load = useCallback(async (): Promise<void> => {
    if (!apiClient || !selectedTenant) return;
    setLoading(true);
    setError(null);
    try {
      const from = range.from ? new Date(range.from).toISOString() : undefined;
      const to = range.to ? new Date(`${range.to}T23:59:59`).toISOString() : undefined;
      const [msgs, fb] = await Promise.all([
        apiClient.getMessageStats(selectedTenant.id, { chatAgentIds: [chatAgentId], from, to }),
        apiClient.getFeedbackStats(selectedTenant.id, { chatAgentIds: [chatAgentId], from, to }),
      ]);
      setMessageStats(msgs.aggregate);
      setFeedbackStats(fb.aggregate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [apiClient, selectedTenant, chatAgentId, range]);

  useEffect(() => {
    void load();
  }, [load]);

  const errorRate = messageStats && messageStats.total_messages > 0
    ? ((messageStats.failed_count / messageStats.total_messages) * 100).toFixed(1)
    : '0.0';

  const feedbackScore = feedbackStats?.score != null
    ? `${(feedbackStats.score * 100).toFixed(0)}%`
    : '—';

  return (
    <Stack gap={32}>
      <DateRangeFilter value={range} onChange={setRange} />

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
              value={messageStats?.total_messages ?? 0}
              icon={<IconMessage size={24} />}
              color="blue"
            />
            <KPICard
              label="Error Rate"
              value={`${errorRate}%`}
              icon={<IconAlertTriangle size={24} />}
              color={Number(errorRate) > 5 ? 'red' : 'green'}
              hint={
                messageStats
                  ? `${messageStats.failed_count} / ${messageStats.total_messages}`
                  : undefined
              }
            />
            <KPICard
              label="Feedback Score"
              value={feedbackScore}
              icon={<IconThumbUp size={24} />}
              color="teal"
              hint={
                feedbackStats
                  ? `${feedbackStats.thumbs_up} / ${feedbackStats.thumbs_down}`
                  : undefined
              }
            />
          </SimpleGrid>

          {feedbackStats && <FeedbackInsights stats={feedbackStats} />}
        </>
      )}
    </Stack>
  );
};
