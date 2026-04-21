import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';

import { LoadingFallback } from '@/components/ui/ErrorBoundary';
import { Sidebar, MobileNav } from './Sidebar';

export function ProtectedRoute() {
  const { session, loading, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login');
    }
    if (!loading && session && user && !user.email_confirmed_at) {
      navigate('/verify-email');
    }
  }, [loading, session, user, navigate]);

  if (loading) {
    return <LoadingFallback />;
  }

  if (!session) {
    return null;
  }

  return <Outlet />;
}

export function AppLayout() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !user.email_confirmed_at) {
      navigate('/verify-email');
    }
  }, [user, navigate]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Sidebar />
      <MobileNav />
      <main className="main-content" style={{ minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}

export function PublicLayout() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Outlet />
    </div>
  );
}
