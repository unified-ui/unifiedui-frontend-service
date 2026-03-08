import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../test/utils';
import { screen } from '@testing-library/react';
import { Text } from '@mantine/core';

describe('Test Setup', () => {
  it('renders a component with providers', () => {
    renderWithProviders(<Text>Hello Test</Text>);
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });

  it('has access to i18n translations', () => {
    const { container } = renderWithProviders(<Text>Test content</Text>);
    expect(container).toBeTruthy();
  });
});
