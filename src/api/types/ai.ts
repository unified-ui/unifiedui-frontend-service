export const AIModelTypeEnum = {
  LLM_MODEL: 'LLM_MODEL',
  EMBEDDING_MODEL: 'EMBEDDING_MODEL',
} as const;

export type AIModelTypeEnum = typeof AIModelTypeEnum[keyof typeof AIModelTypeEnum];

export const AIModelProviderEnum = {
  AZURE_OPENAI: 'AZURE_OPENAI',
  OPENAI: 'OPENAI',
  ANTHROPIC: 'ANTHROPIC',
  GOOGLE_GENAI: 'GOOGLE_GENAI',
  OLLAMA: 'OLLAMA',
  MISTRAL: 'MISTRAL',
  GROQ: 'GROQ',
} as const;

export type AIModelProviderEnum = typeof AIModelProviderEnum[keyof typeof AIModelProviderEnum];

export const AIModelPurposeGroupEnum = {
  REACT_AGENT: 'REACT_AGENT',
  CONVERSATION_TITLE_GENERATION: 'CONVERSATION_TITLE_GENERATION',
  CONVERSATION_SUMMARIZATION: 'CONVERSATION_SUMMARIZATION',
  DESCRIPTION_GENERATION: 'DESCRIPTION_GENERATION',
  TRACE_ANALYSIS: 'TRACE_ANALYSIS',
  GENERAL: 'GENERAL',
} as const;

export type AIModelPurposeGroupEnum = typeof AIModelPurposeGroupEnum[keyof typeof AIModelPurposeGroupEnum];

export interface AIModelResponse {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  type: AIModelTypeEnum;
  provider: AIModelProviderEnum;
  purpose_groups: AIModelPurposeGroupEnum[];
  config: Record<string, unknown>;
  credential_id?: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateAIModelRequest {
  name: string;
  description?: string;
  type: AIModelTypeEnum;
  provider: AIModelProviderEnum;
  purpose_groups?: AIModelPurposeGroupEnum[];
  config?: Record<string, unknown>;
  credential_id?: string;
  priority?: number;
  is_active?: boolean;
}

export interface UpdateAIModelRequest {
  name?: string;
  description?: string;
  purpose_groups?: AIModelPurposeGroupEnum[];
  config?: Record<string, unknown>;
  credential_id?: string;
  priority?: number;
  is_active?: boolean;
}

export interface GenerateDescriptionRequest {
  entity_type: string;
  entity_name: string;
  existing_description?: string;
  context?: Record<string, unknown>;
}

export interface GenerateDescriptionResponse {
  description: string;
}

export interface AnalyzeTraceRequest {
  trace_id?: string;
  node_id?: string;
  error: string;
  node_name: string;
  node_type: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface AnalyzeTraceResponse {
  analysis: string;
}

export interface SummarizeTraceRequest {
  trace_id?: string;
  detail_level: 'short' | 'medium' | 'long';
  nodes: Record<string, unknown>[];
}

export interface SummarizeTraceResponse {
  summary: string;
}

export interface TestModelRequest {
  provider: string;
  config: Record<string, unknown>;
  credential_id?: string;
}

export interface TestModelResponse {
  success: boolean;
  message: string;
  response_time_ms: number;
}

export interface AICapabilitiesResponse {
  title_generation: boolean;
  description_generation: boolean;
  trace_analysis: boolean;
  summarization: boolean;
}

export interface TraceChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TraceChatRequest {
  trace: string;
  selected_node?: string;
  message: string;
  history?: TraceChatMessage[];
}

export interface TraceChatResponse {
  reply: string;
}
