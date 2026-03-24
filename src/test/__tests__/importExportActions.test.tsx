import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../utils';
import { screen } from '@testing-library/react';
import { ImportExportActions } from '../../pages/WidgetDesignerPage/ImportExportActions';
import type { WidgetFormSchema } from '../../pages/WidgetDesignerPage/types';

const schema: WidgetFormSchema = {
  version: 2,
  settings: {
    title: 'Test Widget',
    description: '',
    submitButtonText: 'Submit',
    successMessage: '',
    enableTabs: false,
    showProgressBar: false,
    validateOnTabChange: false,
  },
  tabs: [{ id: 'tab_1', label: 'Tab 1', fieldIds: [] }],
  fields: [],
  dataSources: [],
  scripts: {},
};

describe('ImportExportActions', () => {
  it('renders the menu trigger button', () => {
    renderWithProviders(
      <ImportExportActions
        schema={schema}
        widgetName="Test Widget"
        onImport={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders hidden file input for import', () => {
    const { container } = renderWithProviders(
      <ImportExportActions
        schema={schema}
        widgetName="Test Widget"
        onImport={vi.fn()}
      />,
    );
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', '.json');
  });
});
