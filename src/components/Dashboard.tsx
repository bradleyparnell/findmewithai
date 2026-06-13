import React, { useEffect, useState } from 'react';
import { Search, Plus, LogOut, TrendingUp, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AnalysisResult } from '../types';

interface Scan {
  id: string;
  url: string;
  score: number;
  result: AnalysisResult;
  created_at: string;
}

interface Props {
  user: { email?: string };
  isPro: boolean;
  onViewScan: (scan: Scan) => void;
  onNewScan: () => void;
  onUpgrade: () => void;
  onSignOut: () => void;
}

function scoreColor(score: number) {
  if (score >= 80) return '#7c3aed';
  if (score >= 60) return '#6d28d9';
  if (score >= 40) return '#d97706';
  return '#ef4444';
}

function scoreLabel(score: number) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs work';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const Dashboard: React.FC<Props> = ({ user, isPro, onViewScan, onNewScan, onUpgrade, onSignOut }) => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('scans')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setScans((data as Scan[]) || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const groupedByUrl = scans.reduce<Record<string, Scan[]>>((acc, scan) => {
    const key = scan.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!acc[key]) acc[key] = [];
    acc[key].push(scan);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '36px 24px 60px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '28px', height: '28px', background: '#7c3aed', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={13} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#7c3aed' }}>findmewith.ai</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', margin: 0 }}>Your Dashboard</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>{user.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onNewScan}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          >
            <Plus size={14} /> Scan a New Site
          </button>
          <button
            onClick={onSignOut}
            title="Sign out"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'transparent', color: '#9ca3af', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '9px 12px', fontSize: '13px', cursor: 'pointer' }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Sites scanned', value: Object.keys(groupedByUrl).length },
          { label: 'Total scans', value: scans.length },
          { label: 'Best score', value: scans.length ? Math.max(...scans.map(s => s.score)) + '%' : '—' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#111827' }}>{loading ? '…' : stat.value}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Scan history */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '26px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <TrendingUp size={16} style={{ color: '#7c3aed' }} />
          Your Scan History
        </h2>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' }}>Loading your scans…</div>
        )}

        {!loading && scans.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔍</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>No scans yet</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>Run your first scan to see your AI visibility score.</div>
            <button
              onClick={onNewScan}
              style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >
              Scan My Site →
            </button>
          </div>
        )}

        {!loading && scans.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {scans.map(scan => {
              const domain = scan.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
              const color = scoreColor(scan.score);
              return (
                <div
                  key={scan.id}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', border: '1.5px solid #f3f4f6', borderRadius: '14px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#ddd6fe')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#f3f4f6')}
                  onClick={() => onViewScan(scan)}
                >
                  {/* Score circle */}
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: `${color}18`, border: `2.5px solid ${color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '14px', fontWeight: 900, color, lineHeight: 1 }}>{scan.score}</span>
                    <span style={{ fontSize: '9px', color, fontWeight: 600 }}>/ 100</span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{domain}</span>
                      <ExternalLink size={11} style={{ color: '#9ca3af', flexShrink: 0 }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color, background: `${color}14`, padding: '2px 8px', borderRadius: '99px' }}>{scoreLabel(scan.score)}</span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{formatDate(scan.created_at)}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed', flexShrink: 0 }}>View →</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pro upsell (free users only) */}
      {!isPro && (
        <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1.5px solid #ddd6fe', borderRadius: '18px', padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>⚡ Unlock everything with Pro</div>
            <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.55 }}>
              Content generators, code snippets, and everything you need to go from invisible to unforgettable.
            </div>
          </div>
          <button
            onClick={onUpgrade}
            style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', padding: '10px 20px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            See Pro — $29/mo →
          </button>
        </div>
      )}
    </div>
  );
};
