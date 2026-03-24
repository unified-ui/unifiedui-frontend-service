import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../utils';
import { screen, fireEvent } from '@testing-library/react';
import { TabBar } from '../../pages/WidgetDesignerPage/TabBar';
import type { WidgetTab } from '../../pages/WidgetDesignerPage/types';

const defaultTabs: WidgetTab[] = [
  { id: 'tab_1', label: 'First Tab', fieldIds: [] },
  { id: 'tab_2', label: 'Second Tab', fieldIds: [] },
  { id: 'tab_3', label: 'Third Tab', fieldIds: [] },
];

const renderTabBar = (overrides = {}) => {
  const props = {
    tabs: defaultTabs,
    activeTabIndex: 0,
    onSelectTab: vi.fn(),
    onAddTab: vi.fn(),
    onRemoveTab: vi.fn(),
    onRenameTab: vi.fn(),
    onMoveTab: vi.fn(),
    ...overrides,
  };
  renderWithProviders(<TabBar {...props} />);
  return props;
};

describe('TabBar', () => {
  it('renders all tab labels', () => {
    renderTabBar();
    expect(screen.getByText('First Tab')).toBeInTheDocument();
    expect(screen.getByText('Second Tab')).toBeInTheDocument();
    expect(screen.getByText('Third Tab')).toBeInTheDocument();
  });

  it('calls onSelectTab when clicking a tab', () => {
    const props = renderTabBar();
    fireEvent.click(screen.getByText('Second Tab'));
    expect(props.onSelectTab).toHaveBeenCalledWith(1);
  });

  it('calls onAddTab when clicking add button', () => {
    const props = renderTabBar();
    const addButton = screen.getByTitle(/add tab/i);
    fireEvent.click(addButton);
    expect(props.onAddTab).toHaveBeenCalled();
  });

  it('renders add tab button', () => {
    renderTabBar();
    expect(screen.getByTitle(/add tab/i)).toBeInTheDocument();
  });

  it('hides close buttons when only one tab exists', () => {
    const singleTab = [{ id: 'tab_1', label: 'Only Tab', fieldIds: [] }];
    renderTabBar({ tabs: singleTab });
    const buttons = screen.getAllByRole('button');
    const closeButtons = buttons.filter((b) => b.querySelector('.tabler-icon-x'));
    expect(closeButtons).toHaveLength(0);
  });

  it('shows close buttons when multiple tabs exist', () => {
    renderTabBar();
    const buttons = screen.getAllByRole('button');
    const closeButtons = buttons.filter((b) => b.querySelector('.tabler-icon-x'));
    expect(closeButtons.length).toBeGreaterThanOrEqual(3);
  });
});
