import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Repeat,
  Shield,
  ShoppingBag,
  Plus,
  Link2,
  Users,
  ArrowRight,
  Zap,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAuthStore, useNotificationStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { formatRelativeTime, formatLargeNumber } from '@/lib/utils';
import { EmptyState, ConnectionError } from '@/components/ui/ErrorBoundary';
import type { ActivityFeedItem } from '@/types/database';

// Count-up animation component
function CountUp({ end, duration = 1200 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    // start removed
    const startTime = Date.now();

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [end, duration]);

  return <span className="count-up">{formatLargeNumber(count)}</span>;
}

export default function Dashboard() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { clearActivity } = useNotificationStore();
  const [proofCount, setProofCount] = useState(0);
  const [activeTradeCount, setActiveTradeCount] = useState(0);
  const [trustScore, setTrustScore] = useState(0);
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [pendingMilestone, setPendingMilestone] = useState<{ tradeId: string } | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [loading, setLoading] = useState(true);

  const seenIds = useRef(new Set<string>());

  const fetchKPIs = useCallback(async () => {
    if (!user) return;
    try {
      const [proofs, trades] = await Promise.all([
        supabase.from('proofs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('trades').select('*', { count: 'exact', head: true })
          .or(`proposer_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`)
          .eq('status', 'Active'),
      ]);

      setProofCount(proofs.count ?? 0);
      setActiveTradeCount(trades.count ?? 0);
      setTrustScore(profile?.current_trust_score ?? 0);

      // Check for pending milestone
      if ((trades.count ?? 0) > 0) {
        const { data: activeTrades } = await supabase
          .from('trades')
          .select('id')
          .or(`proposer_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`)
          .eq('status', 'Active')
          .limit(1);

        if (activeTrades && activeTrades.length > 0 && activeTrades[0]) {
          setPendingMilestone({ tradeId: activeTrades[0].id as string });
        }
      }
    } catch {
      // Error handled by loading state
    }
  }, [user, profile]);

  const fetchActivityFeed = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('activity_feed')
        .select('*')
        .eq('recipient_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        const items = data as ActivityFeedItem[];
        // Deduplicate
        const unique = items.filter((item) => {
          if (seenIds.current.has(item.id)) return false;
          seenIds.current.add(item.id);
          return true;
        });
        setActivities(unique);
      }
    } catch {
      // silently handled
    }
  }, [user]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchKPIs(), fetchActivityFeed()]);
      setLoading(false);
      clearActivity();
    }
    init();
  }, [fetchKPIs, fetchActivityFeed, clearActivity]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('dashboard-kpi')
      .on('postgres_changes' as never, { event: '*', schema: 'public', table: 'proofs', filter: `user_id=eq.${user.id}` } as never, () => { fetchKPIs(); })
      .on('postgres_changes' as never, { event: '*', schema: 'public', table: 'trades', filter: `proposer_user_id=eq.${user.id}` } as never, () => { fetchKPIs(); })
      .on('postgres_changes' as never, { event: '*', schema: 'public', table: 'trades', filter: `recipient_user_id=eq.${user.id}` } as never, () => { fetchKPIs(); })
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setConnectionError(true);
        else setConnectionError(false);
      });

    const feedChannel = supabase
      .channel('dashboard-feed')
      .on('postgres_changes' as never, { event: 'INSERT', schema: 'public', table: 'activity_feed', filter: `recipient_user_id=eq.${user.id}` } as never, (payload: { new: ActivityFeedItem }) => {
        const item = payload.new;
        if (!seenIds.current.has(item.id)) {
          seenIds.current.add(item.id);
          setActivities((prev) => [item, ...prev]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(feedChannel);
    };
  }, [user, fetchKPIs]);

  function getEventIcon(type: string) {
    switch (type) {
      case 'trade_proposal_received': return <Repeat size={14} />;
      case 'milestone_completed': return <TrendingUp size={14} />;
      case 'dispute_opened':
      case 'dispute_updated': return <AlertTriangle size={14} />;
      case 'trade_accepted': return <Zap size={14} />;
      default: return <MessageSquare size={14} />;
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1.5rem' }}>{t('dashboard.title')}</h1>

      {connectionError && <ConnectionError onRefresh={() => { setConnectionError(false); fetchKPIs(); }} />}

      {/* Zone A — KPI Summary Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {[
          { label: t('dashboard.kpi.proofs'), value: proofCount, icon: <FileText size={20} /> },
          { label: t('dashboard.kpi.trades'), value: activeTradeCount, icon: <Repeat size={20} /> },
          { label: t('dashboard.kpi.trust'), value: trustScore, icon: <Shield size={20} /> },
        ].map((kpi) => (
          <div key={kpi.label} className="neu-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--accent-muted)',
              border: '2px solid var(--accent)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent)',
            }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent)' }}>
                <CountUp end={kpi.value} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Zone B — Contextual Primary Action */}
      <div className="neu-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        {activeTradeCount === 0 && proofCount === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={32} />}
            title="Welcome to CollabOS!"
            description={t('dashboard.action.addProof')}
            actionLabel={t('dashboard.quick.addProof')}
            onAction={() => navigate('/proofchain')}
          />
        ) : pendingMilestone ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.25rem' }}>Active Trade</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>You have a milestone ready to complete</p>
            </div>
            <button className="neu-btn neu-btn-primary" onClick={() => navigate(`/trades/${pendingMilestone.tradeId}`)}>
              {t('dashboard.action.completeMilestone')} <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.25rem' }}>Ready for more?</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Discover new skill exchange opportunities</p>
            </div>
            <button className="neu-btn neu-btn-primary" onClick={() => navigate('/market')}>
              {t('dashboard.action.browseMarket')} <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Zone C — Activity Feed & Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 280px',
        gap: '1.5rem',
      }}>
        {/* Activity Feed */}
        <div className="neu-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {t('dashboard.feed.title')}
          </h3>
          {activities.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '1rem 0' }}>
              {t('dashboard.feed.empty')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '360px', overflowY: 'auto' }}>
              {activities.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.625rem',
                    borderRadius: 'var(--radius-sm)',
                    background: item.is_read ? 'transparent' : 'var(--accent-muted)',
                    border: `1px solid ${item.is_read ? 'transparent' : 'var(--surface-1-border)'}`,
                    animation: 'slideInRight 0.3s ease-out',
                  }}
                >
                  <div style={{
                    width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%',
                    background: 'var(--surface-1)',
                    border: '1px solid var(--surface-1-border)',
                    color: 'var(--accent)',
                    flexShrink: 0,
                  }}>
                    {getEventIcon(item.event_type)}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p className="truncate-1" style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      {t(`feed.${item.event_type}`, { mononym: String((item.metadata as Record<string, unknown>)?.mononym ?? 'Someone') })}
                    </p>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {formatRelativeTime(item.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="neu-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {t('dashboard.quickActions')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { icon: <Plus size={16} />, label: t('dashboard.quick.addProof'), path: '/proofchain' },
              { icon: <ShoppingBag size={16} />, label: t('dashboard.quick.browseMarket'), path: '/market' },
              { icon: <Link2 size={16} />, label: t('dashboard.quick.createListing'), path: '/market' },
              { icon: <Users size={16} />, label: t('dashboard.quick.inviteWorkspace'), path: '/workspaces' },
            ].map((action) => (
              <button
                key={action.label}
                className="neu-btn neu-btn-ghost"
                style={{ justifyContent: 'flex-start', width: '100%' }}
                onClick={() => navigate(action.path)}
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
