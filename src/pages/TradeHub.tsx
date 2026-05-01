import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Repeat, Check, X as XIcon, Clock } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useTrades } from '@/hooks/useTrades';
import { useAuthStore, useNotificationStore } from '@/store';
import { EmptyState, LoadingFallback } from '@/components/ui/ErrorBoundary';
import { getStatusColor, formatDateTime } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { ActivityEventType, TradeStatus } from '@/types/database';
import { useEffect } from 'react';

const TABS: (TradeStatus | 'All')[] = ['All', 'Active', 'Proposed', 'Completed', 'Declined'];
const TRADE_ACTIVITY_TYPES: ActivityEventType[] = [
  'trade_proposal_received',
  'trade_accepted',
  'trade_declined',
  'milestone_completed',
  'dispute_opened',
  'dispute_updated',
];

export default function TradeHub() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { trades, loading, acceptTrade, declineTrade } = useTrades();
  const { user } = useAuthStore();
  const { clearTrades } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<TradeStatus | 'All'>('All');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    clearTrades();
    if (!user) return;
    void supabase
      .from('activity_feed')
      .update({ is_read: true })
      .eq('recipient_user_id', user.id)
      .eq('is_read', false)
      .in('event_type', TRADE_ACTIVITY_TYPES);
  }, [clearTrades, user]);

  const filtered = useMemo(() => {
    if (activeTab === 'All') return trades;
    return trades.filter((trade) => trade.status === activeTab);
  }, [trades, activeTab]);

  async function handleAccept(tradeId: string) {
    setActionLoading(tradeId);
    try { await acceptTrade(tradeId); } catch { /* handled */ } finally { setActionLoading(null); }
  }

  async function handleDecline(tradeId: string) {
    setActionLoading(tradeId);
    try { await declineTrade(tradeId); } catch { /* handled */ } finally { setActionLoading(null); }
  }

  if (loading) return <LoadingFallback />;

  return (
    <div className="page-container">
      <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1.5rem' }}>{t('trades.title')}</h1>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((tab) => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'All' ? t('trades.tabs.all') : t(`trades.tabs.${tab.toLowerCase()}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Repeat size={32} />} title={t('trades.title')} description={t('trades.empty')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((trade) => {
            const counterparty = trade.proposer_user_id === user?.id ? trade.recipient : trade.proposer;
            const isIncoming = trade.recipient_user_id === user?.id && trade.status === 'Proposed';
            const completedMs = trade.milestones?.filter((m) => m.status === 'Completed').length ?? 0;
            const totalMs = trade.milestones?.length ?? 0;

            return (
              <div
                key={trade.id}
                className="neu-card"
                style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}
                onClick={() => navigate(`/trades/${trade.id}`)}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-muted)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: 'var(--accent)', flexShrink: 0 }}>
                  {counterparty?.mononym?.charAt(0).toUpperCase() ?? '?'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate-1" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {counterparty?.mononym ?? 'Unknown'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {trade.listing?.skill_offered ?? ''} ↔ {trade.listing?.skill_requested ?? ''}
                  </div>
                </div>

                <span className={`neu-badge ${getStatusColor(trade.status)}`} style={{ flexShrink: 0 }}>
                  {trade.status}
                </span>

                {totalMs > 0 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div className="progress-bar" style={{ width: 60 }}>
                      <div className="progress-bar-fill" style={{ width: `${totalMs > 0 ? (completedMs / totalMs) * 100 : 0}%` }} />
                    </div>
                    {completedMs}/{totalMs}
                  </div>
                )}

                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                  <Clock size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
                  {formatDateTime(trade.created_at)}
                </div>

                {isIncoming && (
                  <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    <button className="neu-btn neu-btn-primary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.625rem' }} onClick={() => handleAccept(trade.id)} disabled={actionLoading === trade.id}>
                      <Check size={12} /> {t('trades.accept')}
                    </button>
                    <button className="neu-btn neu-btn-danger" style={{ fontSize: '0.7rem', padding: '0.25rem 0.625rem' }} onClick={() => handleDecline(trade.id)} disabled={actionLoading === trade.id}>
                      <XIcon size={12} /> {t('trades.decline')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
