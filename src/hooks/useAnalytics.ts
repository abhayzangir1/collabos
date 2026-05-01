import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import type { TrustScoreHistory, TelemetryTrack, SkillTag } from '@/types/database';
import type { MetricType } from '@/types/database';

export type AnalyticsTelemetryTrack = TelemetryTrack & {
  calculated_value: number;
};

export function useAnalytics(startDate: string, endDate: string) {
  const [trustHistory, setTrustHistory] = useState<TrustScoreHistory[]>([]);
  const [skillBreakdown, setSkillBreakdown] = useState<{ domain: string; count: number }[]>([]);
  const [hourlyBalance, setHourlyBalance] = useState<{ offered: number; received: number }>({ offered: 0, received: 0 });
  const [summaryMetrics, setSummaryMetrics] = useState({
    tradesCompleted: 0,
    proofsAdded: 0,
    endorsements: 0,
    trustScore: 0,
  });
  const [telemetryTracks, setTelemetryTracks] = useState<AnalyticsTelemetryTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuthStore();

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const endExclusive = new Date(`${endDate}T00:00:00`);
      endExclusive.setDate(endExclusive.getDate() + 1);
      const endExclusiveIso = endExclusive.toISOString();

      // Trust Score History
      const { data: historyData } = await supabase
        .from('trust_score_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lt('created_at', endExclusiveIso)
        .order('created_at');

      setTrustHistory((historyData as TrustScoreHistory[]) ?? []);

      // Skill Category Breakdown from completed trades
      const { data: completedTrades } = await supabase
        .from('trades')
        .select('*, listing:listings(skill_offered_tags, skill_requested_tags)')
        .or(`proposer_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`)
        .eq('status', 'Completed')
        .gte('completed_at', startDate)
        .lt('completed_at', endExclusiveIso);

      const completedTradeRows = completedTrades ?? [];
      const domainCounts: Record<string, number> = {};
      for (const trade of completedTradeRows) {
        const listing = trade.listing as unknown as { skill_offered_tags: SkillTag[]; skill_requested_tags: SkillTag[] } | null;
        const tags = [...(listing?.skill_offered_tags ?? []), ...(listing?.skill_requested_tags ?? [])];
        for (const tag of tags) {
          const t = tag as SkillTag;
          domainCounts[t.domain] = (domainCounts[t.domain] ?? 0) + 1;
        }
      }
      setSkillBreakdown(Object.entries(domainCounts).map(([domain, count]) => ({ domain, count })));

      // Hourly Balance
      let offered = 0;
      let received = 0;
      for (const trade of completedTradeRows) {
        const listing = trade.listing as unknown as { hours_range?: number } | null;
        const hours = listing?.hours_range ?? 0;
        if (trade.proposer_user_id === user.id) {
          offered += hours;
        } else {
          received += hours;
        }
      }
      setHourlyBalance({ offered, received });

      // Summary Metrics
      const { count: tradesCount } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .or(`proposer_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`)
        .eq('status', 'Completed')
        .gte('completed_at', startDate)
        .lt('completed_at', endExclusiveIso);

      const { count: proofsCount } = await supabase
        .from('proofs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lt('created_at', endExclusiveIso);

      setSummaryMetrics({
        tradesCompleted: tradesCount ?? 0,
        proofsAdded: proofsCount ?? 0,
        endorsements: 0,
        trustScore: profile?.current_trust_score ?? 0,
      });

      // Telemetry Tracks
      const { data: tracks } = await supabase
        .from('telemetry_tracks')
        .select('*')
        .eq('user_id', user.id);

      const tracksList = ((tracks as TelemetryTrack[]) ?? []).map((track) => ({
        ...track,
        calculated_value: 0,
      }));
      
      // Calculate real data for tracks
      const { data: recentProofs } = await supabase
        .from('proofs')
        .select('skill_tags')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lt('created_at', endExclusiveIso);

      for (const track of tracksList) {
        let val = 0;
        const trackDomains = track.skill_tags.map(t => t.domain);
        
        if (track.metric_type === 'trade_frequency') {
          val = completedTrades?.filter(tr => {
            const l = tr.listing as unknown as { skill_offered_tags: SkillTag[]; skill_requested_tags: SkillTag[] } | null;
            const tags = [...(l?.skill_offered_tags ?? []), ...(l?.skill_requested_tags ?? [])];
            return tags.some(t => trackDomains.includes(t.domain));
          }).length ?? 0;
        } else if (track.metric_type === 'hours_exchanged') {
          val = completedTrades?.filter(tr => {
            const l = tr.listing as unknown as { skill_offered_tags: SkillTag[]; skill_requested_tags: SkillTag[] } | null;
            const tags = [...(l?.skill_offered_tags ?? []), ...(l?.skill_requested_tags ?? [])];
            return tags.some(t => trackDomains.includes(t.domain));
          }).reduce((acc, tr) => acc + ((tr.listing as unknown as { hours_range: number })?.hours_range ?? 0), 0) ?? 0;
        } else if (track.metric_type === 'proof_additions') {
          val = recentProofs?.filter(p => {
            const tags = p.skill_tags as SkillTag[];
            return tags.some(t => trackDomains.includes(t.domain));
          }).length ?? 0;
        }
        
        track.calculated_value = val;
      }

      setTelemetryTracks(tracksList);
    } finally {
      setLoading(false);
    }
  }, [user, profile, startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const createTrack = useCallback(async (trackName: string, skillTags: SkillTag[], metricType: MetricType) => {
    if (!user) throw new Error('Not authenticated');
    if (telemetryTracks.length >= 5) throw new Error('Maximum of 5 custom tracks reached.');

    const { data, error } = await supabase
      .from('telemetry_tracks')
      .insert({
        user_id: user.id,
        track_name: trackName,
        skill_tags: skillTags,
        metric_type: metricType,
      })
      .select()
      .single();

    if (error) throw error;
    setTelemetryTracks((prev) => [...prev, { ...(data as TelemetryTrack), calculated_value: 0 }]);
  }, [user, telemetryTracks.length]);

  const deleteTrack = useCallback(async (trackId: string) => {
    await supabase.from('telemetry_tracks').delete().eq('id', trackId);
    setTelemetryTracks((prev) => prev.filter((t) => t.id !== trackId));
  }, []);

  const hasData = trustHistory.length > 0 || skillBreakdown.length > 0 || hourlyBalance.offered > 0 || hourlyBalance.received > 0;

  return {
    trustHistory,
    skillBreakdown,
    hourlyBalance,
    summaryMetrics,
    telemetryTracks,
    loading,
    hasData,
    createTrack,
    deleteTrack,
    refetch: fetchAnalytics,
  };
}
