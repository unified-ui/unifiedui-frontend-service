import type { FC, ReactNode } from 'react';
import {
  Group,
  Text,
  Badge,
  Switch,
  Menu,
  ActionIcon,
  Tooltip,
  Stack,
  Paper,
  Box,
} from '@mantine/core';
import {
  IconDots,
  IconExternalLink,
  IconShare,
  IconCopy,
  IconTrash,
} from '@tabler/icons-react';
import classes from './DataTable.module.css';

export interface DataTableItem {
  id: string;
  name: string;
  description?: string;
  type?: string;
  tags?: string[];
  isActive?: boolean;
}

interface DataTableRowProps {
  item: DataTableItem;
  /** Show the status toggle */
  showStatus?: boolean;
  /** Status toggle change handler */
  onStatusChange?: (id: string, isActive: boolean) => void;
  /** Open item handler */
  onOpen?: (id: string) => void;
  /** Share item handler */
  onShare?: (id: string) => void;
  /** Duplicate item handler */
  onDuplicate?: (id: string) => void;
  /** Delete item handler */
  onDelete?: (id: string) => void;
  /** Custom row icon */
  icon?: ReactNode;
}

const MAX_VISIBLE_TAGS = 3;

export const DataTableRow: FC<DataTableRowProps> = ({
  item,
  showStatus = false,
  onStatusChange,
  onOpen,
  onShare,
  onDuplicate,
  onDelete,
  icon,
}) => {
  const visibleTags = item.tags?.slice(0, MAX_VISIBLE_TAGS) || [];
  const hiddenTags = item.tags?.slice(MAX_VISIBLE_TAGS) || [];
  const hasHiddenTags = hiddenTags.length > 0;

  return (
    <Paper className={classes.row} p="md" withBorder>
      <Group justify="space-between" wrap="nowrap" gap="lg">
        {/* Left: Name & Description */}
        <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          {icon && <Box className={classes.rowIcon}>{icon}</Box>}
          <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
            <Text fw={600} size="md" truncate className={classes.itemName}>
              {item.name}
            </Text>
            {item.description && (
              <Text size="sm" c="dimmed" truncate className={classes.itemDescription}>
                {item.description}
              </Text>
            )}
          </Stack>
        </Group>

        {/* Type Column */}
        {item.type && (
          <Text size="sm" c="dimmed" className={classes.typeColumn}>
            {item.type}
          </Text>
        )}

        {/* Tags Column */}
        <Group gap={4} wrap="nowrap" className={classes.tagsColumn}>
          {visibleTags.map((tag) => (
            <Badge key={tag} size="sm" variant="light" radius="sm">
              {tag}
            </Badge>
          ))}
          {hasHiddenTags && (
            <Tooltip
              label={hiddenTags.join(', ')}
              position="top"
              multiline
              w={200}
            >
              <Badge size="sm" variant="outline" radius="sm" style={{ cursor: 'pointer' }}>
                +{hiddenTags.length}
              </Badge>
            </Tooltip>
          )}
        </Group>

        {/* Status Toggle */}
        {showStatus && item.isActive !== undefined && (
          <Switch
            checked={item.isActive}
            onChange={(e) => onStatusChange?.(item.id, e.currentTarget.checked)}
            size="sm"
            className={classes.statusSwitch}
          />
        )}

        {/* Actions Menu */}
        <Menu shadow="md" position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray">
              <IconDots size={18} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconExternalLink size={14} />}
              onClick={() => onOpen?.(item.id)}
            >
              Open
            </Menu.Item>
            <Menu.Item
              leftSection={<IconShare size={14} />}
              onClick={() => onShare?.(item.id)}
            >
              Share
            </Menu.Item>
            <Menu.Item
              leftSection={<IconCopy size={14} />}
              onClick={() => onDuplicate?.(item.id)}
            >
              Duplicate
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<IconTrash size={14} />}
              color="red"
              onClick={() => onDelete?.(item.id)}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Paper>
  );
};
