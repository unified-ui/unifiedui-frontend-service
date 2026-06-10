import type { FC, ReactNode } from 'react';
import { useState } from 'react';
import {
  Group,
  Text,
  Badge,
  Switch,
  Menu,
  ActionIcon,
  Popover,
  Stack,
  Paper,
  Box,
  Checkbox,
} from '@mantine/core';
import { getTypeColor } from './typeColors';
import { DelayedTooltip } from '../DelayedTooltip';
import {
  IconDots,
  IconExternalLink,
  IconEdit,
  IconUserCog,
  IconCopy,
  IconPin,
  IconPinned,
  IconTrash,
  IconStar,
  IconStarFilled,
  IconCode,
  IconMessage,
} from '@tabler/icons-react';
import classes from './DataTable.module.css';

export interface DataTableItem {
  id: string;
  name: string;
  description?: string;
  type?: string;
  tags?: string[];
  isActive?: boolean;
  isPinned?: boolean;
  my_permission?: string;
  hideActions?: boolean;
}

interface DataTableRowProps {
  item: DataTableItem;
  showStatus?: boolean;
  onStatusChange?: (id: string, isActive: boolean) => void;
  onOpen?: (id: string) => void;
  onEdit?: (id: string) => void;
  onShare?: (id: string) => void;
  onManageAccess?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onOpenChat?: (id: string) => void;
  onEmbedSetup?: (id: string) => void;
  onIntegrationPrompt?: (id: string) => void;
  onPin?: (id: string, isPinned: boolean) => void;
  onDelete?: (id: string) => void;
  onRowClick?: (id: string) => void;
  icon?: ReactNode;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string, name: string) => void;
  isSelected?: boolean;
  showCheckbox?: boolean;
  onSelect?: (id: string) => void;
}

const MAX_VISIBLE_TAGS = 3;

