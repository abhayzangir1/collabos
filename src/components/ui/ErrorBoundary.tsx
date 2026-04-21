import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <div className="empty-state-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'var(--error)', color: 'var(--error)' }}>
            <AlertTriangle size={32} />
          </div>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Something went wrong</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button
            className="neu-btn neu-btn-secondary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function LoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem',
      gap: '0.75rem',
    }}>
      <div className="spinner" />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Loading...</span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px' }}>{description}</p>
      {actionLabel && onAction && (
        <button className="neu-btn neu-btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ConnectionError({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid var(--error)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.8rem',
        color: 'var(--error)',
      }}
    >
      <AlertTriangle size={14} />
      Connection error.
      <button
        onClick={onRefresh}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent)',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.8rem',
          textDecoration: 'underline',
        }}
      >
        Refresh
      </button>
    </div>
  );
}
