import React, { Component, ReactNode } from 'react';
import { useTheme } from './ThemeContext';

interface Props {
  children: ReactNode;
  storyId?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundaryClass extends Component<Props & { colors: any }, State> {
  constructor(props: Props & { colors: any }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Story rendering error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  componentDidUpdate(prevProps: Props & { colors: any }) {
    // Reset error state when navigating to a different story
    if (this.props.storyId !== prevProps.storyId && this.state.hasError) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  render() {
    if (this.state.hasError) {
      const { colors } = this.props;
      return (
        <div
          style={{
            padding: '2em',
            background: colors.bgSection,
            border: `2px solid ${colors.borderLight}`,
            borderRadius: 8,
            maxWidth: 800,
            margin: '2em auto',
          }}
        >
          <h1 style={{ color: '#ff6b6b', marginBottom: '0.5em', fontSize: '1.5em' }}>
            ⚠️ Story Error
          </h1>
          <p style={{ color: colors.text, marginBottom: '1em' }}>
            This story encountered an error while rendering. The error details are shown below.
          </p>

          {this.state.error && (
            <div
              style={{
                background: colors.bgHeader,
                padding: '1em',
                borderRadius: 6,
                marginBottom: '1em',
                border: `1px solid ${colors.border}`,
              }}
            >
              <h3 style={{ color: colors.textBright, fontSize: '1em', marginBottom: '0.5em' }}>
                Error Message:
              </h3>
              <pre
                style={{
                  color: '#ff6b6b',
                  fontSize: '0.9em',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                }}
              >
                {this.state.error.message}
              </pre>
            </div>
          )}

          {this.state.errorInfo && (
            <details style={{ marginTop: '1em' }}>
              <summary
                style={{
                  color: colors.textMuted,
                  cursor: 'pointer',
                  fontSize: '0.9em',
                  marginBottom: '0.5em',
                }}
              >
                Stack Trace (click to expand)
              </summary>
              <pre
                style={{
                  background: colors.bgHeader,
                  padding: '1em',
                  borderRadius: 6,
                  fontSize: '0.75em',
                  overflow: 'auto',
                  color: colors.textDim,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div
            style={{
              marginTop: '1.5em',
              padding: '1em',
              background: colors.bg,
              borderRadius: 6,
              fontSize: '0.9em',
            }}
          >
            <p style={{ color: colors.textMuted, margin: 0 }}>
              💡 <strong>Tip:</strong> You can continue navigating to other stories using the
              sidebar. This error only affects the current story.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper to inject theme colors
export default function ErrorBoundary({ children, storyId }: Props) {
  const { colors } = useTheme();
  return (
    <ErrorBoundaryClass colors={colors} storyId={storyId}>
      {children}
    </ErrorBoundaryClass>
  );
}
