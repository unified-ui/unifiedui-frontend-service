import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../utils';
import { screen, fireEvent } from '@testing-library/react';
import { YesNoWidget } from '../../components/chat/widgets/YesNoWidget';
import { SurveyWidget } from '../../components/chat/widgets/SurveyWidget';
import { FormWidget } from '../../components/chat/widgets/FormWidget';
import type { SurveyWidgetData } from '../../api/types';
import { parseWidgetTag, isStandardWidgetId } from '../../utils/widgetParser';
import type { FormFieldConfig } from '../../pages/WidgetDesignerPage/types';

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

describe('FormWidget', () => {
  const fields: FormFieldConfig[] = [
    { id: 'f1', type: 'text', label: 'Name', placeholder: 'Enter name', required: true },
    { id: 'f2', type: 'select', label: 'Color', options: ['Red', 'Blue', 'Green'] },
    { id: 'f3', type: 'toggle', label: 'Active', default_value: false },
  ];

  it('renders form fields', () => {
    renderWithProviders(
      <FormWidget fields={fields} onSubmit={() => {}} />
    );
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByLabelText(/Active/)).toBeInTheDocument();
  });

  it('submits form data as JSON', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <FormWidget fields={fields} onSubmit={onSubmit} />
    );

    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Alice' } });
    fireEvent.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submitted = JSON.parse(onSubmit.mock.calls[0][0]);
    expect(submitted['Name']).toBe('Alice');
  });

  it('shows submitted state with badge', () => {
    const submittedData = JSON.stringify({ Name: 'Alice', Color: 'Red', Active: true });
    renderWithProviders(
      <FormWidget fields={fields} onSubmit={() => {}} submittedData={submittedData} />
    );
    expect(screen.getByText('Form submitted')).toBeInTheDocument();
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });

  it('disables fields when disabled prop is true', () => {
    renderWithProviders(
      <FormWidget fields={fields} onSubmit={() => {}} disabled />
    );
    expect(screen.getByLabelText(/Name/)).toBeDisabled();
  });

  it('pre-fills from widgetData', () => {
    renderWithProviders(
      <FormWidget fields={fields} onSubmit={() => {}} widgetData={{ f1: 'Prefilled' }} />
    );
    expect(screen.getByLabelText(/Name/)).toHaveValue('Prefilled');
  });
});

describe('parseWidgetTag', () => {
  it('parses custom widget ID', () => {
    const content = 'Here is your form: <$_WGET _id=abc-123 d={"name":"test"} />';
    const parsed = parseWidgetTag(content);
    expect(parsed.widget?.id).toBe('abc-123');
    expect(parsed.textBefore).toBe('Here is your form:');
  });

  it('returns null widget for no tag', () => {
    const content = 'Just text, no widget here.';
    const parsed = parseWidgetTag(content);
    expect(parsed.widget).toBeNull();
  });
});

describe('isStandardWidgetId', () => {
  it('returns true for yesno', () => {
    expect(isStandardWidgetId('yesno')).toBe(true);
  });

  it('returns true for survey', () => {
    expect(isStandardWidgetId('survey')).toBe(true);
  });

  it('returns false for custom UUID', () => {
    expect(isStandardWidgetId('abc-123-def')).toBe(false);
  });
});
