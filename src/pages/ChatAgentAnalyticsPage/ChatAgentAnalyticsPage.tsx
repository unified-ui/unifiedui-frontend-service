import type { FC } from 'react';
import { Stack, Title, Group } from '@mantine/core';
import { IconRobot } from '@tabler/icons-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ChatAgentAnalyticsPanel } from '../../components/common';

export const ChatAgentAnalyticsPage: FC = () => {
  return (
    <AdminLayout>
      <Stack gap="lg">
        <Group gap="xs">
          <IconRobot size={28} />
          <Title order={2}>Chat Agent Analytics</Title>
        </Group>
        <ChatAgentAnalyticsPanel showAgentPicker />
      </Stack>
    </AdminLayout>
  );
};
