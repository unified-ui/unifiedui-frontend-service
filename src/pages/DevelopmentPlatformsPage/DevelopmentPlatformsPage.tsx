import type { FC } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { IconCode } from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer, PageHeader, DataTable, ConfirmDeleteDialog } from '../../components/common';
import type { DataTableItem } from '../../components/common';
import type { SortOption, FilterState } from '../../components/common/DataTable/DataTableToolbar';
import { CreateDevelopmentPlatformDialog, EditDevelopmentPlatformDialog } from '../../components/dialogs';
import type { EditDialogTab } from '../../components/dialogs';
import { useIdentity } from '../../contexts';
import type { DevelopmentPlatformResponse } from '../../api/types';

const PAGE_SIZE = 25;
const TAG_PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;
const FILTER_DEBOUNCE_MS = 300;
const SORT_STORAGE_KEY = 'unified-ui:sort:development-platforms';

const getStoredSort = (): SortOption => {
  const stored = localStorage.getItem(SORT_STORAGE_KEY);
  if (stored && ['updated', 'created', 'name-asc', 'name-desc'].includes(stored)) {
    return stored as SortOption;
  }
  return 'updated';
};

export const DevelopmentPlatformsPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { apiClient, selectedTenant } = useIdentity();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [items, setItems] = useState<DataTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(getStoredSort);
  
  // Edit dialog state from URL
  const editItemId = searchParams.get('editItemId');
  const editTab = (searchParams.get('tab') as EditDialogTab) || 'details';
  
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
  // Ref to store raw data for passing to edit dialog
  const rawDataRef = useRef<Map<string, DevelopmentPlatformResponse>>(new Map());
  
  // Tags state
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Fetch tags from API with optional name filter (only tags used by development platforms)
  const fetchTags = useCallback(async (nameFilter?: string) => {
    if (!apiClient || !selectedTenant) return;
    
    try {
      const tags = await apiClient.listDevelopmentPlatformTypeTags(selectedTenant.id, {
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

  const fetchDevelopmentPlatforms = useCallback(async (
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
      
      const data = await apiClient.listDevelopmentPlatforms(selectedTenant.id, { 
        limit: PAGE_SIZE,
        skip: currentOffset,
        name_filter: searchFilter || undefined,
        is_active: isActiveParam,
        tags: tagsParam,
        ...sortParams
      }) as DevelopmentPlatformResponse[];
      
      // Store raw data for edit dialog
      if (reset) {
        rawDataRef.current.clear();
      }
      data.forEach((platform) => {
        rawDataRef.current.set(platform.id, platform);
      });
      
      const tableItems: DataTableItem[] = data.map((platform) => ({
        id: platform.id,
        name: platform.name,
        description: platform.description,
        tags: platform.tags?.map(tag => tag.name) || [],
        isActive: platform.is_active,
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
      setError('Failed to load development platforms');
      console.error('Error loading development platforms:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [apiClient, selectedTenant, sortBy]);

  // Fetch when sort, debounced search, or debounced filters change
  useEffect(() => {
    fetchDevelopmentPlatforms(true, debouncedSearch, debouncedFilters);
  }, [fetchDevelopmentPlatforms, debouncedSearch, debouncedFilters]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchDevelopmentPlatforms(false, debouncedSearch, debouncedFilters);
    }
  }, [fetchDevelopmentPlatforms, isLoadingMore, hasMore, debouncedSearch, debouncedFilters]);

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

  const handleRowClick = useCallback((id: string) => {
    // Navigate to the details page with iframe
    navigate(`/development-platforms/${id}`);
  }, [navigate]);

  const handleOpen = useCallback((id: string) => {
    // Open the external URL in a new tab
    const platform = rawDataRef.current.get(id);
    if (platform?.iframe_url) {
      window.open(platform.iframe_url, '_blank');
    }
  }, []);

  // Edit dialog handlers
  const handleEdit = useCallback((id: string) => {
    setSearchParams({ editItemId: id, tab: 'details' });
  }, [setSearchParams]);

  const handleManageAccess = useCallback((id: string) => {
    setSearchParams({ editItemId: id, tab: 'iam' });
  }, [setSearchParams]);

  const handleEditDialogClose = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const handleEditDialogTabChange = useCallback((tab: EditDialogTab) => {
    if (editItemId) {
      setSearchParams({ editItemId, tab });
    }
  }, [editItemId, setSearchParams]);

  const handleEditSuccess = useCallback(() => {
    fetchDevelopmentPlatforms(true, debouncedSearch, debouncedFilters);
  }, [fetchDevelopmentPlatforms, debouncedSearch, debouncedFilters]);

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
      await apiClient.updateDevelopmentPlatform(selectedTenant.id, id, { is_active: isActive });
      
      // Update local state immediately for better UX
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, isActive } : item
      ));
      
      // Update raw data ref
      const existing = rawDataRef.current.get(id);
      if (existing) {
        rawDataRef.current.set(id, { ...existing, is_active: isActive });
      }
    } catch (err) {
      console.error('Error updating development platform status:', err);
      // Revert on error
      fetchDevelopmentPlatforms(true, debouncedSearch, debouncedFilters);
    }
  }, [apiClient, selectedTenant, fetchDevelopmentPlatforms, debouncedSearch, debouncedFilters]);

  const handleDeleteClick = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    setDeleteDialog({ open: true, id, name: item?.name || '' });
  }, [items]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!apiClient || !selectedTenant || !deleteDialog.id) return;
    
    setIsDeleting(true);
    try {
      await apiClient.deleteDevelopmentPlatform(selectedTenant.id, deleteDialog.id);
      setDeleteDialog({ open: false, id: '', name: '' });
      fetchDevelopmentPlatforms(true, debouncedSearch, debouncedFilters);
    } catch (err) {
      console.error('Error deleting development platform:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [apiClient, selectedTenant, deleteDialog.id, fetchDevelopmentPlatforms, debouncedSearch, debouncedFilters]);

  const handleCreateSuccess = useCallback(() => {
    fetchDevelopmentPlatforms(true, debouncedSearch, debouncedFilters);
  }, [fetchDevelopmentPlatforms, debouncedSearch, debouncedFilters]);

  const renderIcon = useCallback(() => (
    <IconCode size={20} />
  ), []);

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Development Platforms"
          description="Manage your development platforms. Configure external tools and environments for your workflows."
          actionLabel="Create Platform"
          onAction={() => setIsCreateDialogOpen(true)}
        />

        <DataTable
          items={items}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          error={error}
          showStatus={true}
          searchPlaceholder="Search development platforms..."
          emptyMessage="No development platforms found. Create your first one!"
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          availableTags={availableTags}
          filters={filters}
          onFilterChange={handleFilterChange}
          onTagSearch={handleTagSearch}
          onStatusChange={handleStatusChange}
          onRowClick={handleRowClick}
          onOpen={handleOpen}
          onEdit={handleEdit}
          onShare={handleShare}
          onManageAccess={handleManageAccess}
          onDuplicate={handleDuplicate}
          onDelete={handleDeleteClick}
          renderIcon={renderIcon}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          onLoadMore={handleLoadMore}
        />
      </PageContainer>

      <CreateDevelopmentPlatformDialog
        opened={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditDevelopmentPlatformDialog
        opened={!!editItemId}
        platformId={editItemId}
        initialData={editItemId ? rawDataRef.current.get(editItemId) || null : null}
        activeTab={editTab}
        onClose={handleEditDialogClose}
        onSuccess={handleEditSuccess}
        onTabChange={handleEditDialogTabChange}
      />

      <ConfirmDeleteDialog
        opened={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: '', name: '' })}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.name}
        itemType="Development Platform"
        isLoading={isDeleting}
      />
    </MainLayout>
  );
};
