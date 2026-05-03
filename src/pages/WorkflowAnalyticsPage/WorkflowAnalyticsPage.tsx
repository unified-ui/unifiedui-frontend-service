import type { FC } from 'react';
import { Stack, Title, Group } from '@mantine/core';
import { IconRouter } from '@tabler/icons-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { WorkflowAnalyticsPanel } from '../../components/common';

export const WorkflowAnalyticsPage: FC = () => {
  return (
    <AdminLayout>
      <Stack gap="lg">
        <Group gap="xs">
          <IconRouter size={28} />
          <Title order={2}>Workflow Analytics</Title>
        </Group>
        <WorkflowAnalyticsPanel showAgentPicker />
      </Stack>
    </AdminLayout>
  );
};
