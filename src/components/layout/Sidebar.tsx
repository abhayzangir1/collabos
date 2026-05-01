import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Link2,
  ShoppingBag,
  Repeat,
  BarChart3,
  Users,
  Settings,
  BookOpen,
  LogOut,
  Hexagon,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAuthStore, useNotificationStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { formatBadgeCount } from '@/lib/utils';
import type { ActivityEventType, ActivityFeedItem } from '@/types/database';

const TRADE_ACTIVITY_TYPES: ActivityEventType[] = [
  'trade_proposal_received',
  'trade_accepted',
  'trade_declined',
  'milestone_completed',
  'dispute_opened',
  'dispute_updated',
];

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/proofchain', icon: Link2, labelKey: 'nav.proofchain' },
  { path: '/market', icon: ShoppingBag, labelKey: 'nav.market' },
  { path: '/trades', icon: Repeat, labelKey: 'nav.trades', badgeKey: 'trades' as const },
  { path: '/analytics', icon: BarChart3, labelKey: 'nav.analytics' },
  { path: '/workspaces', icon: Users, labelKey: 'nav.workspaces' },
  { path: '/knowledge-base', icon: BookOpen, labelKey: 'nav.knowledgeBase' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

export function Sidebar() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, profile, reset } = useAuthStore();
  const { unreadTrades, incrementTrades, incrementActivity, setUnreadTrades, setUnreadActivity } = useNotificationStore();

  useEffect(() => {
    if (!user) return;

    let mounted = true;
    const userId = user.id;

    async function fetchUnreadCounts() {
      const { data } = await supabase
        .from('activity_feed')
        .select('event_type')
        .eq('recipient_user_id', userId)
        .eq('is_read', false);

      if (!mounted || !data) return;

      const items = data as Pick<ActivityFeedItem, 'event_type'>[];
      setUnreadTrades(items.filter((item) => TRADE_ACTIVITY_TYPES.includes(item.event_type)).length);
      setUnreadActivity(items.filter((item) => !TRADE_ACTIVITY_TYPES.includes(item.event_type)).length);
    }

    void fetchUnreadCounts();

    const channel = supabase
      .channel(`sidebar-activity-${userId}`)
      .on(
        'postgres_changes' as never,
        { event: 'INSERT', schema: 'public', table: 'activity_feed', filter: `recipient_user_id=eq.${userId}` } as never,
        (payload: { new: ActivityFeedItem }) => {
          if (TRADE_ACTIVITY_TYPES.includes(payload.new.event_type)) {
            incrementTrades();
          } else {
            incrementActivity();
          }
        }
      )
      .on(
        'postgres_changes' as never,
        { event: 'UPDATE', schema: 'public', table: 'activity_feed', filter: `recipient_user_id=eq.${userId}` } as never,
        () => {
          void fetchUnreadCounts();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, incrementActivity, incrementTrades, setUnreadActivity, setUnreadTrades]);

  async function handleLogout() {
    await supabase.auth.signOut();
    reset();
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1rem',
        borderBottom: '2px solid var(--surface-1-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
      }}>
        <Hexagon size={28} style={{ color: 'var(--accent)' }} strokeWidth={2.5} />
        <span style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.02em', color: 'var(--accent)' }}>
          CollabOS
        </span>
      </div>

      {/* Profile Summary */}
      {profile && (
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid var(--surface-1-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--accent-muted)',
            border: '2px solid var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.85rem',
            color: 'var(--accent)',
          }}>
            {profile.mononym.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div className="truncate-1" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{profile.mononym}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{profile.dna_type}</div>
          </div>
        </div>
      )}

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={18} />
            <span className="truncate-1" style={{ flex: 1 }}>{t(item.labelKey)}</span>
            {item.badgeKey === 'trades' && unreadTrades > 0 && (
              <span className="badge-count" style={{ position: 'static' }}>
                {formatBadgeCount(unreadTrades)}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '0.75rem 0.5rem', borderTop: '1px solid var(--surface-1-border)' }}>
        <button
          onClick={handleLogout}
          className="sidebar-link"
          style={{ width: '100%', cursor: 'pointer', background: 'none', border: 'none', font: 'inherit' }}
        >
          <LogOut size={18} />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { unreadTrades } = useNotificationStore();

  const mobileItems = NAV_ITEMS.slice(0, 5); // Dashboard, ProofChain, Market, Trades, Analytics

  return (
    <nav className="mobile-nav">
      {mobileItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '0.125rem',
            padding: '0.25rem 0.75rem',
            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '0.6rem',
            fontWeight: 600,
            position: 'relative' as const,
          })}
        >
          <item.icon size={20} />
          {item.badgeKey === 'trades' && unreadTrades > 0 && (
            <span className="badge-count">{formatBadgeCount(unreadTrades)}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
