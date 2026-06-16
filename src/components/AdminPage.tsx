import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

const API = import.meta.env.VITE_API_URL || 'https://findmewithai-production.up.railway.app';

interface Scan {
  id: string;
  user_id: string | null;
  email: string | null;
  url: string;
  score: number | null;
  created_at: string;
}

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  scan_count: number;
  latest_scan: Scan | null;
}

interface AdminStats {
  users: AdminUser[];
  scans: Scan[];
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function scoreColor(score: number | null): string {
  if (score === null) return '#94a3b8';
  if (score >= 71) return '#22c55e';
  if (score >= 41) return '#f59e0b';
  return '#ef4444';
}

function scoreEmoji(score: number | null): string {
  if (score === null) return '—';
  if (score >= 71) return '🟢';
  if (score >= 41) return '🟡';
  return '🔴';
}

type Tab = 'users' | 'scans';

export const AdminPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tab, setTab] = useState<Tab>('users');
  const [refreshing, setRefreshing] = useState(false);

  async function load(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setAuthError('Not logged in.'); return; }
      if (session.user.email !== 'hello@genierocket.com') {
        setAuthError('Admin access only.');
        return;
      }
      const res = await fetch(`${API}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setAuthError(e.error || `Error ${res.status}`);
        return;
      }
      const data: AdminStats = await res.json();
      setStats(data);
      setAuthError(null);
    } catch (err: unknown) {
      setAuthError((err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ── Auth / loading states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#a78bfa', fontSize: 18 }}>Loading…</div>
      </div>
    );
  }

  if (authError) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0a2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ color: '#ef4444', fontSize: 18 }}>{authError}</div>
        <a href="/" style={{ color: '#a78bfa', textDecoration: 'underline', fontSize: 14 }}>← Back to home</a>
      </div>
    );
  }

  if (!stats) return null;

  const avgScore = stats.scans.length
    ? Math.round(stats.scans.filter(s => s.score !== null).reduce((a, s) => a + (s.score ?? 0), 0) / stats.scans.filter(s => s.score !== null).length)
    : 0;

  // ── Styles ─────────────────────────────────────────────────────────────────
  const page: React.CSSProperties = {
    minHeight: '100vh',
    background: '#f8f7ff',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const topBar: React.CSSProperties = {
    background: '#1e1145',
    padding: '14px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const container: React.CSSProperties = {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '32px 24px',
  };

  const statCard: React.CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    padding: '20px 24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    flex: 1,
  };

  const tableCard: React.CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    marginTop: 24,
  };

  const th: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#64748b',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  };

  const td: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: 14,
    color: '#1e293b',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
  };

  return (
    <div style={page}>
      {/* Top bar */}
      <div style={topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>findmewith.ai</span>
          <span style={{ background: '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{ background: 'transparent', border: '1px solid #4c1d95', color: '#a78bfa', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontSize: 13 }}
          >
            {refreshing ? 'Refreshing…' : '↻ Refresh'}
          </button>
          <a href="/" style={{ color: '#94a3b8', fontSize: 13, textDecoration: 'none' }}>← Back to app</a>
        </div>
      </div>

      <div style={container}>
        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={statCard}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Users</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: '#1e1145' }}>{stats.users.length}</div>
          </div>
          <div style={statCard}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Scans</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: '#1e1145' }}>{stats.scans.length}</div>
          </div>
          <div style={statCard}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Score</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: scoreColor(avgScore) }}>{avgScore}</div>
          </div>
          <div style={statCard}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scans / User</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: '#1e1145' }}>
              {stats.users.length ? (stats.scans.length / stats.users.length).toFixed(1) : '—'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginTop: 24, borderBottom: '2px solid #e2e8f0' }}>
          {(['users', 'scans'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                background: 'none',
                border: 'none',
                borderBottom: tab === t ? '2px solid #7c3aed' : '2px solid transparent',
                marginBottom: -2,
                cursor: 'pointer',
                color: tab === t ? '#7c3aed' : '#64748b',
                textTransform: 'capitalize',
              }}
            >
              {t === 'users' ? `Users (${stats.users.length})` : `Scan Log (${stats.scans.length})`}
            </button>
          ))}
        </div>

        {/* Users table */}
        {tab === 'users' && (
          <div style={tableCard}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Email</th>
                  <th style={th}>Signed Up</th>
                  <th style={th}>Last Active</th>
                  <th style={th}>Scans</th>
                  <th style={th}>Latest Site</th>
                  <th style={th}>Score</th>
                </tr>
              </thead>
              <tbody>
                {stats.users
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map(u => (
                    <tr key={u.id} style={{ background: '#fff' }}>
                      <td style={td}>{u.email}</td>
                      <td style={{ ...td, color: '#64748b' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={{ ...td, color: '#64748b' }}>{timeAgo(u.last_sign_in_at)}</td>
                      <td style={{ ...td, fontWeight: 700, color: '#7c3aed' }}>{u.scan_count}</td>
                      <td style={{ ...td, color: '#334155', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.latest_scan ? u.latest_scan.url.replace(/^https?:\/\//, '') : '—'}
                      </td>
                      <td style={td}>
                        {u.latest_scan?.score != null ? (
                          <span style={{ fontWeight: 700, color: scoreColor(u.latest_scan.score) }}>
                            {scoreEmoji(u.latest_scan.score)} {u.latest_scan.score}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Scans table */}
        {tab === 'scans' && (
          <div style={tableCard}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>When</th>
                  <th style={th}>Email</th>
                  <th style={th}>URL</th>
                  <th style={th}>Score</th>
                </tr>
              </thead>
              <tbody>
                {stats.scans.map(s => (
                  <tr key={s.id}>
                    <td style={{ ...td, color: '#64748b', whiteSpace: 'nowrap' }}>{timeAgo(s.created_at)}</td>
                    <td style={{ ...td, color: '#475569' }}>{s.email || '—'}</td>
                    <td style={{ ...td, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <a href={s.url} target="_blank" rel="noreferrer" style={{ color: '#7c3aed', textDecoration: 'none' }}>
                        {s.url.replace(/^https?:\/\//, '')}
                      </a>
                    </td>
                    <td style={td}>
                      {s.score != null ? (
                        <span style={{ fontWeight: 700, color: scoreColor(s.score) }}>
                          {scoreEmoji(s.score)} {s.score}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
