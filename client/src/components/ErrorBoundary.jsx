import React from 'react';

/**
 * ErrorBoundary to catch unexpected runtime errors in child component trees
 * and render a graceful fallback UI instead of unmounting the entire application
 * to a black screen.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.handleReset,
        });
      }

      return (
        <div
          style={{
            padding: '20px',
            margin: '16px',
            backgroundColor: '#18181b',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '10px',
            color: '#f4f4f5',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '22px' }}>
              error
            </span>
            <strong style={{ fontSize: '1rem', color: '#f87171' }}>
              {this.props.title || 'An error occurred in this view'}
            </strong>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: '0 0 12px 0' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={this.handleReset}
              className="btn btn-small btn-primary"
              style={{
                padding: '6px 14px',
                backgroundColor: 'var(--accent, #38bdf8)',
                color: '#000',
                fontWeight: '600',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn btn-small btn-ghost"
              style={{
                padding: '6px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

