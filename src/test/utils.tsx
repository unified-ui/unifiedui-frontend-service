import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/i18nForTests';

interface WrapperOptions {
  initialRoute?: string;
}

function createWrapper(options: WrapperOptions = {}) {
  const { initialRoute = '/' } = options;

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MantineProvider>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter initialEntries={[initialRoute]}>
            {children}
          </MemoryRouter>
        </I18nextProvider>
      </MantineProvider>
    );
  };
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions & WrapperOptions = {},
) {
  const { initialRoute, ...renderOptions } = options;
  return render(ui, {
    wrapper: createWrapper({ initialRoute }),
    ...renderOptions,
  });
}

export { render };
