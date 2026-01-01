import type { FC, ReactNode } from 'react';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Stack, Text, Center, Loader } from '@mantine/core';
import { IconInbox } from '@tabler/icons-react';
import { DataTableToolbar, type SortOption, type FilterState } from './DataTableToolbar';
import { DataTableRow, type DataTableItem } from './DataTableRow';
import classes from './DataTable.module.css';

interface DataTableProps {
  /** Table items */
  items: DataTableItem[];
  /** Loading state (initial load) */
  isLoading?: boolean;
  /** Loading more items (infinite scroll) */
  isLoadingMore?: boolean;
  /** Whether there are more items to load */
  hasMore?: boolean;
  /** Error message */
  error?: string | null;
  /** Show status toggle column */
  showStatus?: boolean;
  /** Available tags for filtering */
  availableTags?: string[];
  /** Empty state message */
  emptyMessage?: string;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Status change handler */
  onStatusChange?: (id: string, isActive: boolean) => void;
  /** Open item handler */
  onOpen?: (id: string) => void;
  /** Edit item handler */
  onEdit?: (id: string) => void;
  /** Share item handler */
  onShare?: (id: string) => void;
  /** Duplicate item handler */
  onDuplicate?: (id: string) => void;
  /** Pin item handler */
  onPin?: (id: string, isPinned: boolean) => void;
  /** Delete item handler */
  onDelete?: (id: string) => void;
  /** Custom row icon renderer */
  renderIcon?: (item: DataTableItem) => ReactNode;
  /** Controlled sort value (for backend sorting) */
  sortBy?: SortOption;
  /** Sort change handler (for backend sorting) */
  onSortChange?: (sort: SortOption) => void;
  /** Load more items handler (for infinite scroll) */
  onLoadMore?: () => void;
  /** Controlled search value (for backend filtering) */
  searchValue?: string;
  /** Search change handler (for backend filtering) */
  onSearchChange?: (value: string) => void;
  /** Controlled filter state (for backend filtering) */
  filters?: FilterState;
  /** Filter change handler (for backend filtering) */
  onFilterChange?: (filters: FilterState) => void;
  /** Tag search handler (for backend tag loading) */
  onTagSearch?: (search: string) => void;
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
  onDuplicate,
  onPin,
  onDelete,
  renderIcon,
  sortBy: externalSortBy,
  onSortChange: externalOnSortChange,
  onLoadMore,
  searchValue: externalSearchValue,
  onSearchChange: externalOnSearchChange,
  filters: externalFilters,
  onFilterChange: externalOnFilterChange,
  onTagSearch,
}) => {
  // Toolbar state
  const [internalSearchValue, setInternalSearchValue] = useState('');
  const [internalSortBy, setInternalSortBy] = useState<SortOption>('updated');
  const [internalFilters, setInternalFilters] = useState<FilterState>({ tags: [], status: 'all' });

  // Use external filters if provided, otherwise use internal state
  const filters = externalFilters ?? internalFilters;
  const isExternalFilters = externalOnFilterChange !== undefined;

  // Delayed loading indicator (only show after 1s)
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowLoader(true);
      }, 1000); // 1 second delay

      return () => clearTimeout(timer);
    } else {
      setShowLoader(false);
    }
  }, [isLoading]);

  // Use external sortBy if provided, otherwise use internal state
  const sortBy = externalSortBy ?? internalSortBy;
  const handleSortChange = externalOnSortChange ?? setInternalSortBy;

  // Use external searchValue if provided, otherwise use internal state
  const searchValue = externalSearchValue ?? internalSearchValue;
  const isExternalSearch = externalOnSearchChange !== undefined;

  // Filter and sort items (only if not using external sorting/filtering)
  const processedItems = useMemo(() => {
    let result = [...items];

    // Apply search filter ONLY if using internal (client-side) search
    // When external search is used, backend handles filtering
    if (searchValue && !isExternalSearch) {
      const query = searchValue.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.type?.toLowerCase().includes(query)
      );
    }

    // Apply tag filter ONLY if using internal (client-side) filtering
    // When external filters are used, backend handles filtering
    if (filters.tags.length > 0 && !isExternalFilters) {
      result = result.filter((item) =>
        filters.tags.some((tag) => item.tags?.includes(tag))
      );
    }

    // Apply status filter ONLY if using internal (client-side) filtering
    // When external filters are used, backend handles filtering
    if (filters.status !== 'all' && !isExternalFilters) {
      const isActive = filters.status === 'active';
      result = result.filter((item) => item.isActive === isActive);
    }

    // Apply sorting ONLY if using internal (client-side) sorting
    // When external sorting is used, backend handles sorting
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
            // For now, keep original order (would need timestamps for proper sorting)
            return 0;
        }
      });
    }

    return result;
  }, [items, searchValue, sortBy, filters, externalSortBy, isExternalSearch, isExternalFilters]);

  // Infinite scroll: observe the sentinel element
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

  // Reset scroll position when search/filters change
  const handleSearchChange = useCallback((value: string) => {
    // Use external handler if provided, otherwise use internal state
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
    // Use external handler if provided, otherwise use internal state
    if (externalOnFilterChange) {
      externalOnFilterChange(newFilters);
    } else {
      setInternalFilters(newFilters);
    }
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [externalOnFilterChange]);

  // Collect all unique tags from items
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach((item) => {
      item.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [items]);

  const tagsForFilter = availableTags.length > 0 ? availableTags : allTags;

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

      {isLoading ? (
        showLoader ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Loader size="lg" />
              <Text c="dimmed">Loading...</Text>
            </Stack>
          </Center>
        ) : null
      ) : error ? (
        <Center py="xl">
          <Text c="red">{error}</Text>
        </Center>
      ) : (
        <div ref={scrollAreaRef} className={classes.scrollArea}>
          <Stack gap="xs" className={classes.tableBody}>
            {processedItems.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="sm">
                  <IconInbox size={48} stroke={1} className={classes.emptyIcon} />
                  <Text c="dimmed">{emptyMessage}</Text>
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
                    onDuplicate={onDuplicate}
                    onPin={onPin}
                    onDelete={onDelete}
                    icon={renderIcon?.(item)}
                  />
                ))}
                
                {/* Sentinel element for infinite scroll */}
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
