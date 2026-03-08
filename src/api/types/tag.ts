export interface TagSummary {
  id: number;
  name: string;
}

export interface TagResponse {
  id: number;
  tenant_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface TagListResponse {
  tags: TagResponse[];
  total: number;
}

export type ResourceTypeTagsResponse = TagSummary[];

export interface ResourceTagsResponse {
  resource_id: string;
  resource_type: string;
  tags: TagSummary[];
}

export interface ResourceTagListParams {
  name?: string;
  skip?: number;
  limit?: number;
}

export interface CreateTagRequest {
  name: string;
}

export interface SetResourceTagsRequest {
  tags: string[];
}
