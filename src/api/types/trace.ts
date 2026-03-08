export const TraceContextType = {
  CONVERSATION: 'conversation',
  AUTONOMOUS_AGENT: 'autonomous_agent',
} as const;

export type TraceContextType = typeof TraceContextType[keyof typeof TraceContextType];

export const TraceNodeType = {
  AGENT: 'agent',
  TOOL: 'tool',
  LLM: 'llm',
  CHAIN: 'chain',
  RETRIEVER: 'retriever',
  WORKFLOW: 'workflow',
  FUNCTION: 'function',
  HTTP: 'http',
  CODE: 'code',
  CONDITIONAL: 'conditional',
  LOOP: 'loop',
  CUSTOM: 'custom',
  MEMORY: 'memory',
  VECTOR_STORE: 'vector_store',
  EMBEDDING: 'embedding',
  OUTPUT_PARSER: 'output_parser',
  DOCUMENT: 'document',
  TEXT_SPLITTER: 'text_splitter',
  APP: 'app',
  DATA_TRANSFORM: 'data_transform',
  QUEUE: 'queue',
  DATABASE: 'database',
} as const;

export type TraceNodeType = typeof TraceNodeType[keyof typeof TraceNodeType];

export const TraceNodeStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  CANCELLED: 'cancelled',
} as const;

export type TraceNodeStatus = typeof TraceNodeStatus[keyof typeof TraceNodeStatus];

export interface TraceNodeDataIO {
  text?: string;
  arguments?: Record<string, unknown>;
  extraData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface TraceNodeData {
  input?: TraceNodeDataIO | null;
  output?: TraceNodeDataIO | null;
}

export interface TraceNodeResponse {
  id: string;
  name: string;
  type: TraceNodeType | string;
  referenceId?: string;
  startAt?: string;
  endAt?: string;
  duration?: number;
  status: TraceNodeStatus | string;
  error?: string;
  logs?: string[];
  data?: TraceNodeData;
  nodes?: TraceNodeResponse[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface FullTraceResponse {
  id: string;
  tenantId: string;
  chatAgentId?: string;
  conversationId?: string;
  autonomousAgentId?: string;
  contextType: TraceContextType | string;
  referenceId?: string;
  referenceName?: string;
  referenceMetadata?: Record<string, unknown>;
  logs?: Array<string | Record<string, unknown>>;
  nodes: TraceNodeResponse[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface FullTracesListResponse {
  traces: FullTraceResponse[];
  total: number;
}

export interface TracesListParams {
  skip?: number;
  limit?: number;
  order?: 'asc' | 'desc';
  order_by?: 'created_at' | 'updated_at';
  created_after?: string;
  created_before?: string;
  expand?: boolean;
}

export interface TraceMetadata {
  model?: string;
  tokensInput?: number;
  tokensOutput?: number;
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  custom?: Record<string, unknown>;
}

export interface TraceResponse {
  id: string;
  messageId: string;
  agentId: string;
  parentTraceId?: string;
  type: string;
  name: string;
  status: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  metadata?: TraceMetadata;
}

export interface GetTracesResponse {
  traces: TraceResponse[];
  total: number;
}

export interface UpdateTraceRequest {
  traceId: string;
  conversationId: string;
  messageId: string;
  parentTraceId?: string;
  type: string;
  name: string;
  status: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  metadata?: TraceMetadata;
}

export interface BatchUpdateTracesRequest {
  traces: UpdateTraceRequest[];
}

export interface UpdateTracesResponse {
  updated: number;
  created: number;
}
