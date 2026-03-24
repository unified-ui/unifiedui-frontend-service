import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../utils';
import { screen, fireEvent } from '@testing-library/react';
import { VisibilityRulesEditor } from '../../pages/WidgetDesignerPage/VisibilityRulesEditor';
import type { WidgetFieldConfig, VisibilityConfig } from '../../pages/WidgetDesignerPage/types';

const makeField = (id: string, label: string): WidgetFieldConfig => ({
  id,
  type: 'text',
  label,
  placeholder: '',
  required: false,
  config: {},
  layout: { colSpan: 12 },
  validation: {},
});

const sampleFields: WidgetFieldConfig[] = [
  makeField('name', 'Name'),
  makeField('email', 'Email'),
  makeField('phone', 'Phone'),
];

describe('VisibilityRulesEditor', () => {
  it('renders add rule button when no rules exist', () => {
    renderWithProviders(
      <VisibilityRulesEditor
        visibility={undefined}
        allFields={sampleFields}
        currentFieldId="name"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/add rule/i)).toBeInTheDocument();
  });

  it('renders existing rules', () => {
    const visibility: VisibilityConfig = {
      condition: 'AND',
      rules: [{ fieldId: 'email', operator: 'equals', value: 'test@test.com' }],
    };
    renderWithProviders(
      <VisibilityRulesEditor
        visibility={visibility}
        allFields={sampleFields}
        currentFieldId="name"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue('test@test.com')).toBeInTheDocument();
  });

  it('calls onChange when adding a rule', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <VisibilityRulesEditor
        visibility={undefined}
        allFields={sampleFields}
        currentFieldId="name"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText(/add rule/i));
    expect(onChange).toHaveBeenCalled();
    const visibility = onChange.mock.calls[0][0] as VisibilityConfig;
    expect(visibility.rules).toHaveLength(1);
    expect(visibility.rules[0].operator).toBe('equals');
  });

  it('calls onChange when removing a rule', () => {
    const visibility: VisibilityConfig = {
      condition: 'AND',
      rules: [
        { fieldId: 'email', operator: 'equals', value: 'test' },
        { fieldId: 'phone', operator: 'contains', value: '123' },
      ],
    };
    const onChange = vi.fn();
    renderWithProviders(
      <VisibilityRulesEditor
        visibility={visibility}
        allFields={sampleFields}
        currentFieldId="name"
        onChange={onChange}
      />,
    );
    const buttons = screen.getAllByRole('button');
    const removeButtons = buttons.filter((b) => b.querySelector('.tabler-icon-x'));
    fireEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalled();
  });

  it('shows AND/OR selector when multiple rules exist', () => {
    const visibility: VisibilityConfig = {
      condition: 'AND',
      rules: [
        { fieldId: 'email', operator: 'equals', value: 'a' },
        { fieldId: 'phone', operator: 'equals', value: 'b' },
      ],
    };
    renderWithProviders(
      <VisibilityRulesEditor
        visibility={visibility}
        allFields={sampleFields}
        currentFieldId="name"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('AND')).toBeInTheDocument();
    expect(screen.getByText('OR')).toBeInTheDocument();
  });

  it('does not show AND/OR when zero or one rule', () => {
    renderWithProviders(
      <VisibilityRulesEditor
        visibility={undefined}
        allFields={sampleFields}
        currentFieldId="name"
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByText('AND')).not.toBeInTheDocument();
  });
});
