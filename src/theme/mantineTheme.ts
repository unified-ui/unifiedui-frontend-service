import { createTheme } from '@mantine/core';
import { colors } from './colors';

export const theme = createTheme({
  // Color Palette
  colors: {
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    gray: colors.gray,
  },
  
  // Primary Color (verwendet für Buttons, Links, etc.)
  primaryColor: 'primary',
  
  // Font Families
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace: '"Fira Code", Monaco, "Courier New", monospace',
  
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '32px', lineHeight: '1.2' },
      h2: { fontSize: '24px', lineHeight: '1.2' },
      h3: { fontSize: '20px', lineHeight: '1.3' },
      h4: { fontSize: '18px', lineHeight: '1.4' },
      h5: { fontSize: '16px', lineHeight: '1.5' },
      h6: { fontSize: '14px', lineHeight: '1.5' },
    },
  },

  // Font Sizes
  fontSizes: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
  },

  // Spacing System
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },

  // Border Radius
  radius: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },

  // Shadows (Light Mode optimiert)
  shadows: {
    xs: '0 1px 3px rgba(0, 0, 0, 0.05)',
    sm: '0 2px 8px rgba(0, 0, 0, 0.08)',
    md: '0 4px 12px rgba(0, 0, 0, 0.12)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.16)',
    xl: '0 16px 48px rgba(0, 0, 0, 0.2)',
  },

  // Breakpoints (Responsive)
  breakpoints: {
    xs: '576px',
    sm: '768px',
    md: '992px',
    lg: '1200px',
    xl: '1400px',
  },

  // Component Default Props
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Paper: {
      defaultProps: {
        shadow: 'sm',
        radius: 'md',
        p: 'md',
      },
    },
    Card: {
      defaultProps: {
        shadow: 'sm',
        radius: 'md',
        padding: 'lg',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'lg',
        shadow: 'xl',
      },
    },
    Input: {
      defaultProps: {
        radius: 'sm',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'sm',
      },
    },
  },

  // Other Settings
  defaultRadius: 'md',
  cursorType: 'pointer',
  
  // Focus Ring
  focusRing: 'auto',
  
  // Active Styles
  activeClassName: 'mantine-active',
  
  // Default Gradient
  defaultGradient: {
    from: 'primary.6',
    to: 'secondary.6',
    deg: 45,
  },
});

// Dark Theme Variante
export const darkTheme = createTheme({
  ...theme,
  
  // Dark Mode spezifische Schatten (stärker)
  shadows: {
    xs: '0 1px 3px rgba(0, 0, 0, 0.3)',
    sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
    md: '0 4px 12px rgba(0, 0, 0, 0.5)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.6)',
    xl: '0 16px 48px rgba(0, 0, 0, 0.7)',
  },
});

