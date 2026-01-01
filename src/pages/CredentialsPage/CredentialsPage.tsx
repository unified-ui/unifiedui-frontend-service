import type { FC } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import { IconKey } from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer, PageHeader, DataTable, ConfirmDeleteDialog } from '../../components/common';
import type { DataTableItem } from '../../components/common';
import type { SortOption, FilterState } from '../../components/common/DataTable/DataTableToolbar';
import { CreateCredentialDialog } from '../../components/dialogs';
import { useIdentity, useSidebarData } from '../../contexts';
import type { CredentialResponse } from '../../api/types';

const PAGE_SIZE = 25;
const TAG_PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;
const FILTER_DEBOUNCE_MS = 300;
const SORT_STORAGE_KEY = 'unified-ui:sort:credentials';

const getStoredSort = (): SortOption => {
  const stored = localStorage.getItem(SORT_STORAGE_KEY);
  if (stored && ['updated', 'created', 'name-asc', 'name-desc'].includes(stored)) {
    return stored as SortOption;
  }
  return 'updated';
};

export const CredentialsPage: FC = () => {
  const navigate = useNavigate();
  const { apiClient, selectedTenant } = useIdentity();
  const { refreshCredentials } = useSidebarData();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [items, setItems] = useState<DataTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(getStoredSort);
  
  // Filter state with debouncing
  const [filters, setFilters] = useState<FilterState>({ tags: [], status: 'all' });
  const [debouncedFilters] = useDebouncedValue(filters, FILTER_DEBOUNCE_MS);
  
  // Search state with debouncing
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchValue, SEARCH_DEBOUNCE_MS);
  
  // Tag search state with debouncing
  const [tagSearchValue, setTagSearchValue] = useState('');
  const [debouncedTagSearch] = useDebouncedValue(tagSearchValue, SEARCH_DEBOUNCE_MS);
  
  // Track current offset for pagination
  const offsetRef = useRef(0);
  // Ref to prevent race conditions in fetch
  const isLoadingRef = useRef(false);
  // Ref for tag mapping to avoid dependency issues
  const tagMapRef = useRef<Map<string, number>>(new Map());
  
  // Tags state
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Fetch tags from API with optional name filter (only tags used by credentials)
  const fetchTags = useCallback(async (nameFilter?: string) => {
    if (!apiClient || !selectedTenant) return;
    
    try {
      const tags = await apiClient.listCredentialTypeTags(selectedTenant.id, {
        limit: TAG_PAGE_SIZE,
        name: nameFilter || undefined,
      });
      
      // Update tagMapRef and availableTags
      tags.forEach(tag => {
        tagMapRef.current.set(tag.name, tag.id);
      });
      
      setAvailableTags(tags.map(tag => tag.name));
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  }, [apiClient, selectedTenant]);

  // Load tags on mount
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Reload tags when tag search changes
  useEffect(() => {
    fetchTags(debouncedTagSearch || undefined);
  }, [debouncedTagSearch, fetchTags]);

  // Map SortOption to Backend parameters
  const getSortParams = (sort: SortOption): { order_by: string; order_direction: 'asc' | 'desc' } => {
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
  };

  const fetchCredentials = useCallback(async (
    reset = true, 
    searchFilter?: string,
    currentFilters?: FilterState
  ) => {
    if (!apiClient || !selectedTenant) return;

    // Prevent duplicate fetches while loading (use ref for immediate check)
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

    // Capture offset before fetch
    const currentOffset = offsetRef.current;

    try {
      const sortParams = getSortParams(sortBy);
      
      // Convert filter status to API format (0, 1, or undefined)
      let isActiveParam: number | undefined;
      if (currentFilters?.status === 'active') {
        isActiveParam = 1;
      } else if (currentFilters?.status === 'inactive') {
        isActiveParam = 0;
      }
      
      // Convert tag names to comma-separated tag IDs
      let tagsParam: string | undefined;
      if (currentFilters?.tags && currentFilters.tags.length > 0) {
        const tagIds = currentFilters.tags
          .map(tagName => tagMapRef.current.get(tagName))
          .filter((id): id is number => id !== undefined);
        if (tagIds.length > 0) {
          tagsParam = tagIds.join(',');
        }
      }
      
      const data = await apiClient.listCredentials(selectedTenant.id, { 
        limit: PAGE_SIZE,
        skip: currentOffset,
        name_filter: searchFilter || undefined,
        is_active: isActiveParam,
        tags: tagsParam,
        ...sortParams
      }) as CredentialResponse[];
      
      const tableItems: DataTableItem[] = data.map((cred) => ({
        id: cred.id,
        name: cred.name,
        description: cred.description,
        type: cred.type.replace(/_/g, ' '),
        tags: cred.tags?.map(tag => tag.name) || [],
        isActive: cred.is_active,
      }));

      if (reset) {
        setItems(tableItems);
        offsetRef.current = data.length;
      } else {
        setItems(prev => [...prev, ...tableItems]);
        offsetRef.current = currentOffset + data.length;
      }

      // If we received fewer items than requested, there are no more
      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (err) {
      // Reset offset on error to allow retry
      offsetRef.current = currentOffset;
      setError('Failed to load credentials');
      console.error('Error loading credentials:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [apiClient, selectedTenant, sortBy]);

  // Fetch when sort, debounced search, or debounced filters change
  useEffect(() => {
    fetchCredentials(true, debouncedSearch, debouncedFilters);
  }, [fetchCredentials, debouncedSearch, debouncedFilters]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchCredentials(false, debouncedSearch, debouncedFilters);
    }
  }, [fetchCredentials, isLoadingMore, hasMore, debouncedSearch, debouncedFilters]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleTagSearch = useCallback((value: string) => {
    setTagSearchValue(value);
  }, []);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSortBy(newSort);
    localStorage.setItem(SORT_STORAGE_KEY, newSort);
  }, []);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const handleOpen = useCallback((id: string) => {
    navigate(`/credentials/${id}`);
  }, [navigate]);

  const handleShare = useCallback((id: string) => {
    // TODO: Implement share functionality
    console.log('Share:', id);
  }, []);

  const handleDuplicate = useCallback((id: string) => {
    // TODO: Implement duplicate functionality
    console.log('Duplicate:', id);
  }, []);

  const handleStatusChange = useCallback(async (id: string, isActive: boolean) => {
    if (!apiClient || !selectedTenant) return;
    
    try {
      await apiClient.updateCredential(selectedTenant.id, id, { is_active: isActive });
      
      // Update local state immediately for better UX
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, isActive } : item
      ));
    } catch (err) {
      console.error('Error updating credential status:', err);
      // Revert on error
      fetchCredentials(true, debouncedSearch, debouncedFilters);
    }
  }, [apiClient, selectedTenant, fetchCredentials, debouncedSearch, debouncedFilters]);

  const handleDeleteClick = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    setDeleteDialog({ open: true, id, name: item?.name || '' });
  }, [items]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!apiClient || !selectedTenant || !deleteDialog.id) return;
    
    setIsDeleting(true);
    try {
      await apiClient.deleteCredential(selectedTenant.id, deleteDialog.id);
      setDeleteDialog({ open: false, id: '', name: '' });
      fetchCredentials(true, debouncedSearch, debouncedFilters);
      refreshCredentials(); // Update sidebar cache
    } catch (err) {
      console.error('Error deleting credential:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [apiClient, selectedTenant, deleteDialog.id, fetchCredentials, refreshCredentials, debouncedSearch, debouncedFilters]);

  const handleCreateSuccess = useCallback(() => {
    fetchCredentials(true, debouncedSearch, debouncedFilters);
    refreshCredentials(); // Update sidebar cache
  }, [fetchCredentials, refreshCredentials, debouncedSearch, debouncedFilters]);

  const renderIcon = useCallback(() => (
    <IconKey size={20} />
  ), []);

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Credentials"
          description="Securely manage API keys, tokens, and other credentials used by your agents and applications."
          actionLabel="Create Credential"
          onAction={() => setIsCreateDialogOpen(true)}
        />

        <DataTable
          items={items}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          error={error}
          showStatus={true}
          searchPlaceholder="Search credentials..."
          emptyMessage="No credentials found. Create your first one!"
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          availableTags={availableTags}
          filters={filters}
          onFilterChange={handleFilterChange}
          onTagSearch={handleTagSearch}
          onStatusChange={handleStatusChange}
          onOpen={handleOpen}
          onShare={handleShare}
          onDuplicate={handleDuplicate}
          onDelete={handleDeleteClick}
          renderIcon={renderIcon}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          onLoadMore={handleLoadMore}
        />
      </PageContainer>

      <CreateCredentialDialog
        opened={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <ConfirmDeleteDialog
        opened={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: '', name: '' })}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.name}
        itemType="Credential"
        isLoading={isDeleting}
      />
    </MainLayout>
  );
};
