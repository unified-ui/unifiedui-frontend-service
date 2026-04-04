import type { FC, ReactNode } from 'react';
import { useState, useCallback } from 'react';
import { Group, Text, Box, Collapse, ActionIcon } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import classes from './ContentCard.module.css';

interface ContentCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  headerAction?: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export const ContentCard: FC<ContentCardProps> = ({
  title,
  icon,
  children,
  headerAction,
  collapsible = false,
  defaultExpanded = true,
  className,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = useCallback(() => {
    if (collapsible) {
      setExpanded((prev) => !prev);
    }
  }, [collapsible]);

  return (
    <div className={`${classes.card} ${className || ''}`}>
      <div
        className={`${classes.header} ${collapsible ? classes.headerClickable : ''}`}
        onClick={collapsible ? handleToggle : undefined}
      >
        <Group gap="sm" wrap="nowrap">
          <Box className={classes.iconContainer}>{icon}</Box>
          <Text className={classes.title}>{title}</Text>
          {collapsible && (
            <ActionIcon variant="subtle" size="sm" color="gray">
              {expanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
            </ActionIcon>
          )}
        </Group>
        {headerAction && <Box onClick={(e) => e.stopPropagation()}>{headerAction}</Box>}
      </div>
      {collapsible ? (
        <Collapse in={expanded}>
          <div className={classes.content}>{children}</div>
        </Collapse>
      ) : (
        <div className={classes.content}>{children}</div>
      )}
    </div>
  );
};
