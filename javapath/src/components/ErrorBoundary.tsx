import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{ padding: '48px 24px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 8 }}>页面出现异常</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
            {this.state.error?.message ?? '未知错误'}
          </p>
          <button
            type="button"
            className="primary-btn"
            onClick={this.handleReset}
          >
            重新加载
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
