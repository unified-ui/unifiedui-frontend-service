import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../utils';
import { screen, fireEvent } from '@testing-library/react';
import { ReasoningSection } from '../../components/chat/ReasoningSection';
import type { ReActStreamState, ReasoningStep } from '../../hooks/chat/useReActChat';

function makeStep(overrides: Partial<ReasoningStep> = {}): ReasoningStep {
  return {
    id: 'step-1',
    type: 'reasoning',
    content: 'Thinking about the request...',
    startedAt: 1000,
    completedAt: 2500,
    ...overrides,
  };
}

function makeState(overrides: Partial<ReActStreamState> = {}): ReActStreamState {
  return {
    reasoningSteps: [makeStep()],
    isReasoningExpanded: true,
    activeStepType: null,
    activeStepContent: '',
    ...overrides,
  };
}

describe('ReasoningSection', () => {
  it('renders nothing when no reasoning steps', () => {
    const state = makeState({ reasoningSteps: [] });
    renderWithProviders(
      <ReasoningSection
        reActState={state}
        isStreaming={false}
        onToggle={() => {}}
      />
    );
    expect(screen.queryByText('Reasoning')).toBeNull();
  });

  it('renders summary bar with step count', () => {
    const state = makeState();
    renderWithProviders(
      <ReasoningSection
        reActState={state}
        isStreaming={false}
        onToggle={() => {}}
      />
    );
    expect(screen.getByText('Reasoning')).toBeInTheDocument();
    expect(screen.getByText(/1 step/)).toBeInTheDocument();
  });

  it('renders streaming badge when streaming', () => {
    const state = makeState();
    renderWithProviders(
      <ReasoningSection
        reActState={state}
        isStreaming={true}
        onToggle={() => {}}
      />
    );
    expect(screen.getByText('Streaming')).toBeInTheDocument();
  });

  it('shows step content when expanded', () => {
    const state = makeState({ isReasoningExpanded: true });
    renderWithProviders(
      <ReasoningSection
        reActState={state}
        isStreaming={false}
        onToggle={() => {}}
      />
    );
    expect(screen.getByText('Thinking about the request...')).toBeInTheDocument();
  });

  it('hides step content when collapsed', () => {
    const state = makeState({ isReasoningExpanded: false });
    renderWithProviders(
      <ReasoningSection
        reActState={state}
        isStreaming={false}
        onToggle={() => {}}
      />
    );
    expect(screen.queryByText('Thinking about the request...')).toBeNull();
  });

  it('calls onToggle when summary bar is clicked', () => {
    const onToggle = vi.fn();
    const state = makeState();
    renderWithProviders(
      <ReasoningSection
        reActState={state}
        isStreaming={false}
        onToggle={onToggle}
      />
    );
    fireEvent.click(screen.getByText('Reasoning'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('always expands when alwaysExpanded is true', () => {
    const state = makeState({ isReasoningExpanded: false });
    renderWithProviders(
      <ReasoningSection
        reActState={state}
        isStreaming={false}
        onToggle={() => {}}
        alwaysExpanded={true}
      />
    );
    expect(screen.getByText('Thinking about the request...')).toBeInTheDocument();
  });

  it('renders tool call step with tool name', () => {
    const toolStep = makeStep({
      type: 'tool_call',
      toolName: 'get_weather',
      toolInput: '{"city": "Berlin"}',
      content: '',
    });
    const state = makeState({ reasoningSteps: [toolStep] });
    renderWithProviders(
      <ReasoningSection
        reActState={state}
        isStreaming={false}
        onToggle={() => {}}
      />
    );
    expect(screen.getByText('get_weather')).toBeInTheDocument();
  });

  it('renders tool call with input and result', () => {
    const toolStep = makeStep({
      type: 'tool_call',
      toolName: 'get_weather',
      toolInput: '{"city": "Berlin"}',
      toolResult: '{"temp": 18}',
      content: '',
    });
    const state = makeState({ reasoningSteps: [toolStep] });
    renderWithProviders(
      <ReasoningSection
        reActState={state}
        isStreaming={false}
        onToggle={() => {}}
      />
    );
    expect(screen.getByText('Input')).toBeInTheDocument();
    expect(screen.getByText('Result')).toBeInTheDocument();
    expect(screen.getByText(/"city": "Berlin"/)).toBeInTheDocument();
    expect(screen.getByText(/"temp": 18/)).toBeInTheDocument();
  });

  it('renders multiple steps', () => {
    const steps: ReasoningStep[] = [
      makeStep({ id: '1', type: 'reasoning', content: 'Step one' }),
      makeStep({ id: '2', type: 'tool_call', toolName: 'search', content: '' }),
      makeStep({ id: '3', type: 'reasoning', content: 'Step three' }),
    ];
    const state = makeState({ reasoningSteps: steps });
    renderWithProviders(
      <ReasoningSection
        reActState={state}
        isStreaming={false}
        onToggle={() => {}}
      />
    );
    expect(screen.getByText(/3 steps/)).toBeInTheDocument();
    expect(screen.getByText('Step one')).toBeInTheDocument();
    expect(screen.getByText('search')).toBeInTheDocument();
    expect(screen.getByText('Step three')).toBeInTheDocument();
  });

  it('renders sub-agent step with agent name', () => {
    const subAgentStep = makeStep({
      type: 'sub_agent',
      agentName: 'research-agent',
      content: 'Researching...',
    });
    const state = makeState({ reasoningSteps: [subAgentStep] });
    renderWithProviders(
      <ReasoningSection
        reActState={state}
        isStreaming={false}
        onToggle={() => {}}
      />
    );
    expect(screen.getByText('research-agent')).toBeInTheDocument();
    expect(screen.getByText('Researching...')).toBeInTheDocument();
  });

  it('renders synthesis step', () => {
    const synthesisStep = makeStep({
      type: 'synthesis',
      content: 'Combining results...',
    });
    const state = makeState({ reasoningSteps: [synthesisStep] });
    renderWithProviders(
      <ReasoningSection
        reActState={state}
        isStreaming={false}
        onToggle={() => {}}
      />
    );
    expect(screen.getByText('Synthesizing')).toBeInTheDocument();
    expect(screen.getByText('Combining results...')).toBeInTheDocument();
  });

  it('renders plan step', () => {
    const planStep = makeStep({
      type: 'plan',
      content: '1. Fetch data\n2. Process',
    });
    const state = makeState({ reasoningSteps: [planStep] });
    renderWithProviders(
      <ReasoningSection
        reActState={state}
        isStreaming={false}
        onToggle={() => {}}
      />
    );
    expect(screen.getByText('Plan')).toBeInTheDocument();
  });

  it('shows duration in summary', () => {
    const step = makeStep({ startedAt: 1000, completedAt: 5200 });
    const state = makeState({ reasoningSteps: [step] });
    renderWithProviders(
      <ReasoningSection
        reActState={state}
        isStreaming={false}
        onToggle={() => {}}
      />
    );
    const matches = screen.getAllByText(/4\.2/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows tool count in summary', () => {
    const steps: ReasoningStep[] = [
      makeStep({ id: '1', type: 'reasoning', content: 'Think' }),
      makeStep({ id: '2', type: 'tool_call', toolName: 'a', content: '' }),
      makeStep({ id: '3', type: 'tool_call', toolName: 'b', content: '' }),
    ];
    const state = makeState({ reasoningSteps: steps });
    renderWithProviders(
      <ReasoningSection
        reActState={state}
        isStreaming={false}
        onToggle={() => {}}
      />
    );
    expect(screen.getByText(/2 tools/)).toBeInTheDocument();
  });

  it('has accessible toggle button', () => {
    const state = makeState();
    renderWithProviders(
      <ReasoningSection
        reActState={state}
        isStreaming={false}
        onToggle={() => {}}
      />
    );
    const toggleBtn = screen.getByRole('button', { name: /toggle reasoning/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
  });
});
