import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '@mantine/hooks';
import { useIdentity } from '../contexts';
import type { DataTableItem } from '../components/common';
import type { SortOption, FilterState } from '../components/common/DataTable/DataTableToolbar';
import type { EditDialogTab } from '../components/dialogs';
import type { PaginationParams, OrderParams, FilterParams, ResourceTagListParams, TagSummary } from '../api/types';

const PAGE_SIZE = 25;
const TAG_PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;
const FILTER_DEBOUNCE_MS = 300;

interface UseEntityListConfig<TResponse> {
  sortStorageKey: string;
  errorMessage: string;
  listEntities: (tenantId: string, params: PaginationParams & OrderParams & FilterParams) => Promise<TResponse[]>;
  listTags: (tenantId: string, params: ResourceTagListParams) => Promise<TagSummary[]>;
  updateEntity?: (tenantId: string, id: string, data: { is_active: boolean }) => Promise<unknown>;
  deleteEntity: (tenantId: string, id: string) => Promise<void>;
  duplicateEntity?: (tenantId: string, id: string) => Promise<TResponse>;
  mapToTableItem: (entity: TResponse) => DataTableItem;
  refreshSidebar?: () => void;
}

interface UseEntityListReturn<TResponse> {
  items: DataTableItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  searchValue: string;
  sortBy: SortOption;
  filters: FilterState;
  availableTags: string[];
  isCreateDialogOpen: boolean;
  deleteDialog: { open: boolean; id: string; name: string };
  deactivateDialog: { open: boolean; id: string; name: string };
  isDeleting: boolean;
  selectedId: string | null;
  editTab: EditDialogTab;
  rawDataRef: React.MutableRefObject<Map<string, TResponse>>;
  setIsCreateDialogOpen: (open: boolean) => void;
  handleLoadMore: () => void;
  handleSearchChange: (value: string) => void;
  handleTagSearch: (value: string) => void;
  handleSortChange: (sort: SortOption) => void;
  handleFilterChange: (filters: FilterState) => void;
  handleEdit: (id: string) => void;
  handleEditClose: () => void;
  handleEditTabChange: (tab: EditDialogTab) => void;
  handleEditSuccess: () => void;
  handleManageAccess: (id: string) => void;
  handleDuplicate: (id: string) => void;
  handleStatusChange: (id: string, isActive: boolean) => void;
  handleDeleteClick: (id: string) => void;
  handleDeleteConfirm: () => Promise<void>;
  handleDeleteClose: () => void;
  handleDeactivateConfirm: () => Promise<void>;
  handleDeactivateClose: () => void;
  handleCreateSuccess: () => void;
  refetch: () => void;
}

function getStoredSort(storageKey: string): SortOption {
  const stored = localStorage.getItem(storageKey);
  if (stored && ['updated', 'created', 'name-asc', 'name-desc'].includes(stored)) {
    return stored as SortOption;
  }
  return 'updated';
}

function getSortParams(sort: SortOption): { order_by: string; order_direction: 'asc' | 'desc' } {
  switch (sort) {
    case 'name-asc':
      return { order_by: 'name', order_direction: 'asc' };
    case 'name-desc':
      return { order_by: 'name', order_direction: 'desc' };
    case 'created':
      return { order_by: 'created_at', order_direction: 'desc' };
    case 'updated':
    default:
      return { order_by: 'updated_at', order_direction: 'desc' };
  }
}

