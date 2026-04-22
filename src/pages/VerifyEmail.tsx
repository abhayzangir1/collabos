import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import type { Profile } from '@/types/database';

export default function VerifyEmail() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setSession, setUser, setProfile } = useAuthStore();
  
  const initialEmail = (location.state as { email?: string })?.email || user?.email || '';
  
  const [targetEmail, setTargetEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Update targetEmail if user object loads late
  useEffect(() => {
    if (!targetEmail && user?.email) {
      setTargetEmail(user.email);
    }
  }, [user?.email, targetEmail]);

  async function handleResend() {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      if (!targetEmail) throw new Error('Please enter your email to resend.');
      const { error } = await supabase.auth.resend({ type: 'signup', email: targetEmail });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!otp || otp.length !== 6 || !targetEmail) {
      if (!targetEmail) setError('Please enter your email address');
      return;
    }
    
    setVerifying(true);
    setError('');
    
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: otp,
        type: 'signup',
      });
      
      if (verifyError) throw verifyError;
      
      setSuccess(true);
      
      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileData) {
          setProfile(profileData as Profile);
        }
      }
      
      // Delay navigation slightly to show success state
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setVerifying(false);
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

        {success && (
          <div style={{
            padding: '0.75rem',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1.5px solid var(--success)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--success)',
            fontSize: '0.8rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}>
            <CheckCircle2 size={16} />
            {t('auth.verify.success')}
          </div>
        )}

        {!success && (
          <form onSubmit={handleVerify}>
            <div className="form-group" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <label className="form-label">{t('auth.login.email')}</label>
              <input
                type="email"
                className="neu-input"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={verifying}
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <input
                type="text"
                className="neu-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                disabled={verifying}
                style={{ 
                  textAlign: 'center', 
                  fontSize: '1.5rem', 
                  letterSpacing: '0.5em',
                  fontWeight: 700,
                  padding: '1rem',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
            
            <button
              type="submit"
              className="neu-btn neu-btn-primary"
              disabled={verifying || otp.length !== 6 || !targetEmail}
              style={{ width: '100%', padding: '0.875rem', marginBottom: '1rem', fontSize: '0.95rem' }}
            >
              {verifying ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <>{t('auth.verify.submit')} <ArrowRight size={16} /></>}
            </button>
          </form>
        )}

        {sent && !success && (
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
          type="button"
          onClick={handleResend}
          disabled={loading || !targetEmail}
          style={{ padding: '0.75rem 1.5rem' }}
        >
          {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <><RefreshCw size={14} /> {t('auth.verify.resend')}</>}
        </button>
      </div>
    </div>
  );
}
