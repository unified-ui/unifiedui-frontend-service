import type { FC, ReactNode } from 'react';
import { Group, Stack, Title, Text, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import classes from './PageHeader.module.css';

interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Action button label (e.g., "Create Application") */
  actionLabel?: string;
  /** Action button click handler */
  onAction?: () => void;
  /** Custom action button or additional elements */
  actions?: ReactNode;
  /** Icon for the action button */
  actionIcon?: ReactNode;
}

export const PageHeader: FC<PageHeaderProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  actions,
  actionIcon = <IconPlus size={18} />,
}) => {
  return (
    <div className={classes.header}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4}>
          <Title order={1} className={classes.title}>
            {title}
          </Title>
          {description && (
            <Text c="dimmed" size="md" className={classes.description}>
              {description}
            </Text>
          )}
        </Stack>

        <Group gap="sm">
          {actions}
          {actionLabel && onAction && (
            <Button
              leftSection={actionIcon}
              onClick={onAction}
              className={classes.actionButton}
            >
              {actionLabel}
            </Button>
          )}
        </Group>
      </Group>
    </div>
  );
};
