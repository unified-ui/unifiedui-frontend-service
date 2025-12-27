import type { FC } from 'react';
import { useState, useCallback } from 'react';
import {
  Group,
  TextInput,
  Select,
  ActionIcon,
  Button,
  Popover,
  Stack,
  Text,
  MultiSelect,
  Badge,
} from '@mantine/core';
import {
  IconSearch,
  IconFilter,
  IconX,
} from '@tabler/icons-react';
import classes from './DataTableToolbar.module.css';

export type SortOption = 'updated' | 'created' | 'name-asc' | 'name-desc';

export interface FilterState {
  tags: string[];
  status: 'all' | 'active' | 'inactive';
}

interface DataTableToolbarProps {
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Current search value */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Current sort option */
  sortBy?: SortOption;
  /** Sort change handler */
  onSortChange?: (value: SortOption) => void;
  /** Available tags for filter */
  availableTags?: string[];
  /** Current filter state */
  filters?: FilterState;
  /** Filter change handler */
  onFilterChange?: (filters: FilterState) => void;
  /** Tag search handler for server-side tag filtering */
  onTagSearch?: (search: string) => void;
  /** Whether to show the filter button */
  showFilter?: boolean;
  /** Whether to show the sort dropdown */
  showSort?: boolean;
}

const sortOptions = [
  { value: 'updated', label: 'Sort by last updated' },
  { value: 'created', label: 'Sort by last created' },
  { value: 'name-asc', label: 'Sort by name A-Z' },
  { value: 'name-desc', label: 'Sort by name Z-A' },
];

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const DataTableToolbar: FC<DataTableToolbarProps> = ({
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  sortBy = 'updated',
  onSortChange,
  availableTags = [],
  filters = { tags: [], status: 'all' },
  onFilterChange,
  onTagSearch,
  showFilter = true,
  showSort = true,
}) => {
  const [filterOpened, setFilterOpened] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const activeFilterCount = 
    (filters.tags.length > 0 ? 1 : 0) + 
    (filters.status !== 'all' ? 1 : 0);

  const handleFilterApply = useCallback(() => {
    onFilterChange?.(localFilters);
    setFilterOpened(false);
  }, [localFilters, onFilterChange]);

  const handleFilterReset = useCallback(() => {
    const resetFilters: FilterState = { tags: [], status: 'all' };
    setLocalFilters(resetFilters);
    onFilterChange?.(resetFilters);
  }, [onFilterChange]);

  return (
    <div className={classes.toolbar}>
      <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
        <TextInput
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          leftSection={<IconSearch size={16} />}
          rightSection={
            searchValue ? (
              <IconX
                size={14}
                style={{ cursor: 'pointer' }}
                onClick={() => onSearchChange?.('')}
              />
            ) : null
          }
          className={classes.searchInput}
        />

        {showSort && (
          <Select
            data={sortOptions}
            value={sortBy}
            onChange={(value) => onSortChange?.(value as SortOption)}
            className={classes.sortSelect}
            withCheckIcon
          />
        )}

        {showFilter && (
          <Popover
            opened={filterOpened}
            onChange={setFilterOpened}
            position="bottom-end"
            shadow="md"
            width={300}
          >
            <Popover.Target>
              <ActionIcon
                variant="default"
                size="lg"
                w={42}
                onClick={() => setFilterOpened((o) => !o)}
                pos="relative"
              >
                <IconFilter size={18} />
                {activeFilterCount > 0 && (
                  <Badge 
                    size="xs" 
                    circle 
                    pos="absolute" 
                    top={-4} 
                    right={-4}
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </ActionIcon>
            </Popover.Target>

            <Popover.Dropdown py="md">
              <Stack gap="md">
                <div>
                  <Text size="sm" fw={500} mb={4}>
                    Tags
                  </Text>
                  <MultiSelect
                    data={availableTags}
                    value={localFilters.tags}
                    onChange={(tags) =>
                      setLocalFilters((prev) => ({ ...prev, tags }))
                    }
                    onSearchChange={onTagSearch}
                    placeholder="Select tags"
                    searchable
                    clearable
                  />
                </div>

                <div>
                  <Text size="sm" fw={500} mb={4}>
                    Status
                  </Text>
                  <Select
                    data={statusOptions}
                    value={localFilters.status}
                    onChange={(value) =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        status: (value as FilterState['status']) || 'all',
                      }))
                    }
                  />
                </div>

                <Group justify="space-between" mt="xs">
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={handleFilterReset}
                  >
                    Reset
                  </Button>
                  <Button size="xs" onClick={handleFilterApply}>
                    Apply Filters
                  </Button>
                </Group>
              </Stack>
            </Popover.Dropdown>
          </Popover>
        )}
      </Group>
    </div>
  );
};
