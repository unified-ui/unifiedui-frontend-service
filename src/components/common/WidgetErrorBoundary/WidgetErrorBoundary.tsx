import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { Alert } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import classes from './WidgetErrorBoundary.module.css';

interface WidgetErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.warn('[WidgetErrorBoundary] Widget render failed:', error.message);
    console.warn('[WidgetErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  render(): ReactNode {
    const { hasError } = this.state;
    const { children, fallbackMessage } = this.props;

    if (hasError) {
      return (
        <Alert
          color="red"
          variant="light"
          icon={<IconAlertTriangle size={16} />}
          className={classes.errorAlert}
        >
          {fallbackMessage ?? 'Widget could not be rendered'}
        </Alert>
      );
    }

    return children;
  }
}
