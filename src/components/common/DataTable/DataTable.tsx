import type { FC, ReactNode } from 'react';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Stack, Text, Center, Loader, Skeleton, Group, Button, Checkbox } from '@mantine/core';
import { IconInbox, IconPlus, IconTrash, IconToggleLeft, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useDelayedLoading } from '../../../hooks';
import { DataTableToolbar, type SortOption, type FilterState } from './DataTableToolbar';
import { DataTableRow, type DataTableItem } from './DataTableRow';
import classes from './DataTable.module.css';

interface DataTableProps {
  items: DataTableItem[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  error?: string | null;
  showStatus?: boolean;
  availableTags?: string[];
  emptyMessage?: string;
  searchPlaceholder?: string;
  onStatusChange?: (id: string, isActive: boolean) => void;
  onOpen?: (id: string) => void;
  onEdit?: (id: string) => void;
  onShare?: (id: string) => void;
  onManageAccess?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onEmbedSetup?: (id: string) => void;
  onPin?: (id: string, isPinned: boolean) => void;
  onDelete?: (id: string) => void;
  onRowClick?: (id: string) => void;
  renderIcon?: (item: DataTableItem) => ReactNode;
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (id: string) => void;
  sortBy?: SortOption;
  onSortChange?: (sort: SortOption) => void;
  onLoadMore?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
  onTagSearch?: (search: string) => void;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  enableSelection?: boolean;
  onBulkDelete?: (ids: string[]) => void;
  onBulkStatusToggle?: (ids: string[], isActive: boolean) => void;
}

export const DataTable: FC<DataTableProps> = ({
  items,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  error = null,
  showStatus = false,
  availableTags = [],
  emptyMessage = 'No items found',
  searchPlaceholder = 'Search...',
  onStatusChange,
  onOpen,
  onEdit,
  onShare,
  onManageAccess,
  onDuplicate,
  onEmbedSetup,
  onPin,
  onDelete,
  onRowClick,
  renderIcon,
  isFavorite,
  onToggleFavorite,
  sortBy: externalSortBy,
  onSortChange: externalOnSortChange,
  onLoadMore,
  searchValue: externalSearchValue,
  onSearchChange: externalOnSearchChange,
  filters: externalFilters,
  onFilterChange: externalOnFilterChange,
  onTagSearch,
  emptyActionLabel,
  onEmptyAction,
  enableSelection = false,
  onBulkDelete,
  onBulkStatusToggle,
}) => {
  const { t } = useTranslation('common');
  const [internalSearchValue, setInternalSearchValue] = useState('');
  const [internalSortBy, setInternalSortBy] = useState<SortOption>('updated');
  const [internalFilters, setInternalFilters] = useState<FilterState>({ tags: [], status: 'all' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const showLoadingSkeleton = useDelayedLoading(isLoading, 500);

  const filters = externalFilters ?? internalFilters;
  const isExternalFilters = externalOnFilterChange !== undefined;

  const sortBy = externalSortBy ?? internalSortBy;
  const handleSortChange = externalOnSortChange ?? setInternalSortBy;

  const searchValue = externalSearchValue ?? internalSearchValue;
  const isExternalSearch = externalOnSearchChange !== undefined;

  const processedItems = useMemo(() => {
    let result = [...items];

    if (searchValue && !isExternalSearch) {
      const query = searchValue.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.type?.toLowerCase().includes(query)
      );
    }

    if (filters.tags.length > 0 && !isExternalFilters) {
      result = result.filter((item) =>
        filters.tags.some((tag) => item.tags?.includes(tag))
      );
    }

    if (filters.status !== 'all' && !isExternalFilters) {
      const isActive = filters.status === 'active';
      result = result.filter((item) => item.isActive === isActive);
    }

    if (!externalSortBy) {
      result.sort((a, b) => {
        switch (sortBy) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'created':
          case 'updated':
          default:
            return 0;
        }
      });
    }

    if (isFavorite) {
      result.sort((a, b) => {
        const aFav = isFavorite(a.id) ? 0 : 1;
        const bFav = isFavorite(b.id) ? 0 : 1;
        return aFav - bFav;
      });
    }

    return result;
  }, [items, searchValue, sortBy, filters, externalSortBy, isExternalSearch, isExternalFilters, isFavorite]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore || isLoading) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      {
        root: scrollAreaRef.current,
        rootMargin: '100px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, hasMore, isLoadingMore, isLoading]);

  const handleSearchChange = useCallback((value: string) => {
    if (externalOnSearchChange) {
      externalOnSearchChange(value);
    } else {
      setInternalSearchValue(value);
    }
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [externalOnSearchChange]);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    if (externalOnFilterChange) {
      externalOnFilterChange(newFilters);
    } else {
      setInternalFilters(newFilters);
    }
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [externalOnFilterChange]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach((item) => {
      item.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [items]);

  const tagsForFilter = availableTags.length > 0 ? availableTags : allTags;

  const showCheckboxes = enableSelection && selectedIds.size > 0;

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === processedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(processedItems.map((item) => item.id)));
    }
  }, [processedItems, selectedIds.size]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (onBulkDelete && selectedIds.size > 0) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  }, [onBulkDelete, selectedIds]);

  const handleBulkStatusToggle = useCallback((isActive: boolean) => {
    if (onBulkStatusToggle && selectedIds.size > 0) {
      onBulkStatusToggle(Array.from(selectedIds), isActive);
      setSelectedIds(new Set());
    }
  }, [onBulkStatusToggle, selectedIds]);

  return (
    <div className={classes.wrapper}>
      <DataTableToolbar
        searchPlaceholder={searchPlaceholder}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        availableTags={tagsForFilter}
        filters={filters}
        onFilterChange={handleFilterChange}
        onTagSearch={onTagSearch}
        showFilter={true}
      />

      {enableSelection && selectedIds.size > 0 && (
        <Group className={classes.bulkActionBar} gap="sm" px="md" py="xs">
          <Checkbox
            checked={selectedIds.size === processedItems.length}
            indeterminate={selectedIds.size > 0 && selectedIds.size < processedItems.length}
            onChange={handleSelectAll}
            size="sm"
          />
          <Text size="sm" fw={500}>
            {t('selectedCount', { count: selectedIds.size })}
          </Text>
          <Group gap="xs" ml="auto">
            {onBulkStatusToggle && showStatus && (
              <Button
                size="xs"
                variant="light"
                leftSection={<IconToggleLeft size={14} />}
                onClick={() => handleBulkStatusToggle(true)}
              >
                {t('toggleStatus')}
              </Button>
            )}
            {onBulkDelete && (
              <Button
                size="xs"
                variant="light"
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={handleBulkDelete}
              >
                {t('delete')}
              </Button>
            )}
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              leftSection={<IconX size={14} />}
              onClick={handleClearSelection}
            >
              {t('cancel')}
            </Button>
          </Group>
        </Group>
      )}

      {showLoadingSkeleton ? (
        <Stack gap="xs" className={classes.tableBody} p="xs">
          {Array.from({ length: 5 }).map((_, i) => (
            <Group
              key={i}
              wrap="nowrap"
              gap="md"
              p="md"
              style={{
                background: 'var(--bg-paper)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                height: 'var(--data-table-row-height)',
              }}
            >
              <Skeleton circle width={40} height={40} />
              <Stack gap={6} style={{ flex: 1 }}>
                <Skeleton height={14} width="40%" radius="sm" />
                <Skeleton height={10} width="70%" radius="sm" />
              </Stack>
              <Skeleton height={12} width={80} radius="sm" />
              <Skeleton height={12} width={60} radius="sm" />
            </Group>
          ))}
        </Stack>
      ) : error ? (
        <Center py="xl">
          <Text c="red">{error}</Text>
        </Center>
      ) : (
        <div ref={scrollAreaRef} className={classes.scrollArea}>
          <Stack gap="xs" className={classes.tableBody}>
            {!isLoading && processedItems.length === 0 ? (
              <Center py={60}>
                <Stack align="center" gap="md">
                  <IconInbox size={56} stroke={1} className={classes.emptyIcon} />
                  <Stack align="center" gap={4}>
                    <Text size="lg" fw={500} c="dimmed">{emptyMessage}</Text>
                  </Stack>
                  {emptyActionLabel && onEmptyAction && (
                    <Button
                      leftSection={<IconPlus size={16} />}
                      onClick={onEmptyAction}
                      mt="xs"
                    >
                      {emptyActionLabel}
                    </Button>
                  )}
                </Stack>
              </Center>
            ) : (
              <>
                {processedItems.map((item) => (
                  <DataTableRow
                    key={item.id}
                    item={item}
                    showStatus={showStatus}
                    onStatusChange={onStatusChange}
                    onOpen={onOpen}
                    onEdit={onEdit}
                    onShare={onShare}
                    onManageAccess={onManageAccess}
                    onDuplicate={onDuplicate}
                    onEmbedSetup={onEmbedSetup}
                    onPin={onPin}
                    onDelete={onDelete}
                    onRowClick={onRowClick}
                    icon={renderIcon?.(item)}
                    isFavorite={isFavorite?.(item.id)}
                    onToggleFavorite={onToggleFavorite}
                    isSelected={selectedIds.has(item.id)}
                    showCheckbox={showCheckboxes || enableSelection}
                    onSelect={enableSelection ? handleToggleSelect : undefined}
                  />
                ))}

                {hasMore && (
                  <div ref={sentinelRef} className={classes.sentinel}>
                    {isLoadingMore && (
                      <Center py="md">
                        <Loader size="sm" />
                      </Center>
                    )}
                  </div>
                )}
              </>
            )}
          </Stack>
        </div>
      )}
    </div>
  );
};