export function useEntityList<TResponse>(config: UseEntityListConfig<TResponse>): UseEntityListReturn<TResponse> {
  const {
    sortStorageKey,
    errorMessage,
    listEntities,
    listTags,
    updateEntity,
    deleteEntity,
    duplicateEntity,
    mapToTableItem,
    refreshSidebar,
  } = config;

  const [searchParams, setSearchParams] = useSearchParams();
  const { apiClient, selectedTenant } = useIdentity();

  const [isCreateDialogOpen, setIsCreateDialogOpenState] = useState(() => searchParams.get('dialog') === 'new');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>(() => {
    const dialog = searchParams.get('dialog');
    return dialog === 'delete'
      ? { open: true, id: searchParams.get('selectedId') || '', name: '' }
      : { open: false, id: '', name: '' };
  });
  const [deactivateDialog, setDeactivateDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [items, setItems] = useState<DataTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(() => getStoredSort(sortStorageKey));

  const dialogParam = searchParams.get('dialog');
  const selectedIdParam = searchParams.get('selectedId');
  const selectedId = dialogParam === 'edit' ? selectedIdParam : null;
  const editTab = (searchParams.get('tab') as EditDialogTab) || 'details';

  const [filters, setFilters] = useState<FilterState>({ tags: [], status: 'all' });
  const [debouncedFilters] = useDebouncedValue(filters, FILTER_DEBOUNCE_MS);

  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchValue, SEARCH_DEBOUNCE_MS);

  const [tagSearchValue, setTagSearchValue] = useState('');
  const [debouncedTagSearch] = useDebouncedValue(tagSearchValue, SEARCH_DEBOUNCE_MS);

  const offsetRef = useRef(0);
  const isLoadingRef = useRef(false);
  const tagMapRef = useRef<Map<string, number>>(new Map());
  const rawDataRef = useRef<Map<string, TResponse>>(new Map());

  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const setIsCreateDialogOpen = useCallback((open: boolean) => {
    setIsCreateDialogOpenState(open);
    if (open) {
      setSearchParams({ dialog: 'new' });
    } else {
      setSearchParams({});
    }
  }, [setSearchParams]);

  useEffect(() => {
    if (dialogParam === 'new' && !isCreateDialogOpen) {
      setIsCreateDialogOpenState(true);
    } else if (dialogParam !== 'new' && isCreateDialogOpen) {
      setIsCreateDialogOpenState(false);
    }
  }, [dialogParam, isCreateDialogOpen]);

  const fetchTags = useCallback(async (nameFilter?: string) => {
    if (!apiClient || !selectedTenant) return;

    try {
      const tags = await listTags(selectedTenant.id, {
        limit: TAG_PAGE_SIZE,
        name: nameFilter || undefined,
      });

      tags.forEach(tag => {
        tagMapRef.current.set(tag.name, tag.id);
      });

      setAvailableTags(tags.map(tag => tag.name));
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  }, [apiClient, selectedTenant, listTags]);

  useEffect(() => {
    fetchTags(debouncedTagSearch || undefined);
  }, [debouncedTagSearch, fetchTags]);

  const fetchEntities = useCallback(async (
    reset = true,
    searchFilter?: string,
    currentFilters?: FilterState
  ) => {
    if (!apiClient || !selectedTenant) return;
    if (!reset && isLoadingRef.current) return;

    isLoadingRef.current = true;

    if (reset) {
      setIsLoading(true);
      setItems([]);
      offsetRef.current = 0;
      setHasMore(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    const currentOffset = offsetRef.current;

    try {
      const sortParams = getSortParams(sortBy);

      let isActiveParam: number | undefined;
      if (currentFilters?.status === 'active') {
        isActiveParam = 1;
      } else if (currentFilters?.status === 'inactive') {
        isActiveParam = 0;
      }

      let tagsParam: string | undefined;
      if (currentFilters?.tags && currentFilters.tags.length > 0) {
        const tagIds = currentFilters.tags
          .map(tagName => tagMapRef.current.get(tagName))
          .filter((id): id is number => id !== undefined);
        if (tagIds.length > 0) {
          tagsParam = tagIds.join(',');
        }
      }

      const data = await listEntities(selectedTenant.id, {
        limit: PAGE_SIZE,
        skip: currentOffset,
        name: searchFilter || undefined,
        is_active: isActiveParam,
        tags: tagsParam,
        ...sortParams,
      });

      if (reset) {
        rawDataRef.current.clear();
      }
      data.forEach((entity) => {
        const item = mapToTableItem(entity);
        rawDataRef.current.set(item.id, entity);
      });

      const tableItems: DataTableItem[] = data.map(mapToTableItem);

      if (reset) {
        setItems(tableItems);
        offsetRef.current = data.length;
      } else {
        setItems(prev => [...prev, ...tableItems]);
        offsetRef.current = currentOffset + data.length;
      }

      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (err) {
      offsetRef.current = currentOffset;
      setError(errorMessage);
      console.error(errorMessage, err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [apiClient, selectedTenant, sortBy, listEntities, mapToTableItem, errorMessage]);

  useEffect(() => {
    fetchEntities(true, debouncedSearch, debouncedFilters);
  }, [fetchEntities, debouncedSearch, debouncedFilters]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchEntities(false, debouncedSearch, debouncedFilters);
    }
  }, [fetchEntities, isLoadingMore, hasMore, debouncedSearch, debouncedFilters]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleTagSearch = useCallback((value: string) => {
    setTagSearchValue(value);
  }, []);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSortBy(newSort);
    localStorage.setItem(sortStorageKey, newSort);
  }, [sortStorageKey]);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const handleEdit = useCallback((id: string) => {
    setSearchParams({ dialog: 'edit', selectedId: id, tab: 'details' });
  }, [setSearchParams]);

  const handleManageAccess = useCallback((id: string) => {
    setSearchParams({ dialog: 'edit', selectedId: id, tab: 'iam' });
  }, [setSearchParams]);

  const handleEditClose = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const handleEditTabChange = useCallback((tab: EditDialogTab) => {
    if (selectedId) {
      setSearchParams({ dialog: 'edit', selectedId, tab });
    }
  }, [selectedId, setSearchParams]);

  const handleEditSuccess = useCallback(() => {
    fetchEntities(true, debouncedSearch, debouncedFilters);
    refreshSidebar?.();
  }, [fetchEntities, debouncedSearch, debouncedFilters, refreshSidebar]);

  const handleDuplicate = useCallback(async (id: string) => {
    if (!apiClient || !selectedTenant || !duplicateEntity) return;
    try {
      await duplicateEntity(selectedTenant.id, id);
      fetchEntities(true, debouncedSearch, debouncedFilters);
      refreshSidebar?.();
    } catch (err) {
      console.error('Error duplicating entity:', err);
    }
  }, [apiClient, selectedTenant, duplicateEntity, fetchEntities, debouncedSearch, debouncedFilters, refreshSidebar]);

  const handleStatusChange = useCallback(async (id: string, isActive: boolean) => {
    if (!apiClient || !selectedTenant) return;

    if (!isActive) {
      const item = items.find(i => i.id === id);
      setDeactivateDialog({ open: true, id, name: item?.name || '' });
      return;
    }

    try {
      await updateEntity?.(selectedTenant.id, id, { is_active: isActive });
      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, isActive } : item
      ));
    } catch (err) {
      console.error('Error updating entity status:', err);
      fetchEntities(true, debouncedSearch, debouncedFilters);
    }
  }, [apiClient, selectedTenant, updateEntity, fetchEntities, debouncedSearch, debouncedFilters, items]);

  const handleDeleteClick = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    setDeleteDialog({ open: true, id, name: item?.name || '' });
    setSearchParams({ dialog: 'delete', selectedId: id });
  }, [items, setSearchParams]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!apiClient || !selectedTenant || !deleteDialog.id) return;

    setIsDeleting(true);
    try {
      await deleteEntity(selectedTenant.id, deleteDialog.id);
      setDeleteDialog({ open: false, id: '', name: '' });
      setSearchParams({});
      fetchEntities(true, debouncedSearch, debouncedFilters);
      refreshSidebar?.();
    } catch (err) {
      console.error('Error deleting entity:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [apiClient, selectedTenant, deleteDialog.id, deleteEntity, setSearchParams, fetchEntities, refreshSidebar, debouncedSearch, debouncedFilters]);

  const handleDeleteClose = useCallback(() => {
    setDeleteDialog({ open: false, id: '', name: '' });
    setSearchParams({});
  }, [setSearchParams]);

  const handleDeactivateConfirm = useCallback(async () => {
    if (!apiClient || !selectedTenant || !deactivateDialog.id) return;

    try {
      await updateEntity?.(selectedTenant.id, deactivateDialog.id, { is_active: false });
      setItems(prev => prev.map(item =>
        item.id === deactivateDialog.id ? { ...item, isActive: false } : item
      ));
      setDeactivateDialog({ open: false, id: '', name: '' });
    } catch (err) {
      console.error('Error deactivating entity:', err);
      fetchEntities(true, debouncedSearch, debouncedFilters);
    }
  }, [apiClient, selectedTenant, deactivateDialog.id, updateEntity, fetchEntities, debouncedSearch, debouncedFilters]);

  const handleDeactivateClose = useCallback(() => {
    setDeactivateDialog({ open: false, id: '', name: '' });
  }, []);

  const handleCreateSuccess = useCallback(() => {
    fetchEntities(true, debouncedSearch, debouncedFilters);
    refreshSidebar?.();
  }, [fetchEntities, refreshSidebar, debouncedSearch, debouncedFilters]);

  const refetch = useCallback(() => {
    fetchEntities(true, debouncedSearch, debouncedFilters);
  }, [fetchEntities, debouncedSearch, debouncedFilters]);

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    searchValue,
    sortBy,
    filters,
    availableTags,
    isCreateDialogOpen,
    deleteDialog,
    deactivateDialog,
    isDeleting,
    selectedId,
    editTab,
    rawDataRef,
    setIsCreateDialogOpen,
    handleLoadMore,
    handleSearchChange,
    handleTagSearch,
    handleSortChange,
    handleFilterChange,
    handleEdit,
    handleEditClose,
    handleEditTabChange,
    handleEditSuccess,
    handleManageAccess,
    handleDuplicate,
    handleStatusChange,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteClose,
    handleDeactivateConfirm,
    handleDeactivateClose,
    handleCreateSuccess,
    refetch,
  };
}
