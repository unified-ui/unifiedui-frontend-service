import { useState, useCallback, useRef } from 'react';
import type { SSEStreamMessage, StatusTrace } from '../../api/types';

export type ReasoningStepType = 'reasoning' | 'tool_call' | 'plan' | 'sub_agent' | 'synthesis';

export interface ReasoningStep {
  id: string;
  type: ReasoningStepType;
  content: string;
  toolCallId?: string;
  toolName?: string;
  toolInput?: string;
  toolResult?: string;
  agentName?: string;
  agentId?: string;
  startedAt: number;
  completedAt?: number;
}

export interface ReActStreamState {
  reasoningSteps: ReasoningStep[];
  isReasoningExpanded: boolean;
  activeStepType: ReasoningStepType | null;
  activeStepContent: string;
}

export interface UseReActChatReturn {
  reActState: ReActStreamState;
  setIsReasoningExpanded: (expanded: boolean) => void;
  resetReActState: () => void;
  hasReasoningSteps: boolean;
  onReasoningStart: (config?: SSEStreamMessage['config']) => void;
  onReasoningStream: (content: string) => void;
  onReasoningEnd: () => void;
  onToolCallStart: (config?: SSEStreamMessage['config']) => void;
  onToolCallStream: (content: string) => void;
  onToolCallEnd: (config?: SSEStreamMessage['config']) => void;
  onPlanStart: (config?: SSEStreamMessage['config']) => void;
  onPlanStream: (content: string) => void;
  onPlanComplete: (config?: SSEStreamMessage['config']) => void;
  onSubAgentStart: (config?: SSEStreamMessage['config']) => void;
  onSubAgentStream: (content: string) => void;
  onSubAgentEnd: (config?: SSEStreamMessage['config']) => void;
  onSynthesisStart: (config?: SSEStreamMessage['config']) => void;
  onSynthesisStream: (content: string) => void;
  onTrace: (config?: SSEStreamMessage['config']) => void;
  onReActStreamEnd: () => void;
}

const TRACE_TYPE_MAP: Record<string, ReasoningStepType> = {
  reasoning_start: 'reasoning',
  tool_call_start: 'tool_call',
  plan_start: 'plan',
  sub_agent_start: 'sub_agent',
  synthesis_start: 'synthesis',
};

export function statusTracesToReActState(traces: StatusTrace[]): ReActStreamState | null {
  if (!traces || traces.length === 0) return null;

  const steps: ReasoningStep[] = [];
  let stepIdx = 0;
  const stepsByToolCallId = new Map<string, ReasoningStep>();
  let lastNonToolStep: ReasoningStep | null = null;

  for (const trace of traces) {
    const stepType = TRACE_TYPE_MAP[trace.type];
    if (stepType) {
      const toolCallId = trace.data?.tool_call_id as string | undefined;
      const toolInputRaw = trace.data?.toolInput;
      const step: ReasoningStep = {
        id: `persisted-${stepIdx++}`,
        type: stepType,
        content: trace.content || '',
        toolCallId,
        toolName: trace.data?.toolName as string | undefined,
        toolInput: typeof toolInputRaw === 'object' ? JSON.stringify(toolInputRaw, null, 2) : toolInputRaw as string | undefined,
        toolResult: trace.data?.toolResult as string | undefined,
        agentName: trace.data?.agentName as string | undefined,
        agentId: trace.data?.agentId as string | undefined,
        startedAt: new Date(trace.timestamp).getTime(),
      };
      steps.push(step);
      if (toolCallId) {
        stepsByToolCallId.set(toolCallId, step);
      }
      if (stepType !== 'tool_call') {
        lastNonToolStep = step;
      }
    } else if (trace.type.endsWith('_end')) {
      const endToolCallId = trace.data?.tool_call_id as string | undefined;
      const matchedStep = endToolCallId
        ? stepsByToolCallId.get(endToolCallId)
        : lastNonToolStep;
      if (matchedStep) {
        matchedStep.completedAt = new Date(trace.timestamp).getTime();
        if (trace.data?.toolResult) {
          matchedStep.toolResult = trace.data.toolResult as string;
        }
        if (!endToolCallId) {
          lastNonToolStep = null;
        }
      }
    }
  }

  if (steps.length === 0) return null;

  return {
    reasoningSteps: steps,
    isReasoningExpanded: false,
    activeStepType: null,
    activeStepContent: '',
  };
}

