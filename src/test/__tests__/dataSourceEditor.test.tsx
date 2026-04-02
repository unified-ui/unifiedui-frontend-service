import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../utils';
import { screen, fireEvent } from '@testing-library/react';
import { DataSourceEditor } from '../../pages/WidgetDesignerPage/DataSourceEditor';
import type { DataSourceConfig, WidgetFieldConfig } from '../../pages/WidgetDesignerPage/types';

const sampleFields: WidgetFieldConfig[] = [
  {
    id: 'country',
    type: 'select',
    label: 'Country',
    placeholder: '',
    config: { options: ['US', 'DE'] },
    layout: { colSpan: 12 },
    validation: [],
  },
];

describe('DataSourceEditor', () => {
  it('renders add data source button when empty', () => {
    renderWithProviders(
      <DataSourceEditor
        dataSources={[]}
        allFields={sampleFields}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/add data source/i)).toBeInTheDocument();
  });

  it('renders existing data sources', () => {
    const sources: DataSourceConfig[] = [
      { id: 'countries', type: 'static' },
    ];
    renderWithProviders(
      <DataSourceEditor
        dataSources={sources}
        allFields={sampleFields}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('countries')).toBeInTheDocument();
  });

  it('calls onChange when adding a data source', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <DataSourceEditor
        dataSources={[]}
        allFields={sampleFields}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText(/add data source/i));
    expect(onChange).toHaveBeenCalled();
    const newSources = onChange.mock.calls[0][0] as DataSourceConfig[];
    expect(newSources).toHaveLength(1);
    expect(newSources[0].type).toBe('static');
  });

  it('calls onChange when removing a data source', () => {
    const sources: DataSourceConfig[] = [
      { id: 'src1', type: 'static' },
      { id: 'src2', type: 'api', url: 'https://api.example.com', method: 'GET' },
    ];
    const onChange = vi.fn();
    renderWithProviders(
      <DataSourceEditor
        dataSources={sources}
        allFields={sampleFields}
        onChange={onChange}
      />,
    );
    const buttons = screen.getAllByRole('button');
    const removeButtons = buttons.filter((b) => b.querySelector('.tabler-icon-x'));
    fireEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith([sources[1]]);
  });

  it('renders multiple data sources', () => {
    const sources: DataSourceConfig[] = [
      { id: 'src1', type: 'static' },
      { id: 'src2', type: 'api', url: 'https://api.example.com', method: 'GET' },
    ];
    renderWithProviders(
      <DataSourceEditor
        dataSources={sources}
        allFields={sampleFields}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('src1')).toBeInTheDocument();
    expect(screen.getByText('src2')).toBeInTheDocument();
  });
});
