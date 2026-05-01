import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { Hexagon, Eye, EyeOff } from 'lucide-react';
import { useI18n } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import type { Profile } from '@/types/database';

export default function Login() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setSession, setProfile } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileData) setProfile(profileData as Profile);
        const redirect = searchParams.get('redirect');
        navigate(redirect?.startsWith('/') ? redirect : '/dashboard');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg === 'Invalid login credentials' ? 'Invalid email or password. Please try again.' : msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/settings`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
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
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem',
        animation: 'slideUp 0.4s ease-out',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Hexagon size={40} style={{ color: 'var(--accent)', marginBottom: '0.75rem' }} strokeWidth={2.5} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.25rem' }}>
            {resetMode ? t('auth.forgot.title') : t('auth.login.title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {resetMode ? t('auth.forgot.subtitle') : t('auth.login.subtitle')}
          </p>
        </div>

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

        {resetSent && (
          <div style={{
            padding: '0.75rem',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1.5px solid var(--success)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--success)',
            fontSize: '0.8rem',
            marginBottom: '1rem',
          }}>
            {t('auth.forgot.sent')}
          </div>
        )}

        <form onSubmit={resetMode ? handleReset : handleLogin}>
          <div className="form-group">
            <label className="form-label">{t('auth.login.email')}</label>
            <input
              type="email"
              className="neu-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {!resetMode && (
            <div className="form-group">
              <label className="form-label">{t('auth.login.password')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="neu-input"
                  style={{ paddingRight: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="neu-btn neu-btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', marginBottom: '1rem' }}
            disabled={loading}
          >
            {loading ? (
              <div className="spinner" style={{ width: 18, height: 18 }} />
            ) : (
              resetMode ? t('auth.forgot.submit') : t('auth.login.submit')
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.8rem' }}>
          {resetMode ? (
            <button
              onClick={() => { setResetMode(false); setResetSent(false); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
            >
              Back to Sign In
            </button>
          ) : (
            <>
              <button
                onClick={() => { setResetMode(true); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, marginBottom: '0.75rem', display: 'block', width: '100%' }}
              >
                {t('auth.login.forgot')}
              </button>
              
              <Link to="/verify-email" style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '1.25rem', textDecoration: 'underline' }}>
                Need to verify your email?
              </Link>

              <span style={{ color: 'var(--text-muted)' }}>{t('auth.login.register')} </span>
              <Link to={searchParams.get('redirect') ? `/register?redirect=${encodeURIComponent(searchParams.get('redirect')!)}` : '/register'} style={{ color: 'var(--accent)', fontWeight: 600 }}>{t('auth.login.registerLink')}</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
