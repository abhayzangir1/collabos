import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Mail, RefreshCw } from 'lucide-react';
import { useI18n } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';

export default function VerifyEmail() {
  const { t } = useI18n();
  const location = useLocation();
  const { user } = useAuthStore();
  
  // Try to get email securely from our strict router state or fallback to global store
  const targetEmail = location.state?.email || user?.email;
  
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleResend() {
    setLoading(true);
    setError('');
    try {
      if (!targetEmail) throw new Error('No email found to resend to.');
      const { error } = await supabase.auth.resend({ type: 'signup', email: targetEmail });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--bg-base)',
    }}>
      <div className="neu-card" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '3rem 2.5rem',
        textAlign: 'center',
        animation: 'slideUp 0.4s ease-out',
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'var(--accent-muted)',
          border: '3px solid var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: 'var(--accent)',
        }}>
          <Mail size={32} />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>
          {t('auth.verify.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          {t('auth.verify.subtitle')}
        </p>

        {targetEmail && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'var(--surface-1)',
            border: '1.5px solid var(--surface-1-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent)',
            marginBottom: '1.5rem',
            wordBreak: 'break-all',
          }}>
            {targetEmail}
          </div>
        )}

        {error && (
          <div style={{
            padding: '0.75rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1.5px solid var(--error)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--error)',
            fontSize: '0.8rem',
            marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        {sent && (
          <div style={{
            padding: '0.75rem',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1.5px solid var(--success)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--success)',
            fontSize: '0.8rem',
            marginBottom: '1rem',
          }}>
            {t('auth.verify.resent')}
          </div>
        )}

        <button
          className="neu-btn neu-btn-secondary"
          onClick={handleResend}
          disabled={loading}
          style={{ padding: '0.75rem 1.5rem' }}
        >
          {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <><RefreshCw size={14} /> {t('auth.verify.resend')}</>}
        </button>
      </div>
    </div>
  );
}