export const DataTableRow: FC<DataTableRowProps> = ({
  item,
  showStatus = false,
  onStatusChange,
  onOpen,
  onEdit,
  onShare: _onShare,
  onManageAccess,
  onDuplicate,
  onOpenChat,
  onEmbedSetup,
  onIntegrationPrompt,
  onPin,
  onDelete,
  onRowClick,
  icon,
  isFavorite = false,
  onToggleFavorite,
  isSelected = false,
  showCheckbox = false,
  onSelect,
}) => {
  const visibleTags = item.tags?.slice(0, MAX_VISIBLE_TAGS) || [];
  const hiddenTags = item.tags?.slice(MAX_VISIBLE_TAGS) || [];
  const hasHiddenTags = hiddenTags.length > 0;
  const [popoverOpened, setPopoverOpened] = useState(false);

  const perm = item.my_permission;
  const canWriteItem = perm === 'ADMIN' || perm === 'WRITE';
  const canAdminItem = perm === 'ADMIN';
  const hasPermission = perm != null;

  const handleDelete = () => {
    if (!onDelete) return;
    onDelete(item.id);
  };

  return (
    <Paper
      className={`${classes.row} ${onRowClick ? classes.clickable : ''} ${isSelected ? classes.rowSelected : ''}`}
      p="md"
      withBorder
      onClick={() => onRowClick?.(item.id)}
      style={onRowClick ? { cursor: 'pointer' } : undefined}
    >
      <Group wrap="nowrap" gap="md" align="center">
        <Group gap="sm" wrap="nowrap" className={classes.nameGroup}>
          {showCheckbox && onSelect && (
            <Checkbox
              checked={isSelected}
              onChange={() => onSelect(item.id)}
              onClick={(e) => e.stopPropagation()}
              size="sm"
              className={classes.rowCheckbox}
            />
          )}
          {onToggleFavorite && (
            <ActionIcon
              variant="subtle"
              color={isFavorite ? 'yellow' : 'gray'}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(item.id, item.name);
              }}
              className={classes.favoriteButton}
            >
              {isFavorite ? <IconStarFilled size={18} /> : <IconStar size={18} />}
            </ActionIcon>
          )}
          {icon && <Box className={classes.rowIcon}>{icon}</Box>}
          <Stack gap={2} className={classes.nameDescriptionColumn}>
            <DelayedTooltip label={item.name} position="top-start">
              <Text fw={600} size="md" truncate className={classes.itemName}>
                {item.name}
              </Text>
            </DelayedTooltip>
            {item.description && (
              <DelayedTooltip label={item.description} position="top-start">
                <Text size="sm" c="dimmed" truncate className={classes.itemDescription}>
                  {item.description}
                </Text>
              </DelayedTooltip>
            )}
          </Stack>
        </Group>

        {item.type && (
          <Box className={classes.typeColumn}>
            <Badge
              variant="light"
              size="sm"
              radius="sm"
              color={getTypeColor(item.type)}
            >
              {item.type}
            </Badge>
          </Box>
        )}

        <Group gap={4} wrap="wrap" className={classes.tagsColumn}>
          {visibleTags.map((tag) => (
            <Badge key={tag} size="sm" variant="light" radius="sm">
              {tag}
            </Badge>
          ))}
          {hasHiddenTags && (
            <Popover
              position="top"
              withArrow
              shadow="md"
              withinPortal
              opened={popoverOpened}
              onChange={setPopoverOpened}
            >
              <Popover.Target>
                <div
                  onMouseEnter={() => setPopoverOpened(true)}
                  onMouseLeave={() => setPopoverOpened(false)}
                  style={{ display: 'inline-block', lineHeight: 1 }}
                >
                  <Badge size="sm" variant="outline" radius="sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                    +{hiddenTags.length}
                  </Badge>
                </div>
              </Popover.Target>
              <Popover.Dropdown
                onMouseEnter={() => setPopoverOpened(true)}
                onMouseLeave={() => setPopoverOpened(false)}
              >
                <Group gap={4} wrap="wrap" maw={300}>
                  {hiddenTags.map((tag) => (
                    <Badge key={tag} size="sm" variant="light" radius="sm">
                      {tag}
                    </Badge>
                  ))}
                </Group>
              </Popover.Dropdown>
            </Popover>
          )}
        </Group>

        <Group gap="md" wrap="nowrap" className={classes.actionsGroup}>
          {showStatus && item.isActive !== undefined && (
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={item.isActive}
                onChange={(e) => onStatusChange?.(item.id, e.currentTarget.checked)}
                size="sm"
                className={classes.statusSwitch}
                disabled={hasPermission && !canWriteItem}
              />
            </div>
          )}

          {onOpenChat && (
            <DelayedTooltip label="Open Chat" position="top">
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenChat(item.id);
                }}
              >
                <IconMessage size={18} />
              </ActionIcon>
            </DelayedTooltip>
          )}

          {!item.hideActions && (
          <Menu shadow="md" position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" onClick={(e) => e.stopPropagation()}>
              <IconDots size={18} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
            <Menu.Item
              leftSection={<IconExternalLink size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onOpen?.(item.id);
              }}
            >
              Open
            </Menu.Item>
            {onOpenChat && (
              <Menu.Item
                leftSection={<IconMessage size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenChat(item.id);
                }}
              >
                Open Chat
              </Menu.Item>
            )}
            {(!hasPermission || canWriteItem) && (
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(item.id);
                }}
              >
                Edit
              </Menu.Item>
            )}
            {(!hasPermission || canAdminItem) && (
              <Menu.Item
                leftSection={<IconUserCog size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onManageAccess?.(item.id);
                }}
              >
                Manage access
              </Menu.Item>
            )}
            {(!hasPermission || canWriteItem) && (
              <Menu.Item
                leftSection={<IconCopy size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate?.(item.id);
                }}
              >
                Duplicate
              </Menu.Item>
            )}            {onEmbedSetup && (!hasPermission || canWriteItem) && (
              <Menu.Item
                leftSection={<IconCode size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEmbedSetup(item.id);
                }}
              >
                Embed Agent
              </Menu.Item>
            )}            {onIntegrationPrompt && (
              <Menu.Item
                leftSection={<IconCode size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onIntegrationPrompt(item.id);
                }}
              >
                Integration Prompt
              </Menu.Item>
            )}
            {onPin && (
              <>
                <Menu.Divider />
                <Menu.Item
                  leftSection={item.isPinned ? <IconPinned size={14} /> : <IconPin size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPin(item.id, !item.isPinned);
                  }}
                >
                  {item.isPinned ? 'Unpin' : 'Pin'}
                </Menu.Item>
              </>
            )}
            {(!hasPermission || canAdminItem) && (
              <>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                >
                  Delete
                </Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>
          )}
        </Group>
      </Group>
    </Paper>
  );
};
