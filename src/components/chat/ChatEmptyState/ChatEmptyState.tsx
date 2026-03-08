import type { FC, ReactNode } from 'react';
import { Box, Text } from '@mantine/core';
import { IconMessageCircle } from '@tabler/icons-react';
import classes from './ChatEmptyState.module.css';

export interface ChatEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export const ChatEmptyState: FC<ChatEmptyStateProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <Box className={classes.emptyState}>
      {icon ?? <IconMessageCircle size={64} className={classes.emptyStateIcon} />}
      <Text className={classes.emptyStateTitle}>{title}</Text>
      {description && (
        <Text className={classes.emptyStateDescription}>{description}</Text>
      )}
    </Box>
  );
};
