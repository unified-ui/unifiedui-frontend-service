import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReActChat } from '../../hooks/chat/useReActChat';

describe('useReActChat', () => {
  it('initializes with empty state', () => {
    const { result } = renderHook(() => useReActChat());

    expect(result.current.reActState.reasoningSteps).toEqual([]);
    expect(result.current.reActState.isReasoningExpanded).toBe(true);
    expect(result.current.reActState.activeStepType).toBeNull();
    expect(result.current.reActState.activeStepContent).toBe('');
    expect(result.current.hasReasoningSteps).toBe(false);
  });

  it('handles reasoning start/stream/end lifecycle', () => {
    const { result } = renderHook(() => useReActChat());

    act(() => {
      result.current.onReasoningStart();
    });
    expect(result.current.reActState.reasoningSteps).toHaveLength(1);
    expect(result.current.reActState.reasoningSteps[0].type).toBe('reasoning');
    expect(result.current.reActState.activeStepType).toBe('reasoning');
    expect(result.current.hasReasoningSteps).toBe(true);

    act(() => {
      result.current.onReasoningStream('Hello ');
    });
    expect(result.current.reActState.activeStepContent).toBe('Hello ');
    expect(result.current.reActState.reasoningSteps[0].content).toBe('Hello ');

    act(() => {
      result.current.onReasoningStream('world');
    });
    expect(result.current.reActState.activeStepContent).toBe('Hello world');
    expect(result.current.reActState.reasoningSteps[0].content).toBe('Hello world');

    act(() => {
      result.current.onReasoningEnd();
    });
    expect(result.current.reActState.activeStepType).toBeNull();
    expect(result.current.reActState.activeStepContent).toBe('');
    expect(result.current.reActState.reasoningSteps[0].completedAt).toBeDefined();
  });

  it('handles tool call start/stream/end lifecycle', () => {
    const { result } = renderHook(() => useReActChat());

    act(() => {
      result.current.onToolCallStart({ toolName: 'get_weather', toolInput: '{"city":"Berlin"}' });
    });
    expect(result.current.reActState.reasoningSteps).toHaveLength(1);
    expect(result.current.reActState.reasoningSteps[0].type).toBe('tool_call');
    expect(result.current.reActState.reasoningSteps[0].toolName).toBe('get_weather');
    expect(result.current.reActState.reasoningSteps[0].toolInput).toBe('{"city":"Berlin"}');

    act(() => {
      result.current.onToolCallStream('Fetching...');
    });
    expect(result.current.reActState.reasoningSteps[0].content).toBe('Fetching...');

    act(() => {
      result.current.onToolCallEnd({ toolName: 'get_weather', toolResult: '{"temp": 18}' } as Record<string, unknown>);
    });
    expect(result.current.reActState.reasoningSteps[0].toolResult).toBe('{\n  "temp": 18\n}');
    expect(result.current.reActState.reasoningSteps[0].completedAt).toBeDefined();
    expect(result.current.reActState.activeStepType).toBeNull();
  });

  it('handles plan start/stream/complete lifecycle', () => {
    const { result } = renderHook(() => useReActChat());

    act(() => {
      result.current.onPlanStart();
    });
    expect(result.current.reActState.reasoningSteps).toHaveLength(1);
    expect(result.current.reActState.reasoningSteps[0].type).toBe('plan');

    act(() => {
      result.current.onPlanStream('1. Fetch data\n2. Process\n3. Respond');
    });
    expect(result.current.reActState.reasoningSteps[0].content).toBe('1. Fetch data\n2. Process\n3. Respond');

    act(() => {
      result.current.onPlanComplete();
    });
    expect(result.current.reActState.activeStepType).toBeNull();
    expect(result.current.reActState.reasoningSteps[0].completedAt).toBeDefined();
  });

  it('handles sub-agent start/stream/end lifecycle', () => {
    const { result } = renderHook(() => useReActChat());

    act(() => {
      result.current.onSubAgentStart({ agentName: 'research-agent', agentId: 'agent-1' });
    });
    expect(result.current.reActState.reasoningSteps).toHaveLength(1);
    expect(result.current.reActState.reasoningSteps[0].type).toBe('sub_agent');
    expect(result.current.reActState.reasoningSteps[0].agentName).toBe('research-agent');
    expect(result.current.reActState.reasoningSteps[0].agentId).toBe('agent-1');

    act(() => {
      result.current.onSubAgentStream('Processing...');
    });
    expect(result.current.reActState.reasoningSteps[0].content).toBe('Processing...');

    act(() => {
      result.current.onSubAgentEnd();
    });
    expect(result.current.reActState.activeStepType).toBeNull();
  });

  it('handles synthesis start/stream lifecycle', () => {
    const { result } = renderHook(() => useReActChat());

    act(() => {
      result.current.onSynthesisStart();
    });
    expect(result.current.reActState.reasoningSteps).toHaveLength(1);
    expect(result.current.reActState.reasoningSteps[0].type).toBe('synthesis');

    act(() => {
      result.current.onSynthesisStream('Combining results...');
    });
    expect(result.current.reActState.reasoningSteps[0].content).toBe('Combining results...');
  });

  it('handles multiple steps in sequence', () => {
    const { result } = renderHook(() => useReActChat());

    act(() => {
      result.current.onReasoningStart();
      result.current.onReasoningStream('Thinking about weather...');
      result.current.onReasoningEnd();
    });
    expect(result.current.reActState.reasoningSteps).toHaveLength(1);

    act(() => {
      result.current.onToolCallStart({ toolName: 'get_weather' });
      result.current.onToolCallEnd({ toolResult: '{"temp": 18}' } as Record<string, unknown>);
    });
    expect(result.current.reActState.reasoningSteps).toHaveLength(2);

    act(() => {
      result.current.onReasoningStart();
      result.current.onReasoningStream('Now I have data...');
      result.current.onReasoningEnd();
    });
    expect(result.current.reActState.reasoningSteps).toHaveLength(3);
    expect(result.current.reActState.reasoningSteps[0].type).toBe('reasoning');
    expect(result.current.reActState.reasoningSteps[1].type).toBe('tool_call');
    expect(result.current.reActState.reasoningSteps[2].type).toBe('reasoning');
  });

  it('collapses reasoning on stream end', () => {
    const { result } = renderHook(() => useReActChat());

    act(() => {
      result.current.onReasoningStart();
      result.current.onReasoningStream('Thinking...');
    });
    expect(result.current.reActState.isReasoningExpanded).toBe(true);

    act(() => {
      result.current.onReActStreamEnd();
    });
    expect(result.current.reActState.isReasoningExpanded).toBe(false);
    expect(result.current.reActState.activeStepType).toBeNull();
  });

  it('resets state correctly', () => {
    const { result } = renderHook(() => useReActChat());

    act(() => {
      result.current.onReasoningStart();
      result.current.onReasoningStream('Some text');
      result.current.onReasoningEnd();
    });
    expect(result.current.reActState.reasoningSteps).toHaveLength(1);

    act(() => {
      result.current.resetReActState();
    });
    expect(result.current.reActState.reasoningSteps).toEqual([]);
    expect(result.current.reActState.isReasoningExpanded).toBe(true);
    expect(result.current.reActState.activeStepType).toBeNull();
    expect(result.current.hasReasoningSteps).toBe(false);
  });

  it('allows manual toggle of reasoning expansion', () => {
    const { result } = renderHook(() => useReActChat());

    act(() => {
      result.current.onReasoningStart();
      result.current.onReasoningEnd();
    });

    expect(result.current.reActState.isReasoningExpanded).toBe(true);

    act(() => {
      result.current.setIsReasoningExpanded(false);
    });
    expect(result.current.reActState.isReasoningExpanded).toBe(false);

    act(() => {
      result.current.setIsReasoningExpanded(true);
    });
    expect(result.current.reActState.isReasoningExpanded).toBe(true);
  });

  it('finalizes previous step when new step starts', () => {
    const { result } = renderHook(() => useReActChat());

    act(() => {
      result.current.onReasoningStart();
      result.current.onReasoningStream('Thinking...');
    });
    expect(result.current.reActState.reasoningSteps[0].completedAt).toBeUndefined();

    act(() => {
      result.current.onToolCallStart({ toolName: 'search' });
    });
    expect(result.current.reActState.reasoningSteps[0].completedAt).toBeDefined();
    expect(result.current.reActState.reasoningSteps).toHaveLength(2);
    expect(result.current.reActState.activeStepType).toBe('tool_call');
  });
});
