import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import type { TrustScoreHistory, TelemetryTrack, SkillTag } from '@/types/database';
import type { MetricType } from '@/types/database';

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
  const [telemetryTracks, setTelemetryTracks] = useState<TelemetryTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuthStore();

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Trust Score History
      const { data: historyData } = await supabase
        .from('trust_score_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at');

      setTrustHistory((historyData as TrustScoreHistory[]) ?? []);

      // Skill Category Breakdown from completed trades
      const { data: completedTrades } = await supabase
        .from('trades')
        .select('*, listing:listings(skill_offered_tags, skill_requested_tags)')
        .or(`proposer_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`)
        .eq('status', 'Completed')
        .gte('completed_at', startDate)
        .lte('completed_at', endDate);

      if (completedTrades) {
        const domainCounts: Record<string, number> = {};
        for (const trade of completedTrades) {
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
        for (const trade of completedTrades) {
          const listing = trade.listing as unknown as { hours_range?: number } | null;
          const hours = listing?.hours_range ?? 0;
          if (trade.proposer_user_id === user.id) {
            offered += hours;
          } else {
            received += hours;
          }
        }
        setHourlyBalance({ offered, received });
      }

      // Summary Metrics
      const { count: tradesCount } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .or(`proposer_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`)
        .eq('status', 'Completed');

      const { count: proofsCount } = await supabase
        .from('proofs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

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

      setTelemetryTracks((tracks as TelemetryTrack[]) ?? []);
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
    setTelemetryTracks((prev) => [...prev, data as TelemetryTrack]);
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
