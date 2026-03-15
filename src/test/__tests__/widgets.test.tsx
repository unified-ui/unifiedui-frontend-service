import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../utils';
import { screen, fireEvent } from '@testing-library/react';
import { YesNoWidget } from '../../components/chat/widgets/YesNoWidget';
import { SurveyWidget } from '../../components/chat/widgets/SurveyWidget';
import type { SurveyWidgetData } from '../../api/types';

describe('YesNoWidget', () => {
  it('renders default Yes/No labels', () => {
    renderWithProviders(
      <YesNoWidget onSelect={() => {}} />
    );
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('renders custom labels from data', () => {
    renderWithProviders(
      <YesNoWidget
        data={{ yesLabel: 'Approve', noLabel: 'Reject' }}
        onSelect={() => {}}
      />
    );
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('calls onSelect when a button is clicked', () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <YesNoWidget onSelect={onSelect} />
    );
    fireEvent.click(screen.getByText('Yes'));
    expect(onSelect).toHaveBeenCalledWith('Yes');
  });

  it('highlights selected value', () => {
    renderWithProviders(
      <YesNoWidget onSelect={() => {}} selectedValue="Yes" />
    );
    const yesBtn = screen.getByText('Yes').closest('button');
    expect(yesBtn).not.toBeDisabled();
  });
});

describe('SurveyWidget', () => {
  const surveyData: SurveyWidgetData = {
    title: 'Test Survey',
    questions: [
      { question: 'Q1?', options: ['A', 'B', 'C'] },
      { question: 'Q2?', options: ['X', 'Y'] },
    ],
  };

  it('renders survey title and first question', () => {
    renderWithProviders(
      <SurveyWidget data={surveyData} onSubmit={() => {}} />
    );
    expect(screen.getByText('Test Survey')).toBeInTheDocument();
    expect(screen.getByText('Q1?')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('navigates to next question', () => {
    renderWithProviders(
      <SurveyWidget data={surveyData} onSubmit={() => {}} />
    );
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Q2?')).toBeInTheDocument();
  });

  it('calls onSubmit with answers on submit', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <SurveyWidget data={surveyData} onSubmit={onSubmit} />
    );

    fireEvent.click(screen.getByText('A'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('X'));
    fireEvent.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith({
      'Q1?': 'A',
      'Q2?': 'X',
    });
  });

  it('shows submitted state when submittedAnswers provided', () => {
    renderWithProviders(
      <SurveyWidget
        data={surveyData}
        onSubmit={() => {}}
        submittedAnswers={{ 'Q1?': 'B', 'Q2?': 'Y' }}
      />
    );
    expect(screen.getByText('Survey submitted')).toBeInTheDocument();
  });

  it('submits free text answer instead of option when provided', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <SurveyWidget data={surveyData} onSubmit={onSubmit} />
    );

    const freeTextInput = screen.getByPlaceholderText('Other answer...');
    fireEvent.change(freeTextInput, { target: { value: 'My custom answer' } });
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('X'));
    fireEvent.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith({
      'Q1?': 'My custom answer',
      'Q2?': 'X',
    });
  });

  it('shows free text in other answer field after submission', () => {
    renderWithProviders(
      <SurveyWidget
        data={surveyData}
        onSubmit={() => {}}
        submittedAnswers={{ 'Q1?': 'My custom answer', 'Q2?': 'Y' }}
      />
    );

    const freeTextInput = screen.getByPlaceholderText('Other answer...');
    expect(freeTextInput).toHaveValue('My custom answer');

    const radioA = screen.getByLabelText('A') as HTMLInputElement;
    const radioB = screen.getByLabelText('B') as HTMLInputElement;
    const radioC = screen.getByLabelText('C') as HTMLInputElement;
    expect(radioA.checked).toBe(false);
    expect(radioB.checked).toBe(false);
    expect(radioC.checked).toBe(false);
  });

  it('shows option selected after submission when answer matches option', () => {
    renderWithProviders(
      <SurveyWidget
        data={surveyData}
        onSubmit={() => {}}
        submittedAnswers={{ 'Q1?': 'B', 'Q2?': 'Y' }}
      />
    );

    const freeTextInput = screen.getByPlaceholderText('Other answer...');
    expect(freeTextInput).toHaveValue('');

    const radioB = screen.getByLabelText('B') as HTMLInputElement;
    expect(radioB.checked).toBe(true);
  });
});
