import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeConfig {
  channel: string;
  table: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onEvent: (payload: Record<string, unknown>) => void;
  enabled?: boolean;
}

export function useRealtime(configs: RealtimeConfig[]) {
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    const activeConfigs = configs.filter((c) => c.enabled !== false);
    if (activeConfigs.length === 0) return;

    const channels: RealtimeChannel[] = [];

    for (const config of activeConfigs) {
      const channel = supabase
        .channel(config.channel)
        .on(
          'postgres_changes' as never,
          {
            event: config.event ?? '*',
            schema: 'public',
            table: config.table,
            filter: config.filter,
          } as never,
          (payload: Record<string, unknown>) => {
            config.onEvent(payload);
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            setConnectionError(false);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setConnectionError(true);
          }
        });

      channels.push(channel);
    }

    channelsRef.current = channels;

    return () => {
      for (const channel of channels) {
        supabase.removeChannel(channel);
      }
      channelsRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configs.map((c) => c.channel + c.table + (c.filter ?? '')).join(',')]);

  const refresh = useCallback(() => {
    setConnectionError(false);
    // Force re-subscribe by removing and re-creating channels
    for (const channel of channelsRef.current) {
      supabase.removeChannel(channel);
    }
  }, []);

  return { connectionError, refresh };
}

export function usePresence(channelName: string, userId: string, _metadata?: Record<string, unknown>) {
  const [presenceState, setPresenceState] = useState<Record<string, unknown>[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(channelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const entries: Record<string, unknown>[] = [];
        for (const key of Object.keys(state)) {
          const arr = state[key] as Record<string, unknown>[];
          if (arr) {
            for (const item of arr) {
              entries.push(item);
            }
          }
        }
        setPresenceState(entries);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId, online_at: new Date().toISOString(), ..._metadata });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [channelName, userId, _metadata]);

  const updatePresence = useCallback(async (data: Record<string, unknown>) => {
    if (channelRef.current) {
      await channelRef.current.track({ user_id: userId, ...data });
    }
  }, [userId]);

  return { presenceState, updatePresence };
}
