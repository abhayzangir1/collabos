import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Link2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/errors';

export default function WorkspaceJoin() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'joining' | 'joined' | 'error'>('joining');
  const [message, setMessage] = useState('Joining workspace...');

  useEffect(() => {
    let mounted = true;

    async function acceptInvitation() {
      if (!token) {
        setStatus('error');
        setMessage('This invitation link is missing a token.');
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate(`/login?redirect=${encodeURIComponent(`/workspaces/join/${token}`)}`, { replace: true });
        return;
      }

      const { data, error } = await supabase.rpc('accept_workspace_invitation', {
        p_token: token,
      });

      if (!mounted) return;

      if (error) {
        setStatus('error');
        setMessage(getErrorMessage(error));
        return;
      }

      setStatus('joined');
      setMessage('Workspace joined.');
      window.setTimeout(() => navigate(`/workspaces/${data as string}`, { replace: true }), 700);
    }

    void acceptInvitation();

    return () => {
      mounted = false;
    };
  }, [navigate, token]);

  return (
    <div className="page-container">
      <div className="neu-card" style={{ maxWidth: 460, margin: '4rem auto', padding: '1.5rem', textAlign: 'center' }}>
        <div style={{
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
          borderRadius: 'var(--radius-md)',
          background: status === 'error' ? 'rgba(239,68,68,0.12)' : 'var(--accent-muted)',
          border: `2px solid ${status === 'error' ? 'var(--error)' : 'var(--accent)'}`,
          color: status === 'error' ? 'var(--error)' : 'var(--accent)',
        }}>
          {status === 'joined' ? <Check size={22} /> : status === 'joining' ? <div className="spinner" style={{ width: 20, height: 20 }} /> : <Link2 size={22} />}
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>
          {status === 'error' ? 'Invitation unavailable' : status === 'joined' ? 'You are in' : 'Joining workspace'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{message}</p>
        {status === 'error' && (
          <button className="neu-btn neu-btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/workspaces')}>
            Back to Workspaces
          </button>
        )}
      </div>
    </div>
  );
}
