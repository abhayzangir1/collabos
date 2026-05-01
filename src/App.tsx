import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useThemeStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { AppLayout, ProtectedRoute, PublicLayout } from '@/components/layout/AppLayout';
import { ErrorBoundary, LoadingFallback } from '@/components/ui/ErrorBoundary';
import type { Profile } from '@/types/database';

// Eager-loaded (critical path)
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import VerifyEmail from '@/pages/VerifyEmail';
import Dashboard from '@/pages/Dashboard';

// Lazy-loaded (non-critical)
const ProofChain = lazy(() => import('@/pages/ProofChain'));
const Market = lazy(() => import('@/pages/Market'));
const TradeHub = lazy(() => import('@/pages/TradeHub'));
const TradeDetail = lazy(() => import('@/pages/TradeDetail'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Workspaces = lazy(() => import('@/pages/Workspaces'));
const WorkspaceDetail = lazy(() => import('@/pages/WorkspaceDetail'));
const WorkspaceJoin = lazy(() => import('@/pages/WorkspaceJoin'));
const KnowledgeBase = lazy(() => import('@/pages/KnowledgeBase'));
const Settings = lazy(() => import('@/pages/Settings'));

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setProfile, setLoading } = useAuthStore();
  const { theme } = useThemeStore();

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initialize auth
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session) {
          setSession(session);
          setUser(session.user);

          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileData && mounted) {
            setProfile(profileData as Profile);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', newSession.user.id)
          .single();

        if (profileData && mounted) {
          setProfile(profileData as Profile);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthInitializer>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/workspaces/join/:token" element={<WorkspaceJoin />} />
                <Route path="/knowledge-base" element={<KnowledgeBase />} />
                <Route path="/knowledge-base/:section" element={<KnowledgeBase />} />
                <Route path="/knowledge-base/:section/:article" element={<KnowledgeBase />} />
              </Route>

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/proofchain" element={<ProofChain />} />
                  <Route path="/market" element={<Market />} />
                  <Route path="/trades" element={<TradeHub />} />
                  <Route path="/trades/:id" element={<TradeDetail />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/workspaces" element={<Workspaces />} />
                  <Route path="/workspaces/:id" element={<WorkspaceDetail />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthInitializer>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
