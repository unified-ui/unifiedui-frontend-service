export interface UserFavoriteResponse {
  tenant_id: string;
  user_id: string;
  resource_id: string;
  resource_type: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface UserFavoritesListResponse {
  favorites: UserFavoriteResponse[];
  total: number;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
}

export interface EntityStatsResponse {
  total: number;
  active: number;
  inactive: number;
}

export interface DashboardStatsResponse {
  chat_agents: EntityStatsResponse;
  autonomous_agents: EntityStatsResponse;
  conversations: EntityStatsResponse;
}

export interface SearchResultItem {
  type: string;
  id: string;
  name: string;
  description?: string;
  match_field: string;
  is_active?: boolean;
  tags: string[];
}

export interface SearchResponse {
  results: SearchResultItem[];
  total: number;
  query: string;
}

export interface GlobalSearchParams {
  q: string;
  types?: string;
  limit?: number;
}

export interface RecentVisitResponse {
  id: string;
  tenant_id: string;
  user_id: string;
  resource_type: string;
  resource_id: string;
  resource_name: string;
  visited_at: string;
}

export interface RecentVisitListResponse {
  visits: RecentVisitResponse[];
  total: number;
}

export interface RecentVisitItem {
  resource_type: string;
  resource_id: string;
  resource_name: string;
}

export interface SyncRecentVisitsRequest {
  visits: RecentVisitItem[];
}
