import type { FC } from 'react';
import { Group, Text, Select, ActionIcon, Paper } from '@mantine/core';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react';
import classes from './DataTablePagination.module.css';

interface DataTablePaginationProps {
  /** Total number of items */
  totalItems: number;
  /** Current page (1-indexed) */
  currentPage: number;
  /** Items per page */
  pageSize: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Page size change handler */
  onPageSizeChange: (size: number) => void;
  /** Available page sizes */
  pageSizeOptions?: number[];
}

export const DataTablePagination: FC<DataTablePaginationProps> = ({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <Paper className={classes.pagination} p="sm" withBorder>
      <Group justify="space-between" wrap="nowrap">
        <Text size="sm" c="dimmed">
          Showing {startItem}-{endItem} of {totalItems} items
        </Text>

        <Group gap="lg" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <Text size="sm" c="dimmed">
              Rows per page:
            </Text>
            <Select
              data={pageSizeOptions.map((size) => ({
                value: String(size),
                label: `${size}`,
              }))}
              value={String(pageSize)}
              onChange={(value) => onPageSizeChange(Number(value))}
              size="xs"
              w={80}
              withCheckIcon
            />
          </Group>

          <Group gap={4} wrap="nowrap">
            <Text size="sm" c="dimmed">
              Page {currentPage} of {totalPages || 1}
            </Text>
          </Group>

          <Group gap={4} wrap="nowrap">
            <ActionIcon
              variant="subtle"
              size="sm"
              disabled={!canGoPrev}
              onClick={() => onPageChange(1)}
              title="First page"
            >
              <IconChevronsLeft size={16} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="sm"
              disabled={!canGoPrev}
              onClick={() => onPageChange(currentPage - 1)}
              title="Previous page"
            >
              <IconChevronLeft size={16} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="sm"
              disabled={!canGoNext}
              onClick={() => onPageChange(currentPage + 1)}
              title="Next page"
            >
              <IconChevronRight size={16} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="sm"
              disabled={!canGoNext}
              onClick={() => onPageChange(totalPages)}
              title="Last page"
            >
              <IconChevronsRight size={16} />
            </ActionIcon>
          </Group>
        </Group>
      </Group>
    </Paper>
  );
};
