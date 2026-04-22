import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hexagon, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useI18n } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { DNA_TYPES } from '@/lib/constants';
import type { DnaType } from '@/types/database';

export default function Register() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [mononym, setMononym] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2
  const [dnaType, setDnaType] = useState<DnaType | 'Custom'>('Builder');
  const [customLabel, setCustomLabel] = useState('');
  const [customTags, setCustomTags] = useState<string[]>(['', '', '']);

  async function handleSubmit() {
    if (!mononym.trim()) {
      setError('Username cannot be empty.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Check for duplicate username
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .ilike('mononym', mononym.trim())
        .maybeSingle();

      if (existing) {
        throw new Error('This username is already taken. Please choose another.');
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            mononym: mononym.trim(),
            dna_type: dnaType,
            custom_dna_label: dnaType === 'Custom' ? customLabel : null,
            custom_dna_tags: dnaType === 'Custom' ? customTags.filter(Boolean) : [],
          },
        },
      });
      if (authError) throw authError;

      // If email confirmation is disabled in Supabase, a session is returned immediately.
      if (data.session) {
        navigate('/dashboard');
      } else {
        // Fallback just in case email confirmation is still enabled
        navigate('/verify-email', { state: { email } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
        maxWidth: '520px',
        padding: '2.5rem',
        animation: 'slideUp 0.4s ease-out',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Hexagon size={40} style={{ color: 'var(--accent)', marginBottom: '0.75rem' }} strokeWidth={2.5} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.25rem' }}>{t('auth.register.title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('auth.register.subtitle')}</p>
        </div>

        {/* Step Indicator */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center',
          marginBottom: '2rem',
        }}>
          {[1, 2].map((s) => (
            <div key={s} style={{
              width: s === step ? '2rem' : '0.5rem',
              height: '0.5rem',
              borderRadius: '999px',
              background: s <= step ? 'var(--accent)' : 'var(--surface-1-border)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>



        {step === 1 && (
          <div style={{ animation: 'slideInRight 0.3s ease-out' }}>
            <div className="form-group">
              <label className="form-label">{t('auth.register.mononym')}</label>
              <input
                type="text"
                className="neu-input"
                value={mononym}
                onChange={(e) => setMononym(e.target.value)}
                placeholder="e.g., Dheeraj"
                required
              />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {t('auth.register.mononymHint')}
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.register.email')}</label>
              <input
                type="email"
                className="neu-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.register.password')}</label>
              <input
                type="password"
                className="neu-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
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
            <button
              className="neu-btn neu-btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
              onClick={() => {
                if (mononym && email && password.length >= 6) setStep(2);
                else setError('Please fill all fields. Password must be at least 6 characters.');
              }}
            >
              {t('auth.register.next')} <ArrowRight size={14} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'slideInRight 0.3s ease-out' }}>
            <p className="form-label" style={{ marginBottom: '0.75rem' }}>SELECT YOUR DNA TYPE</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
              {DNA_TYPES.map((dna) => (
                <button
                  key={dna.type}
                  onClick={() => setDnaType(dna.type)}
                  style={{
                    padding: '0.875rem 0.75rem',
                    background: dnaType === dna.type ? 'var(--accent-muted)' : 'var(--surface-1)',
                    border: `2px solid ${dnaType === dna.type ? 'var(--accent)' : 'var(--surface-1-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                >
                  {dnaType === dna.type && (
                    <Check size={14} style={{ position: 'absolute', top: 6, right: 6, color: 'var(--accent)' }} />
                  )}
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{dna.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{dna.type}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.125rem' }} className="clamp-2">{dna.description}</div>
                </button>
              ))}
              <button
                onClick={() => setDnaType('Custom')}
                style={{
                  padding: '0.875rem 0.75rem',
                  background: dnaType === 'Custom' ? 'var(--accent-muted)' : 'var(--surface-1)',
                  border: `2px solid ${dnaType === 'Custom' ? 'var(--accent)' : 'var(--surface-1-border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  gridColumn: 'span 2',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>🎨 Custom DNA</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Define your own professional identity</div>
              </button>
            </div>

            {dnaType === 'Custom' && (
              <div style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('auth.register.customLabel')}</label>
                  <input
                    type="text"
                    className="neu-input"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="e.g., Creative Technologist"
                  />
                </div>
                <label className="form-label" style={{ marginBottom: '0.375rem', display: 'block' }}>{t('auth.register.customTags')}</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {customTags.map((tag, i) => (
                    <input
                      key={i}
                      type="text"
                      className="neu-input"
                      value={tag}
                      onChange={(e) => {
                        const newTags = [...customTags];
                        newTags[i] = e.target.value;
                        setCustomTags(newTags);
                      }}
                      placeholder={`Tag ${i + 1}`}
                      style={{ flex: 1 }}
                    />
                  ))}
                </div>
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
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="neu-btn neu-btn-ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>
                <ArrowLeft size={14} /> {t('auth.register.back')}
              </button>
              <button
                className="neu-btn neu-btn-primary"
                onClick={handleSubmit}
                disabled={loading}
                style={{ flex: 2 }}
              >
                {loading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : t('auth.register.submit')}
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>{t('auth.register.login')} </span>
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>{t('auth.register.loginLink')}</Link>
        </div>
      </div>
    </div>
  );
}
