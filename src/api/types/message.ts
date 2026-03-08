export const MessageType = {
  USER: 'user',
  ASSISTANT: 'assistant',
  REASONING: 'reasoning',
  TOOL_CALL: 'tool_call',
  TOOL_RESULT: 'tool_result',
  PLAN: 'plan',
  SUB_AGENT: 'sub_agent',
} as const;

export type MessageType = typeof MessageType[keyof typeof MessageType];

export const MessageStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type MessageStatus = typeof MessageStatus[keyof typeof MessageStatus];

export interface StatusTrace {
  status: string;
  timestamp: string;
  message?: string;
}

export interface AssistantMetadata {
  model?: string;
  tokensInput?: number;
  tokensOutput?: number;
  latencyMs?: number;
  agentType?: string;
  extMessageId?: string;
  custom?: Record<string, unknown>;
}

export interface AttachmentMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileCategory: string;
}

export interface MessageResponse {
  id: string;
  type: MessageType;
  conversationId: string;
  chatAgentId: string;
  content: string;
  userId?: string;
  userMessageId?: string;
  status?: MessageStatus;
  errorMessage?: string;
  statusTraces?: StatusTrace[];
  metadata?: AssistantMetadata;
  attachmentsMetadata?: AttachmentMetadata[];
  createdAt: string;
  updatedAt: string;
}

export interface GetMessagesResponse {
  messages: MessageResponse[];
}

export interface SearchMessagesResponse {
  messages: MessageResponse[];
}

export interface FileAttachment {
  type: 'image' | 'file' | 'audio';
  imageUrl?: string;
  fileData?: string;
  filename?: string;
  mimeType?: string;
  detail?: 'low' | 'high' | 'auto';
}

export interface MessageContent {
  content: string;
  attachments?: string[];
  files?: FileAttachment[];
}

export interface InvokeConfig {
  chatHistoryMessageCount?: number;
  contextData?: Record<string, string>;
}

export interface SendMessageRequest {
  conversationId?: string;
  chatAgentId: string;
  message: MessageContent;
  invokeConfig?: InvokeConfig;
  extConversationId?: string;
}

export interface SendMessageResponse {
  userMessageId: string;
  assistantMessageId: string;
  conversationId: string;
}

export const ReactionType = {
  THUMBS_UP: 'thumbs_up',
  THUMBS_DOWN: 'thumbs_down',
} as const;

export type ReactionType = typeof ReactionType[keyof typeof ReactionType];

export interface ReactionResponse {
  id: string;
  tenantId: string;
  conversationId: string;
  messageId: string;
  userId: string;
  reaction: ReactionType;
  feedbackText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListReactionsResponse {
  reactions: ReactionResponse[];
}

export interface UpsertReactionRequest {
  reaction: ReactionType;
  feedbackText?: string;
}

export interface EditMessageRequest {
  content: string;
}

export const SSEStreamMessageType = {
  STREAM_START: 'STREAM_START',
  TEXT_STREAM: 'TEXT_STREAM',
  STREAM_NEW_MESSAGE: 'STREAM_NEW_MESSAGE',
  STREAM_END: 'STREAM_END',
  MESSAGE_COMPLETE: 'MESSAGE_COMPLETE',
  TITLE_GENERATION: 'TITLE_GENERATION',
  ERROR: 'ERROR',
  REASONING_START: 'REASONING_START',
  REASONING_STREAM: 'REASONING_STREAM',
  REASONING_END: 'REASONING_END',
  TOOL_CALL_START: 'TOOL_CALL_START',
  TOOL_CALL_STREAM: 'TOOL_CALL_STREAM',
  TOOL_CALL_END: 'TOOL_CALL_END',
  PLAN_START: 'PLAN_START',
  PLAN_STREAM: 'PLAN_STREAM',
  PLAN_COMPLETE: 'PLAN_COMPLETE',
  SUB_AGENT_START: 'SUB_AGENT_START',
  SUB_AGENT_STREAM: 'SUB_AGENT_STREAM',
  SUB_AGENT_END: 'SUB_AGENT_END',
  SYNTHESIS_START: 'SYNTHESIS_START',
  SYNTHESIS_STREAM: 'SYNTHESIS_STREAM',
  TRACE: 'TRACE',
} as const;

export type SSEStreamMessageType = typeof SSEStreamMessageType[keyof typeof SSEStreamMessageType];

export interface SSEStreamMessage {
  type: SSEStreamMessageType;
  content?: string;
  config?: {
    messageId?: string;
    conversationId?: string;
    code?: string;
    message?: string | MessageResponse;
    details?: string;
    toolName?: string;
    toolInput?: string;
    agentName?: string;
    agentId?: string;
    traceId?: string;
    [key: string]: unknown;
  };
}

export interface SSEMessageEvent {
  content: string;
  messageId?: string;
  done: boolean;
}

export interface SSETraceEvent {
  traceId: string;
  type: string;
  name: string;
  status: string;
  data?: unknown;
}

export interface SSEErrorEvent {
  code: string;
  message: string;
  details?: string;
}

export type SSEEventType = 'message' | 'trace' | 'error' | 'done';

export interface SSEEvent {
  type: SSEEventType;
  data: SSEStreamMessage | SSETraceEvent | SSEErrorEvent | null;
}