const INITIAL_STATE: ReActStreamState = {
  reasoningSteps: [],
  isReasoningExpanded: true,
  activeStepType: null,
  activeStepContent: '',
};

let stepIdCounter = 0;

function nextStepId(): string {
  return `step-${++stepIdCounter}`;
}

export function useReActChat(): UseReActChatReturn {
  const [reActState, setReActState] = useState<ReActStreamState>(INITIAL_STATE);
  const activeStepRef = useRef<string>('');

  const resetReActState = useCallback(() => {
    setReActState(INITIAL_STATE);
    activeStepRef.current = '';
  }, []);

  const setIsReasoningExpanded = useCallback((expanded: boolean) => {
    setReActState(prev => ({ ...prev, isReasoningExpanded: expanded }));
  }, []);

  const finalizeActiveStep = useCallback(() => {
    if (!activeStepRef.current) return;
    const stepId = activeStepRef.current;
    setReActState(prev => ({
      ...prev,
      reasoningSteps: prev.reasoningSteps.map(s =>
        s.id === stepId ? { ...s, completedAt: Date.now() } : s
      ),
      activeStepType: null,
      activeStepContent: '',
    }));
    activeStepRef.current = '';
  }, []);

  const onReasoningStart = useCallback((config?: SSEStreamMessage['config']) => {
    finalizeActiveStep();
    const id = nextStepId();
    activeStepRef.current = id;
    const step: ReasoningStep = {
      id,
      type: 'reasoning',
      content: '',
      startedAt: Date.now(),
      agentName: config?.agentName,
      agentId: config?.agentId,
    };
    setReActState(prev => ({
      ...prev,
      reasoningSteps: [...prev.reasoningSteps, step],
      activeStepType: 'reasoning',
      activeStepContent: '',
      isReasoningExpanded: true,
    }));
  }, [finalizeActiveStep]);

  const onReasoningStream = useCallback((content: string) => {
    const stepId = activeStepRef.current;
    if (!stepId) return;
    setReActState(prev => ({
      ...prev,
      activeStepContent: prev.activeStepContent + content,
      reasoningSteps: prev.reasoningSteps.map(s =>
        s.id === stepId ? { ...s, content: s.content + content } : s
      ),
    }));
  }, []);

  const onReasoningEnd = useCallback(() => {
    finalizeActiveStep();
  }, [finalizeActiveStep]);

  const onToolCallStart = useCallback((config?: SSEStreamMessage['config']) => {
    const id = nextStepId();
    const toolCallId = config?.tool_call_id as string | undefined;
    const toolInputRaw = config?.toolInput;
    const step: ReasoningStep = {
      id,
      type: 'tool_call',
      content: '',
      toolCallId,
      toolName: config?.toolName,
      toolInput: typeof toolInputRaw === 'object' ? JSON.stringify(toolInputRaw, null, 2) : toolInputRaw as string | undefined,
      startedAt: Date.now(),
    };
    activeStepRef.current = id;
    setReActState(prev => ({
      ...prev,
      reasoningSteps: [...prev.reasoningSteps, step],
      activeStepType: 'tool_call',
      activeStepContent: '',
      isReasoningExpanded: true,
    }));
  }, []);

  const onToolCallStream = useCallback((content: string) => {
    const stepId = activeStepRef.current;
    if (!stepId) return;
    setReActState(prev => ({
      ...prev,
      activeStepContent: prev.activeStepContent + content,
      reasoningSteps: prev.reasoningSteps.map(s =>
        s.id === stepId ? { ...s, content: s.content + content } : s
      ),
    }));
  }, []);

  const onToolCallEnd = useCallback((config?: SSEStreamMessage['config']) => {
    const endToolCallId = config?.tool_call_id as string | undefined;
    setReActState(prev => {
      const matchIdx = endToolCallId
        ? prev.reasoningSteps.findIndex(s => s.toolCallId === endToolCallId)
        : prev.reasoningSteps.findIndex(s => s.id === activeStepRef.current);
      if (matchIdx === -1) return prev;
      return {
        ...prev,
        reasoningSteps: prev.reasoningSteps.map((s, i) =>
          i === matchIdx
            ? {
                ...s,
                completedAt: Date.now(),
                toolResult: typeof config?.toolResult === 'object' ? JSON.stringify(config.toolResult, null, 2) : config?.toolResult as string | undefined,
                toolName: config?.toolName ?? s.toolName,
              }
            : s
        ),
      };
    });
  }, []);

  const onPlanStart = useCallback((config?: SSEStreamMessage['config']) => {
    finalizeActiveStep();
    const id = nextStepId();
    activeStepRef.current = id;
    const step: ReasoningStep = {
      id,
      type: 'plan',
      content: '',
      startedAt: Date.now(),
      agentName: config?.agentName,
    };
    setReActState(prev => ({
      ...prev,
      reasoningSteps: [...prev.reasoningSteps, step],
      activeStepType: 'plan',
      activeStepContent: '',
      isReasoningExpanded: true,
    }));
  }, [finalizeActiveStep]);

  const onPlanStream = useCallback((content: string) => {
    const stepId = activeStepRef.current;
    if (!stepId) return;
    setReActState(prev => ({
      ...prev,
      activeStepContent: prev.activeStepContent + content,
      reasoningSteps: prev.reasoningSteps.map(s =>
        s.id === stepId ? { ...s, content: s.content + content } : s
      ),
    }));
  }, []);

  const onPlanComplete = useCallback((_config?: SSEStreamMessage['config']) => {
    finalizeActiveStep();
  }, [finalizeActiveStep]);

  const onSubAgentStart = useCallback((config?: SSEStreamMessage['config']) => {
    finalizeActiveStep();
    const id = nextStepId();
    activeStepRef.current = id;
    const step: ReasoningStep = {
      id,
      type: 'sub_agent',
      content: '',
      agentName: config?.agentName,
      agentId: config?.agentId,
      startedAt: Date.now(),
    };
    setReActState(prev => ({
      ...prev,
      reasoningSteps: [...prev.reasoningSteps, step],
      activeStepType: 'sub_agent',
      activeStepContent: '',
      isReasoningExpanded: true,
    }));
  }, [finalizeActiveStep]);

  const onSubAgentStream = useCallback((content: string) => {
    const stepId = activeStepRef.current;
    if (!stepId) return;
    setReActState(prev => ({
      ...prev,
      activeStepContent: prev.activeStepContent + content,
      reasoningSteps: prev.reasoningSteps.map(s =>
        s.id === stepId ? { ...s, content: s.content + content } : s
      ),
    }));
  }, []);

  const onSubAgentEnd = useCallback((_config?: SSEStreamMessage['config']) => {
    finalizeActiveStep();
  }, [finalizeActiveStep]);

  const onSynthesisStart = useCallback((config?: SSEStreamMessage['config']) => {
    finalizeActiveStep();
    const id = nextStepId();
    activeStepRef.current = id;
    const step: ReasoningStep = {
      id,
      type: 'synthesis',
      content: '',
      startedAt: Date.now(),
      agentName: config?.agentName,
    };
    setReActState(prev => ({
      ...prev,
      reasoningSteps: [...prev.reasoningSteps, step],
      activeStepType: 'synthesis',
      activeStepContent: '',
      isReasoningExpanded: true,
    }));
  }, [finalizeActiveStep]);

  const onSynthesisStream = useCallback((content: string) => {
    const stepId = activeStepRef.current;
    if (!stepId) return;
    setReActState(prev => ({
      ...prev,
      activeStepContent: prev.activeStepContent + content,
      reasoningSteps: prev.reasoningSteps.map(s =>
        s.id === stepId ? { ...s, content: s.content + content } : s
      ),
    }));
  }, []);

  const onTrace = useCallback((_config?: SSEStreamMessage['config']) => {
    // Trace events are handled externally
  }, []);

  const onReActStreamEnd = useCallback(() => {
    finalizeActiveStep();
    setReActState(prev => ({
      ...prev,
      isReasoningExpanded: false,
      activeStepType: null,
      activeStepContent: '',
    }));
  }, [finalizeActiveStep]);

  return {
    reActState,
    setIsReasoningExpanded,
    resetReActState,
    hasReasoningSteps: reActState.reasoningSteps.length > 0,
    onReasoningStart,
    onReasoningStream,
    onReasoningEnd,
    onToolCallStart,
    onToolCallStream,
    onToolCallEnd,
    onPlanStart,
    onPlanStream,
    onPlanComplete,
    onSubAgentStart,
    onSubAgentStream,
    onSubAgentEnd,
    onSynthesisStart,
    onSynthesisStream,
    onTrace,
    onReActStreamEnd,
  };
}
