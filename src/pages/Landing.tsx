import { Link } from 'react-router-dom';
import { Hexagon, Shield, Link2, ShoppingBag, Users, ArrowRight, BookOpen, ChevronRight } from 'lucide-react';
import { useI18n } from '@/i18n';

export default function Landing() {
  const { t } = useI18n();

  const features = [
    { icon: <Shield size={28} />, titleKey: 'landing.features.trust.title', descKey: 'landing.features.trust.desc' },
    { icon: <Link2 size={28} />, titleKey: 'landing.features.proofchain.title', descKey: 'landing.features.proofchain.desc' },
    { icon: <ShoppingBag size={28} />, titleKey: 'landing.features.market.title', descKey: 'landing.features.market.desc' },
    { icon: <Users size={28} />, titleKey: 'landing.features.workspaces.title', descKey: 'landing.features.workspaces.desc' },
  ];

  const steps = [
    { num: '01', titleKey: 'landing.howItWorks.step1.title', descKey: 'landing.howItWorks.step1.desc' },
    { num: '02', titleKey: 'landing.howItWorks.step2.title', descKey: 'landing.howItWorks.step2.desc' },
    { num: '03', titleKey: 'landing.howItWorks.step3.title', descKey: 'landing.howItWorks.step3.desc' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        borderBottom: '2px solid var(--surface-1-border)',
        background: 'var(--surface-1)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Hexagon size={28} style={{ color: 'var(--accent)' }} strokeWidth={2.5} />
          <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--accent)' }}>CollabOS</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/login" className="neu-btn neu-btn-ghost">Sign In</Link>
          <Link to="/register" className="neu-btn neu-btn-primary">
            {t('landing.hero.cta.start')} <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        padding: '6rem 2rem 4rem',
        textAlign: 'center',
        maxWidth: '800px',
        margin: '0 auto',
        animation: 'fadeIn 0.5s ease-out',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.375rem 1rem',
          background: 'var(--accent-muted)',
          border: '1.5px solid var(--accent)',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--accent)',
          marginBottom: '1.5rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          <Hexagon size={14} /> Freelance Operating System
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 900,
          lineHeight: 1.05,
          marginBottom: '1.25rem',
          letterSpacing: '-0.03em',
        }}>
          {t('landing.hero.title')}
        </h1>

        <p style={{
          fontSize: '1.125rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          marginBottom: '2.5rem',
          maxWidth: '600px',
          margin: '0 auto 2.5rem',
        }}>
          {t('landing.hero.subtitle')}
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="neu-btn neu-btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
            {t('landing.hero.cta.start')} <ArrowRight size={16} />
          </Link>
          <a href="#features" className="neu-btn neu-btn-secondary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
            {t('landing.hero.cta.learn')}
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{
        padding: '5rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '2rem',
          fontWeight: 900,
          marginBottom: '3rem',
          letterSpacing: '-0.02em',
        }}>
          {t('landing.features.title')}
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
        }}>
          {features.map((f) => (
            <div key={f.titleKey} className="neu-card" style={{ padding: '1.75rem' }}>
              <div style={{
                width: 52,
                height: 52,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--accent-muted)',
                border: '2px solid var(--accent)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--accent)',
                marginBottom: '1rem',
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t(f.titleKey)}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{
        padding: '5rem 2rem',
        background: 'var(--surface-1)',
        borderTop: '2px solid var(--surface-1-border)',
        borderBottom: '2px solid var(--surface-1-border)',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2rem',
            fontWeight: 900,
            marginBottom: '3rem',
          }}>
            {t('landing.howItWorks.title')}
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2rem',
          }}>
            {steps.map((step, i) => (
              <div key={step.num} style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: 'var(--text-inverse)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.25rem',
                  margin: '0 auto 1rem',
                  border: '3px solid var(--accent)',
                  boxShadow: 'var(--neu-shadow)',
                }}>
                  {step.num}
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight size={24} style={{
                    position: 'absolute',
                    top: '20px',
                    right: '-20px',
                    color: 'var(--text-muted)',
                    display: 'none',
                  }} />
                )}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t(step.titleKey)}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KB Teaser */}
      <section style={{
        padding: '5rem 2rem',
        textAlign: 'center',
        maxWidth: '700px',
        margin: '0 auto',
      }}>
        <BookOpen size={40} style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.75rem' }}>
          {t('landing.kb.title')}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
          {t('landing.kb.desc')}
        </p>
        <Link to="/knowledge-base" className="neu-btn neu-btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
          {t('landing.kb.cta')} <ArrowRight size={14} />
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '2rem',
        textAlign: 'center',
        borderTop: '2px solid var(--surface-1-border)',
        background: 'var(--surface-1)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          fontSize: '0.85rem',
        }}>
          <Link to="/knowledge-base" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Knowledge Base</Link>
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign In</Link>
          <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Register</Link>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('landing.footer.copyright')}</p>
      </footer>
    </div>
  );
}
