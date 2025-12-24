import { type FC, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Stack,
  Group,
  Text,
  TextInput,
  ActionIcon,
  Divider,
  Button,
  Loader,
  Center,
  ScrollArea,
  Box,
} from '@mantine/core';
import {
  IconSearch,
  IconSquareArrowRight,
  IconSquareArrowLeft,
  IconX,
  IconPlus,
  IconInbox,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import classes from './SidebarDataList.module.css';

export interface DataListItem {
  id: string;
  name: string;
  link: string;
}

export interface SidebarDataListProps {
  /** Header title */
  title: string;
  /** Header icon component */
  icon: React.ReactNode;
  /** List of items to display */
  items: DataListItem[];
  /** Loading state */
  isLoading?: boolean;
  /** Error message if loading failed */
  error?: string | null;
  /** Callback when add button is clicked */
  onAdd?: () => void;
  /** Callback when close button is clicked */
  onClose: () => void;
  /** Whether the component is expanded */
  isExpanded?: boolean;
  /** Callback to toggle expand state */
  onToggleExpand?: () => void;
  /** Callback when mouse enters the component */
  onMouseEnter?: () => void;
  /** Callback when mouse leaves the component */
  onMouseLeave?: () => void;
  /** Add button label */
  addButtonLabel?: string;
}

const ITEMS_PER_PAGE = 20;

export const SidebarDataList: FC<SidebarDataListProps> = ({
  title,
  icon,
  items,
  isLoading = false,
  error = null,
  onAdd,
  onClose,
  isExpanded = false,
  onToggleExpand,
  onMouseEnter,
  onMouseLeave,
  addButtonLabel = 'Hinzufügen',
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }
    const query = searchQuery.toLowerCase().trim();
    return items.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Get visible items (pagination)
  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  // Check if there are more items to load
  const hasMore = visibleCount < filteredItems.length;

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchQuery]);

  // Handle scroll for pagination
  const handleScroll = useCallback(
    (position: { x: number; y: number }) => {
      if (!viewportRef.current || isLoading || !hasMore) return;

      const { scrollHeight, clientHeight } = viewportRef.current;
      const scrollBottom = scrollHeight - position.y - clientHeight;

      // Load more when within 100px of bottom
      if (scrollBottom < 100) {
        setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
      }
    },
    [isLoading, hasMore]
  );

  // Handle item click
  const handleItemClick = useCallback(
    (item: DataListItem) => {
      navigate(item.link);
      onClose();
    },
    [navigate, onClose]
  );

  // Handle search change
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(event.target.value);
    },
    []
  );

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <div
      className={`${classes.container} ${isExpanded ? classes.expanded : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header */}
      <div className={classes.header}>
        <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <div className={classes.headerIcon}>{icon}</div>
          <Text fw={700} size="lg" className={classes.headerTitle} truncate>
            {title}
          </Text>
        </Group>
        <Group gap="xs" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={onToggleExpand}
            title={isExpanded ? 'Verkleinern' : 'Erweitern'}
          >
            {isExpanded ? <IconSquareArrowLeft size={18} /> : <IconSquareArrowRight size={18} />}
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={onClose}
            title="Schließen"
          >
            <IconX size={18} />
          </ActionIcon>
        </Group>
      </div>

      <Divider className={classes.divider} />

      {/* Search Bar */}
      <div className={classes.searchContainer}>
        <TextInput
          placeholder="Suchen..."
          value={searchQuery}
          onChange={handleSearchChange}
          leftSection={<IconSearch size={16} />}
          rightSection={
            searchQuery ? (
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={handleClearSearch}
              >
                <IconX size={14} />
              </ActionIcon>
            ) : null
          }
          className={classes.searchInput}
        />
      </div>

      {/* Content Area */}
      <div className={classes.content}>
        {isLoading ? (
          <Center className={classes.centerContent}>
            <Stack align="center" gap="sm">
              <Loader size="md" />
              <Text size="sm" c="dimmed">
                Lade Daten...
              </Text>
            </Stack>
          </Center>
        ) : error ? (
          <Center className={classes.centerContent}>
            <Stack align="center" gap="sm">
              <Text size="sm" c="red">
                {error}
              </Text>
            </Stack>
          </Center>
        ) : filteredItems.length === 0 ? (
          <Center className={classes.centerContent}>
            <Stack align="center" gap="sm">
              <IconInbox size={48} stroke={1} className={classes.emptyIcon} />
              <Text size="sm" c="dimmed" ta="center">
                {searchQuery
                  ? 'Keine Einträge gefunden'
                  : 'Keine Einträge vorhanden'}
              </Text>
            </Stack>
          </Center>
        ) : (
          <ScrollArea
            viewportRef={viewportRef}
            onScrollPositionChange={handleScroll}
            className={classes.scrollArea}
            scrollbarSize={6}
          >
            <Stack gap={0} className={classes.itemList}>
              {visibleItems.map((item) => (
                <Box
                  key={item.id}
                  className={classes.listItem}
                  onClick={() => handleItemClick(item)}
                >
                  <Text size="sm" truncate className={classes.itemName}>
                    {item.name}
                  </Text>
                </Box>
              ))}
              {hasMore && (
                <Center py="xs">
                  <Loader size="xs" />
                </Center>
              )}
            </Stack>
          </ScrollArea>
        )}
      </div>

      <Divider className={classes.divider} />

      {/* Footer with Add Button */}
      <div className={classes.footer}>
        <Button
          leftSection={<IconPlus size={16} />}
          variant="light"
          fullWidth
          onClick={onAdd}
          disabled={!onAdd}
        >
          {addButtonLabel}
        </Button>
      </div>
    </div>
  );
};
