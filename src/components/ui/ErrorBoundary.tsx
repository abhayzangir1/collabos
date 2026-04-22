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
    if (
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Importing a module script failed')
    ) {
      if (!sessionStorage.getItem('vite_chunk_reload')) {
        sessionStorage.setItem('vite_chunk_reload', 'true');
        window.location.reload();
      }
    }
    return { hasError: true, error };
  }

  componentDidMount() {
    sessionStorage.removeItem('vite_chunk_reload');
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
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      {/* Header skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton-block" style={{ width: '180px', height: '28px', borderRadius: 'var(--radius-sm)' }} />
        <div className="skeleton-block" style={{ width: '100px', height: '32px', borderRadius: 'var(--radius-sm)' }} />
      </div>
      {/* Cards skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-1)',
            border: '1px solid var(--surface-1-border)',
          }}>
            <div className="skeleton-block" style={{ width: '60%', height: '14px', marginBottom: '0.75rem', borderRadius: '4px' }} />
            <div className="skeleton-block" style={{ width: '40%', height: '24px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
      {/* Content skeleton */}
      <div style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-1)',
        border: '1px solid var(--surface-1-border)',
      }}>
        <div className="skeleton-block" style={{ width: '140px', height: '18px', marginBottom: '1rem', borderRadius: '4px' }} />
        <div className="skeleton-block" style={{ width: '100%', height: '200px', borderRadius: 'var(--radius-sm)' }} />
      </div>
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
