import { Component, type ErrorInfo, type ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Defensive logging without crashing
    if (typeof console !== 'undefined' && console.error) {
      console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    }
  }

  private handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="section-card"
          style={{
            margin: '40px auto',
            maxWidth: '500px',
            textAlign: 'center',
            borderColor: 'var(--color-danger)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-xl)',
              color: 'var(--color-danger)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-4)',
            }}
          >
            An unexpected error occurred while running the timer. Your data remains safely stored.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={this.handleReload}
            aria-label="Reload application"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
