import type { FC, ReactNode } from 'react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Stack, Text, Center, Loader } from '@mantine/core';
import { IconInbox } from '@tabler/icons-react';
import { DataTableToolbar, type SortOption, type FilterState } from './DataTableToolbar';
import { DataTableRow, type DataTableItem } from './DataTableRow';
import { DataTablePagination } from './DataTablePagination';
import classes from './DataTable.module.css';

interface DataTableProps {
  /** Table items */
  items: DataTableItem[];
  /** Loading state */
  isLoading?: boolean;
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
  /** Share item handler */
  onShare?: (id: string) => void;
  /** Duplicate item handler */
  onDuplicate?: (id: string) => void;
  /** Delete item handler */
  onDelete?: (id: string) => void;
  /** Custom row icon renderer */
  renderIcon?: (item: DataTableItem) => ReactNode;
  /** Controlled sort value (for backend sorting) */
  sortBy?: SortOption;
  /** Sort change handler (for backend sorting) */
  onSortChange?: (sort: SortOption) => void;
}

export const DataTable: FC<DataTableProps> = ({
  items,
  isLoading = false,
  error = null,
  showStatus = false,
  availableTags = [],
  emptyMessage = 'No items found',
  searchPlaceholder = 'Search...',
  onStatusChange,
  onOpen,
  onShare,
  onDuplicate,
  onDelete,
  renderIcon,
  sortBy: externalSortBy,
  onSortChange: externalOnSortChange,
}) => {
  // Toolbar state
  const [searchValue, setSearchValue] = useState('');
  const [internalSortBy, setInternalSortBy] = useState<SortOption>('updated');
  const [filters, setFilters] = useState<FilterState>({ tags: [], status: 'all' });

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Filter and sort items (only if not using external sorting)
  const processedItems = useMemo(() => {
    let result = [...items];

    // Apply search filter
    if (searchValue) {
      const query = searchValue.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.type?.toLowerCase().includes(query)
      );
    }

    // Apply tag filter
    if (filters.tags.length > 0) {
      result = result.filter((item) =>
        filters.tags.some((tag) => item.tags?.includes(tag))
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
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
  }, [items, searchValue, sortBy, filters, externalSortBy]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedItems.slice(start, start + pageSize);
  }, [processedItems, currentPage, pageSize]);

  // Reset page when filters change
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

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
        <>
          <div className={classes.scrollArea}>
            <Stack gap="xs" className={classes.tableBody}>
              {paginatedItems.length === 0 ? (
                <Center py="xl">
                  <Stack align="center" gap="sm">
                    <IconInbox size={48} stroke={1} className={classes.emptyIcon} />
                    <Text c="dimmed">{emptyMessage}</Text>
                  </Stack>
                </Center>
              ) : (
                paginatedItems.map((item) => (
                  <DataTableRow
                    key={item.id}
                    item={item}
                    showStatus={showStatus}
                    onStatusChange={onStatusChange}
                    onOpen={onOpen}
                    onShare={onShare}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                    icon={renderIcon?.(item)}
                  />
                ))
              )}
            </Stack>
          </div>

          {processedItems.length > 0 && (
            <DataTablePagination
              totalItems={processedItems.length}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </>
      )}
    </div>
  );
};
