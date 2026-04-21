import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import type { Profile } from '@/types/database';

export function useAuth() {
  const { user, session, profile, loading, setUser, setSession, setProfile, setLoading, reset } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchProfile(currentSession.user.id);
      }
      setLoading(false);
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data as Profile);
    }
  }

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Log failed login to audit log
      await supabase.from('audit_log').insert({
        event_type: 'failed_login',
        metadata: { error: error.message },
      });
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, mononym: string, dnaType: string, customDnaLabel?: string, customDnaTags?: string[]) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { mononym, dna_type: dnaType, custom_dna_label: customDnaLabel, custom_dna_tags: customDnaTags },
      },
    });
    if (error) throw error;

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        mononym,
        dna_type: dnaType,
        custom_dna_label: customDnaLabel ?? null,
        custom_dna_tags: customDnaTags ?? [],
        current_trust_score: 0,
        pinned_proofs: [],
        preferred_language: 'en',
        preferred_theme: 'dark',
      });
    }

    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    reset();
    navigate('/login');
  }, [navigate, reset]);

  const signOutAll = useCallback(async () => {
    await supabase.auth.signOut({ scope: 'global' });
    reset();
    navigate('/login');
  }, [navigate, reset]);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`,
    });
    if (error) throw error;
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (error) throw error;
    setProfile({ ...profile!, ...updates });
  }, [user, profile, setProfile]);

  return {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    signOutAll,
    resetPassword,
    resendVerification,
    updateProfile,
    fetchProfile,
    isAuthenticated: !!session,
    isVerified: !!user?.email_confirmed_at,
  };
}
