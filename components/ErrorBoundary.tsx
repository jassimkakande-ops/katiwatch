'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#0a0a0a',
            color: '#f5f5f5',
            padding: '20px',
            fontFamily: 'monospace',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                background: '#E50914',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '18px',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '8px',
              }}
            >
              ⚠️ Katiwatch — App Error (Debug Mode)
            </div>
            <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>
              This screen is only shown to help diagnose a bug. Screenshot this and send it to the developer.
            </p>
          </div>

          {/* Error message */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: '#ff6b6b', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>
              ERROR MESSAGE:
            </div>
            <div
              style={{
                background: '#1a1a1a',
                border: '1px solid #ff6b6b',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '13px',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                color: '#ff9999',
              }}
            >
              {error?.name}: {error?.message}
            </div>
          </div>

          {/* Stack trace */}
          {error?.stack && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: '#ffd93d', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>
                STACK TRACE:
              </div>
              <div
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '11px',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  color: '#ccc',
                  maxHeight: '300px',
                  overflowY: 'auto',
                }}
              >
                {error.stack}
              </div>
            </div>
          )}

          {/* Component stack */}
          {errorInfo?.componentStack && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: '#6bcb77', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>
                COMPONENT STACK:
              </div>
              <div
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '11px',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  color: '#ccc',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {errorInfo.componentStack}
              </div>
            </div>
          )}

          {/* User agent */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: '#74b9ff', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>
              BROWSER / DEVICE:
            </div>
            <div
              style={{
                background: '#1a1a1a',
                border: '1px solid #444',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '11px',
                wordBreak: 'break-word',
                color: '#ccc',
              }}
            >
              {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}
            </div>
          </div>

          {/* Retry button */}
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#E50914',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
