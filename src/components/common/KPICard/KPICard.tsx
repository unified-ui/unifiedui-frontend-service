import type { FC, ReactNode } from 'react';
import { Paper, Stack, Text, Group, ThemeIcon } from '@mantine/core';

interface KPICardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  color?: string;
  hint?: string;
}

export const KPICard: FC<KPICardProps> = ({ label, value, icon, color = 'blue', hint }) => {
  return (
    <Paper withBorder p="md" radius="md" style={{ flex: 1, minWidth: 180 }}>
      <Group justify="space-between" mb={4}>
        <Text size="xs" c="dimmed" fw={500} tt="uppercase">{label}</Text>
        {icon && (
          <ThemeIcon variant="light" color={color} size="md">
            {icon}
          </ThemeIcon>
        )}
      </Group>
      <Stack gap={2}>
        <Text fz={28} fw={700} lh={1.1}>{value}</Text>
        {hint && <Text size="xs" c="dimmed">{hint}</Text>}
      </Stack>
    </Paper>
  );
};
