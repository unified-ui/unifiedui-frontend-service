import { describe, it, expect } from 'vitest';
import { DemoModeRenderer } from '../../pages/WidgetDesignerPage/DemoModeRenderer';
import { renderWithProviders } from '../utils';
import { screen } from '@testing-library/react';
import type { WidgetFormSchema } from '../../pages/WidgetDesignerPage/types';

const makeSchema = (overrides?: Partial<WidgetFormSchema>): WidgetFormSchema => ({
  version: 2,
  settings: {
    title: 'Demo Form',
    description: 'Test description',
    submitButtonText: 'Submit',
    successMessage: 'Done',
    enableTabs: false,
    showProgressBar: false,
    validateOnTabChange: false,
  },
  tabs: [{
    id: 'tab_1',
    label: 'Tab 1',
    fields: [
      {
        id: 'text_1',
        type: 'text',
        label: 'Name',
        placeholder: 'Enter name',
        config: {},
        layout: { colSpan: 6 },
        validation: [{ type: 'required' }],
      },
      {
        id: 'email_1',
        type: 'email',
        label: 'Email',
        placeholder: 'Enter email',
        config: {},
        layout: { colSpan: 6 },
        validation: [],
      },
    ],
  }],
  dataSources: [],
  scripts: {},
  ...overrides,
});

describe('DemoModeRenderer', () => {
  it('renders form fields from schema', () => {
    renderWithProviders(<DemoModeRenderer schema={makeSchema()} />);
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('renders with empty fields', () => {
    const emptySchema = makeSchema({ tabs: [{ id: 'tab_1', label: 'Tab 1', fields: [] }] });
    renderWithProviders(<DemoModeRenderer schema={emptySchema} />);
    expect(screen.getByRole('button', { name: /payload/i })).toBeInTheDocument();
  });

  it('renders the show payload button', () => {
    renderWithProviders(<DemoModeRenderer schema={makeSchema()} />);
    expect(screen.getByRole('button', { name: /payload/i })).toBeInTheDocument();
  });
});
