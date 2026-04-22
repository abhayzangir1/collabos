import { useState, useEffect } from 'react';
import { User, Sun, Moon, Globe, Shield, LogOut, Key, Monitor, Smartphone } from 'lucide-react';
import { useI18n, AVAILABLE_LANGUAGES } from '@/i18n';
import { useAuthStore, useThemeStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { DNA_TYPES } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/utils';
import type { DnaType } from '@/types/database';

export default function Settings() {
  const { t } = useI18n();
  const { language, setLanguage } = useI18n();
  const { theme, setTheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  // updateProfile removed

  const [mononym, setMononym] = useState(profile?.mononym ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [dnaType, setDnaType] = useState<DnaType | 'Custom'>(profile?.dna_type as DnaType ?? 'Builder');
  const [customLabel, setCustomLabel] = useState(profile?.custom_dna_label ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [sessions, setSessions] = useState<{ id: string; device_label: string; last_active: string; created_at: string }[]>([]);

  // Fetch sessions
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase.from('sessions').select('*').eq('user_id', user.id).order('last_active', { ascending: false });
      if (data) setSessions(data);
    })();
  }, [user?.id]);

  useEffect(() => {
    if (profile) {
      setMononym(profile.mononym);
      setDnaType(profile.dna_type as DnaType | 'Custom');
      setCustomLabel(profile.custom_dna_label ?? '');
    }
  }, [profile]);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  async function handleSaveProfile() {
    if (!mononym.trim()) {
      setError('Username cannot be empty.');
      return;
    }

    setSaving(true); 
    setSaved(false);
    setError('');

    try {
      if (mononym.trim().toLowerCase() !== profile?.mononym?.toLowerCase()) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .ilike('mononym', mononym.trim())
          .maybeSingle();

        if (existing) {
          throw new Error('This username is already taken. Please choose another.');
        }
      }

      const { error: updateError } = await supabase.from('profiles').update({
        mononym: mononym.trim(),
        dna_type: dnaType,
        custom_dna_label: dnaType === 'Custom' ? customLabel : null,
      }).eq('id', user?.id);

      if (updateError) throw updateError;

      useAuthStore.getState().setProfile({ ...profile!, mononym: mononym.trim(), dna_type: dnaType, custom_dna_label: dnaType === 'Custom' ? customLabel : null });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally { 
      setSaving(false); 
    }
  }

  async function handleResetPassword() {
    if (!user?.email) return;
    await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/settings` });
    await supabase.from('audit_log').insert({ user_id: user?.id, event_type: 'password_change', metadata: {} });
    setResetSent(true);
  }

  async function handleSignOutAll() {
    await supabase.auth.signOut({ scope: 'global' });
    useAuthStore.getState().reset();
    window.location.href = '/login';
  }

  return (
    <div className="page-container" style={{ maxWidth: '680px' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '2rem' }}>{t('settings.title')}</h1>

      {/* Profile Section */}
      <section className="neu-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} style={{ color: 'var(--accent)' }} /> {t('settings.profile')}
        </h2>
        <div className="form-group">
          <label className="form-label">{t('settings.profile.mononym')}</label>
          <input className="neu-input" value={mononym} onChange={(e) => setMononym(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('settings.profile.email')}</label>
          <input className="neu-input" type="email" value={email} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} title="Email cannot be changed" />
        </div>
        <div className="form-group">
          <label className="form-label">{t('settings.profile.dnaType')}</label>
          <select className="neu-input" value={dnaType} onChange={(e) => setDnaType(e.target.value as DnaType | 'Custom')}>
            {DNA_TYPES.map((d) => <option key={d.type} value={d.type}>{d.icon} {d.type}</option>)}
            <option value="Custom">🎨 Custom</option>
          </select>
        </div>
        {dnaType === 'Custom' && (
          <div className="form-group">
            <label className="form-label">Custom DNA Label</label>
            <input className="neu-input" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} />
          </div>
        )}
        {error && (
          <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="neu-btn neu-btn-primary" onClick={handleSaveProfile} disabled={saving}>
            {saving ? <div className="spinner" style={{ width: 14, height: 14 }} /> : t('settings.profile.save')}
          </button>
          {saved && <span className="form-success">{t('settings.profile.saved')}</span>}
        </div>
      </section>

      {/* Theme Section */}
      <section className="neu-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {theme === 'dark' ? <Moon size={18} style={{ color: 'var(--accent)' }} /> : <Sun size={18} style={{ color: 'var(--accent)' }} />} {t('settings.theme')}
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className={`neu-btn ${theme === 'light' ? 'neu-btn-primary' : 'neu-btn-ghost'}`}
            onClick={() => setTheme('light')}
            style={{ flex: 1, padding: '1rem', flexDirection: 'column', gap: '0.5rem' }}
          >
            <Sun size={24} />
            <span>{t('settings.theme.light')}</span>
          </button>
          <button
            className={`neu-btn ${theme === 'dark' ? 'neu-btn-primary' : 'neu-btn-ghost'}`}
            onClick={() => setTheme('dark')}
            style={{ flex: 1, padding: '1rem', flexDirection: 'column', gap: '0.5rem' }}
          >
            <Moon size={24} />
            <span>{t('settings.theme.dark')}</span>
          </button>
        </div>
      </section>

      {/* Language Section */}
      <section className="neu-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Globe size={18} style={{ color: 'var(--accent)' }} /> {t('settings.language')}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {AVAILABLE_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`neu-btn ${language === lang.code ? 'neu-btn-primary' : 'neu-btn-ghost'}`}
              onClick={() => setLanguage(lang.code)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </section>

      {/* Password Section */}
      <section className="neu-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Key size={18} style={{ color: 'var(--accent)' }} /> {t('settings.password')}
        </h2>
        <button className="neu-btn neu-btn-secondary" onClick={handleResetPassword} disabled={resetSent}>
          {resetSent ? t('settings.password.resetSent') : t('settings.password.reset')}
        </button>
      </section>

      {/* Sessions Section */}
      <section className="neu-card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={18} style={{ color: 'var(--accent)' }} /> {t('settings.sessions')}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {/* Current session */}
          <div className="neu-card" style={{ padding: '0.75rem', background: 'var(--surface-1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Monitor size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Current Session</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>This device · Active now</div>
                </div>
              </div>
              <span className="status-dot status-dot-active" />
            </div>
          </div>
          {/* Other sessions from DB */}
          {sessions.map((s) => (
            <div key={s.id} className="neu-card" style={{ padding: '0.75rem', background: 'var(--surface-1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {s.device_label.toLowerCase().includes('mobile') ? <Smartphone size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <Monitor size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                  <div>
                    <div className="truncate-1" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{s.device_label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Last active {formatRelativeTime(s.last_active)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>No other sessions found.</p>
          )}
        </div>
        <button className="neu-btn neu-btn-danger" onClick={handleSignOutAll}>
          <LogOut size={14} /> {t('settings.sessions.signOutAll')}
        </button>
      </section>
    </div>
  );
}
