import type { FC } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IconSparkles } from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { PageContainer, PageHeader, DataTable, ConfirmDeleteDialog } from '../../components/common';
import type { DataTableItem } from '../../components/common';
import type { SortOption, FilterState } from '../../components/common/DataTable/DataTableToolbar';
import { CreateApplicationDialog, EditApplicationDialog, type EditDialogTab } from '../../components/dialogs';
import { useIdentity, useSidebarData } from '../../contexts';
import type { ApplicationResponse } from '../../api/types';

const PAGE_SIZE = 25;
const TAG_PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;
const FILTER_DEBOUNCE_MS = 300;

export const ApplicationsPage: FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { apiClient, selectedTenant } = useIdentity();
  const { refreshApplications } = useSidebarData();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [items, setItems] = useState<DataTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  
  // Edit dialog state from URL params
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
  
  // Tags state
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Fetch tags from API with optional name filter (only tags used by applications)
  const fetchTags = useCallback(async (nameFilter?: string) => {
    if (!apiClient || !selectedTenant) return;
    
    try {
      const tags = await apiClient.listApplicationTypeTags(selectedTenant.id, {
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

  const fetchApplications = useCallback(async (
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
      
      const data = await apiClient.listApplications(selectedTenant.id, { 
        limit: PAGE_SIZE,
        skip: currentOffset,
        name_filter: searchFilter || undefined,
        is_active: isActiveParam,
        tags: tagsParam,
        ...sortParams
      }) as ApplicationResponse[];
      
      const tableItems: DataTableItem[] = data.map((app) => ({
        id: app.id,
        name: app.name,
        description: app.description,
        type: app.type.replace(/_/g, ' '),
        tags: app.tags?.map(tag => tag.name) || [],
        isActive: app.is_active,
      }));

      if (reset) {
        setItems(tableItems);
        // Set offset to number of items received
        offsetRef.current = data.length;
      } else {
        setItems(prev => [...prev, ...tableItems]);
        // Increment offset by actual number of items received
        offsetRef.current = currentOffset + data.length;
      }

      // If we received fewer items than requested, there are no more
      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (err) {
      // Reset offset on error to allow retry
      offsetRef.current = currentOffset;
      setError('Failed to load applications');
      console.error('Error loading applications:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [apiClient, selectedTenant, sortBy]);

  // Fetch when sort, debounced search, or debounced filters change
  useEffect(() => {
    fetchApplications(true, debouncedSearch, debouncedFilters);
  }, [fetchApplications, debouncedSearch, debouncedFilters]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchApplications(false, debouncedSearch, debouncedFilters);
    }
  }, [fetchApplications, isLoadingMore, hasMore, debouncedSearch, debouncedFilters]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleTagSearch = useCallback((value: string) => {
    setTagSearchValue(value);
  }, []);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSortBy(newSort);
    // fetchApplications wird automatisch durch useEffect aufgerufen
  }, []);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    // fetchApplications wird automatisch durch useEffect aufgerufen (debouncedFilters)
  }, []);

  const handleOpen = useCallback((id: string) => {
    navigate(`/applications/${id}`);
  }, [navigate]);

  // Open edit dialog with details tab
  const handleEdit = useCallback((id: string) => {
    setSearchParams({ editItemId: id, tab: 'details' });
  }, [setSearchParams]);

  // Open edit dialog with manage access tab
  const handleShare = useCallback((id: string) => {
    setSearchParams({ editItemId: id, tab: 'iam' });
  }, [setSearchParams]);

  // Close edit dialog and clear URL params
  const handleEditClose = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  // Handle tab change in edit dialog
  const handleEditTabChange = useCallback((tab: EditDialogTab) => {
    if (editItemId) {
      setSearchParams({ editItemId, tab });
    }
  }, [editItemId, setSearchParams]);

  // Handle successful edit
  const handleEditSuccess = useCallback(() => {
    fetchApplications(true, debouncedSearch, debouncedFilters);
    refreshApplications();
  }, [fetchApplications, debouncedSearch, debouncedFilters, refreshApplications]);

  const handleDuplicate = useCallback((id: string) => {
    // TODO: Implement duplicate functionality
    console.log('Duplicate:', id);
  }, []);

  const handleStatusChange = useCallback(async (id: string, isActive: boolean) => {
    if (!apiClient || !selectedTenant) return;
    
    try {
      await apiClient.updateApplication(selectedTenant.id, id, { is_active: isActive });
      
      // Update local state immediately for better UX
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, isActive } : item
      ));
    } catch (err) {
      console.error('Error updating application status:', err);
      // Revert on error
      fetchApplications(true, debouncedSearch, debouncedFilters);
    }
  }, [apiClient, selectedTenant, fetchApplications, debouncedSearch, debouncedFilters]);

  const handleDeleteClick = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    setDeleteDialog({ open: true, id, name: item?.name || '' });
  }, [items]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!apiClient || !selectedTenant || !deleteDialog.id) return;
    
    setIsDeleting(true);
    try {
      await apiClient.deleteApplication(selectedTenant.id, deleteDialog.id);
      setDeleteDialog({ open: false, id: '', name: '' });
      fetchApplications(true, debouncedSearch, debouncedFilters); // Reset and refetch with current search and filters
      refreshApplications(); // Update sidebar cache
    } catch (err) {
      console.error('Error deleting application:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [apiClient, selectedTenant, deleteDialog.id, fetchApplications, refreshApplications, debouncedSearch, debouncedFilters]);

  const handleCreateSuccess = useCallback(() => {
    fetchApplications(true, debouncedSearch, debouncedFilters); // Reset and refetch with current search and filters
    refreshApplications(); // Update sidebar cache
  }, [fetchApplications, refreshApplications, debouncedSearch, debouncedFilters]);

  const renderIcon = useCallback(() => (
    <IconSparkles size={20} />
  ), []);

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Chat Agents"
          description="Manage your AI chat agents. Create, configure, and deploy conversational agents for your applications."
          actionLabel="Create Chat Agent"
          onAction={() => setIsCreateDialogOpen(true)}
        />

        <DataTable
          items={items}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          error={error}
          showStatus={true}
          searchPlaceholder="Search chat agents..."
          emptyMessage="No chat agents found. Create your first one!"
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          availableTags={availableTags}
          filters={filters}
          onFilterChange={handleFilterChange}
          onTagSearch={handleTagSearch}
          onStatusChange={handleStatusChange}
          onOpen={handleOpen}
          onEdit={handleEdit}
          onShare={handleShare}
          onDuplicate={handleDuplicate}
          onDelete={handleDeleteClick}
          renderIcon={renderIcon}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          onLoadMore={handleLoadMore}
        />
      </PageContainer>

      <CreateApplicationDialog
        opened={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditApplicationDialog
        opened={!!editItemId}
        onClose={handleEditClose}
        applicationId={editItemId}
        initialTab={editTab}
        onTabChange={handleEditTabChange}
        onSuccess={handleEditSuccess}
      />

      <ConfirmDeleteDialog
        opened={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: '', name: '' })}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.name}
        itemType="Chat Agent"
        isLoading={isDeleting}
      />
    </MainLayout>
  );
};
