import type { FC, ReactNode } from 'react';
import { Box, Text, UnstyledButton } from '@mantine/core';
import { IconMessageCircle } from '@tabler/icons-react';
import classes from './ChatEmptyState.module.css';

const MAX_STARTERS = 4;

export interface ChatEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  promptStarters?: string[];
  onStarterClick?: (message: string) => void;
}

export const ChatEmptyState: FC<ChatEmptyStateProps> = ({
  icon,
  title,
  description,
  promptStarters,
  onStarterClick,
}) => {
  const visibleStarters = promptStarters?.filter(Boolean).slice(0, MAX_STARTERS);

  return (
    <Box className={classes.emptyState}>
      {icon ?? <IconMessageCircle size={64} className={classes.emptyStateIcon} />}
      <Text className={classes.emptyStateTitle}>{title}</Text>
      {description && (
        <Text className={classes.emptyStateDescription}>{description}</Text>
      )}
      {visibleStarters && visibleStarters.length > 0 && onStarterClick && (
        <Box className={classes.startersContainer}>
          {visibleStarters.map((starter) => (
            <UnstyledButton
              key={starter}
              className={classes.starterButton}
              onClick={() => onStarterClick(starter)}
            >
              {starter}
            </UnstyledButton>
          ))}
        </Box>
      )}
    </Box>
  );
};
