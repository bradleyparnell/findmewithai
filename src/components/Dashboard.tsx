import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Search, Plus, LogOut, TrendingUp, ExternalLink, Zap, Target,
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Trash2,
  RefreshCw, Award, ArrowRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AnalysisResult } from '../types';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://findmewithai-production.up.railway.app';

const CATEGORY_LABELS: Record<string, string> = {
  structured_data: 'Structured Data',
  content_quality: 'Content Quality',
  entity_authority: 'Entity Authority',
  technical_seo: 'Technical SEO',
  ai_bonus: 'AI Bonus',
};

const CATEGORY_MAX: Record<string, number> = {
  structured_data: 35,
  content_quality: 25,
  entity_authority: 20,
  technical_seo: 15,
  ai_bonus: 5,
};

const COMPETITOR_COLORS = ['#f59e0b', '#06b6d4', '#10b981', '#ef4444', '#f97316'];

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
  return 'Needs Work';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const FINDING_PLAIN_LABELS: Record<string, string> = {
  has_schema_org:          'Business info cards (tells AI who you are)',
  has_organization_schema: 'Business name & details in AI format',
  has_faq_schema:          'FAQ answers AI can cite',
  has_person_schema:       'Who runs this business',
  has_article_schema:      'Blog posts labeled for AI',
  content_length:          'Enough content for AI to read',
  has_about_page:          'About page',
  has_meta_description:    'One-sentence page summaries',
  has_contact_info:        'Contact info AI can find',
  has_llms_txt:            'AI introduction file (llms.txt)',
  https_enabled:           'Secure website (HTTPS)',
  has_sitemap:             'Sitemap for AI to navigate',
  has_robots_txt:          'Site navigation instructions',
  has_title_tag:           'Clear page titles',
  has_h1:                  'Main heading on each page',
  has_og_tags:             'Social sharing preview',
};

function getGapAnalysis(myFindings: AnalysisResult['findings'], compFindings: AnalysisResult['findings']) {
  // Things the competitor passes but you fail
  const myFail = new Set(myFindings.filter(f => f.status === 'fail').map(f => f.id));
  const compPass = new Set(compFindings.filter(f => f.status === 'pass').map(f => f.id));
  const gaps = [...myFail].filter(id => compPass.has(id));

  // Things you pass but competitor fails
  const myPass = new Set(myFindings.filter(f => f.status === 'pass').map(f => f.id));
  const compFail = new Set(compFindings.filter(f => f.status === 'fail').map(f => f.id));
  const advantages = [...myPass].filter(id => compFail.has(id));

  return { gaps, advantages };
}

function normalizePct(categories: AnalysisResult['categories']): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, max] of Object.entries(CATEGORY_MAX)) {
    result[key] = Math.round(((categories[key as keyof typeof categories] || 0) / max) * 100);
  }
  return result;
}

interface Scan {
  id: string;
  url: string;
  score: number;
  result: AnalysisResult;
  created_at: string;
}

interface Competitor {
  id: string;
  user_id: string;
  url: string;
  score: number;
  result: AnalysisResult;
  last_scanned_at: string;
  created_at: string;
}

interface Props {
  user: { id?: string; email?: string };
  isPro: boolean;
  onViewScan: (scan: Scan) => void;
  onNewScan: () => void;
  onUpgrade: () => void;
  onSignOut: () => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ fontSize: '12px', color: entry.color, margin: '2px 0' }}>
          {entry.name}: <strong>{entry.value}{entry.name === 'Score' ? '' : '%'}</strong>
        </p>
      ))}
    </div>
  );
};

export const Dashboard: React.FC<Props> = ({ user, isPro, onViewScan, onNewScan, onUpgrade, onSignOut }) => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [addingCompetitor, setAddingCompetitor] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [competitorError, setCompetitorError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const latestScan = scans[0] ?? null;

  const loadData = useCallback(async () => {
    setLoading(true);
    const [scansRes, compRes] = await Promise.all([
      supabase.from('scans').select('*').order('created_at', { ascending: false }),
      supabase.from('competitors').select('*').order('created_at', { ascending: false }),
    ]);
    setScans((scansRes.data as Scan[]) ?? []);
    setCompetitors((compRes.data as Competitor[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddCompetitor = async () => {
    if (!competitorUrl.trim()) return;
    setAddingCompetitor(true);
    setCompetitorError('');
    const url = /^https?:\/\//i.test(competitorUrl.trim())
      ? competitorUrl.trim()
      : 'https://' + competitorUrl.trim();
    try {
      const res = await fetch(`${BACKEND}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      const result: AnalysisResult = await res.json();
      await supabase.from('competitors').insert({
        user_id: user.id,
        url,
        score: result.score,
        result,
        last_scanned_at: new Date().toISOString(),
      });
      setCompetitorUrl('');
      await loadData();
    } catch {
      setCompetitorError('Could not analyze that URL. Please check it and try again.');
    } finally {
      setAddingCompetitor(false);
    }
  };

  const handleRemoveCompetitor = async (id: string) => {
    await supabase.from('competitors').delete().eq('id', id);
    setCompetitors(prev => prev.filter(c => c.id !== id));
  };

  const handleRefreshCompetitor = async (comp: Competitor) => {
    setScanningId(comp.id);
    try {
      const res = await fetch(`${BACKEND}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: comp.url }),
      });
      if (!res.ok) return;
      const result: AnalysisResult = await res.json();
      await supabase.from('competitors').update({
        score: result.score,
        result,
        last_scanned_at: new Date().toISOString(),
      }).eq('id', comp.id);
      await loadData();
    } catch { /* silent */ } finally {
      setScanningId(null);
    }
  };

  // ── Chart data ──
  const categoryChartData = React.useMemo(() => {
    if (!latestScan) return [];
    const myPct = normalizePct(latestScan.result.categories);
    return Object.entries(CATEGORY_LABELS).map(([key, label]) => {
      const entry: Record<string, any> = { category: label, 'Your Site': myPct[key] };
      competitors.forEach(comp => {
        const domain = comp.url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
        entry[domain] = normalizePct(comp.result.categories)[key];
      });
      return entry;
    });
  }, [latestScan, competitors]);

  const trendData = React.useMemo(() => {
    if (!latestScan) return [];
    const myDomain = latestScan.url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
    return scans
      .filter(s => s.url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0] === myDomain)
      .reverse()
      .map(s => ({
        date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Score: s.score,
      }));
  }, [scans, latestScan]);

  // Action items from findings
  const failItems = latestScan?.result.findings.filter(f => f.status === 'fail') ?? [];
  const warnItems = latestScan?.result.findings.filter(f => f.status === 'warn') ?? [];
  const passItems = latestScan?.result.findings.filter(f => f.status === 'pass') ?? [];

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '36px 24px 80px' }}>

      {/* ── HEADER ── */}
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
            <Plus size={14} /> New Scan
          </button>
          <button
            onClick={onSignOut}
            title="Sign out"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'transparent', color: '#9ca3af', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '9px 12px', fontSize: '13px', cursor: 'pointer' }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af', fontSize: '14px' }}>
          Loading your data…
        </div>
      ) : latestScan === null ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: '20px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>Nothing here yet</div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>Run your first scan to see your AI visibility score and dashboard.</div>
          <button onClick={onNewScan} style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
            Scan My Site →
          </button>
        </div>
      ) : (
        <>
          {/* ── OVERVIEW: score + category bars ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: '16px', marginBottom: '20px' }}>

            {/* Score circle */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>AI Score</div>
              <div style={{ position: 'relative', width: '96px', height: '96px', marginBottom: '12px' }}>
                <svg width="96" height="96" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="#f3f4f6" strokeWidth="9" />
                  <circle
                    cx="48" cy="48" r="40"
                    fill="none"
                    stroke={scoreColor(latestScan.score)}
                    strokeWidth="9"
                    strokeDasharray={`${(latestScan.score / 100) * 251.33} 251.33`}
                    strokeLinecap="round"
                    transform="rotate(-90 48 48)"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '26px', fontWeight: 900, color: scoreColor(latestScan.score), lineHeight: 1 }}>{latestScan.score}</span>
                  <span style={{ fontSize: '10px', color: '#9ca3af' }}>/ 100</span>
                </div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: scoreColor(latestScan.score) }}>{scoreLabel(latestScan.score)}</span>
              <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{formatDate(latestScan.created_at)}</span>
              <button
                onClick={() => onViewScan(latestScan)}
                style={{ marginTop: '12px', fontSize: '11px', fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', border: 'none', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer' }}
              >
                View Full Report →
              </button>
            </div>

            {/* Category bars */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '22px 24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '16px' }}>How you score in each area</div>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                const pct = normalizePct(latestScan.result.categories)[key];
                const color = pct >= 70 ? '#7c3aed' : pct >= 40 ? '#d97706' : '#ef4444';
                return (
                  <div key={key} style={{ marginBottom: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>{label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color }}>{pct}%</span>
                    </div>
                    <div style={{ background: '#f3f4f6', borderRadius: '99px', height: '7px' }}>
                      <div style={{ background: color, borderRadius: '99px', height: '7px', width: `${pct}%`, transition: 'width 0.7s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── SCORE TREND ── */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '22px 24px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={15} style={{ color: '#7c3aed' }} /> Score Over Time
            </div>
            {trendData.length < 2 ? (
              <div style={{ textAlign: 'center', padding: '24px', background: '#f9fafb', borderRadius: '12px', fontSize: '13px', color: '#6b7280' }}>
                📈 Run more scans over time to see your progress here — this chart fills in automatically.
              </div>
            ) : (
              <>
                <div style={!isPro ? { filter: 'blur(5px)', pointerEvents: 'none' } : {}}>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="Score" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: '#7c3aed' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {!isPro && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', border: '1.5px solid #ddd6fe', borderRadius: '14px', padding: '16px 22px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>⚡ Track your progress over time with Pro</div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>See your score trend and watch your ranking climb.</div>
                      <button onClick={onUpgrade} style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', padding: '7px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                        Upgrade to Pro →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── COMPETITOR COMPARISON ── */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '22px 24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Target size={15} style={{ color: '#7c3aed' }} /> How Do You Compare?
              </div>
              {isPro && competitors.length < 5 && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: '1 1 280px', maxWidth: '360px' }}>
                  <input
                    type="text"
                    value={competitorUrl}
                    onChange={e => { setCompetitorUrl(e.target.value); setCompetitorError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleAddCompetitor()}
                    placeholder="Paste a competitor's website URL"
                    style={{ flex: 1, padding: '7px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
                  />
                  <button
                    onClick={handleAddCompetitor}
                    disabled={addingCompetitor || !competitorUrl.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', background: addingCompetitor ? '#e5e7eb' : '#7c3aed', color: addingCompetitor ? '#9ca3af' : 'white', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', fontWeight: 700, cursor: addingCompetitor ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {addingCompetitor ? 'Scanning…' : <><Plus size={12} style={{ marginRight: '3px' }} />Add</>}
                  </button>
                </div>
              )}
            </div>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px' }}>Add a competitor's website and we'll show you exactly what they're doing that you're not — and where you're already winning.</p>

            {competitorError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#dc2626', marginBottom: '12px' }}>
                {competitorError}
              </div>
            )}

            {!isPro ? (
              <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1.5px solid #ddd6fe', borderRadius: '14px', padding: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '5px' }}>🏆 See exactly what your competition is doing</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>Paste any competitor's URL and get a side-by-side breakdown — including what they have that you don't.</div>
                </div>
                <button onClick={onUpgrade} style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Upgrade to Pro →
                </button>
              </div>
            ) : competitors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 24px', background: '#f9fafb', borderRadius: '14px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏁</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#374151', marginBottom: '5px' }}>No competitors added yet</div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Paste a competitor URL above — we'll scan it in seconds and show you how you compare.</div>
              </div>
            ) : (
              <>
                {/* Score cards */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${1 + competitors.length}, 1fr)`, gap: '10px', marginBottom: '24px' }}>
                  <div style={{ background: '#f5f3ff', border: '2px solid #7c3aed', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Your Site</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {latestScan.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: scoreColor(latestScan.score) }}>{latestScan.score}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>/ 100</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: scoreColor(latestScan.score), marginTop: '4px' }}>{scoreLabel(latestScan.score)}</div>
                  </div>

                  {competitors.map((comp, i) => {
                    const diff = latestScan.score - comp.score;
                    return (
                      <div key={comp.id} style={{ background: '#fffbeb', border: `2px solid ${COMPETITOR_COLORS[i % COMPETITOR_COLORS.length]}`, borderRadius: '14px', padding: '14px', textAlign: 'center', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', position: 'absolute', top: '6px', right: '6px' }}>
                          <button onClick={() => handleRefreshCompetitor(comp)} disabled={scanningId === comp.id} title="Re-scan" style={{ background: 'none', border: 'none', cursor: scanningId === comp.id ? 'not-allowed' : 'pointer', color: '#d1d5db', padding: '2px', lineHeight: 0 }}>
                            <RefreshCw size={11} style={scanningId === comp.id ? { animation: 'spin 1s linear infinite' } : {}} />
                          </button>
                          <button onClick={() => handleRemoveCompetitor(comp.id)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: '2px', lineHeight: 0 }}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: COMPETITOR_COLORS[i % COMPETITOR_COLORS.length], textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Competitor</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {comp.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: scoreColor(comp.score) }}>{comp.score}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>/ 100</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '6px', color: diff > 0 ? '#16a34a' : diff < 0 ? '#dc2626' : '#6b7280' }}>
                          {diff > 0 ? `▲ You're ahead by ${diff}` : diff < 0 ? `▼ They're ahead by ${Math.abs(diff)}` : 'Tied'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Gap analysis for each competitor */}
                {competitors.map((comp, i) => {
                  const { gaps, advantages } = getGapAnalysis(latestScan.result.findings, comp.result.findings);
                  const compDomain = comp.url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
                  const compAhead = comp.score > latestScan.score;
                  return (
                    <div key={comp.id} style={{ border: '1px solid #e5e7eb', borderRadius: '16px', padding: '18px 20px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>
                        {compAhead
                          ? `⚠️ ${compDomain} is beating you in AI visibility — here's how to close the gap`
                          : `✅ You're ahead of ${compDomain} — here's what to protect`}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                        They score <strong>{comp.score}</strong> vs your <strong>{latestScan.score}</strong>.
                      </div>

                      {gaps.length > 0 && (
                        <div style={{ marginBottom: '14px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                            🔴 They have this — you don't ({gaps.length})
                          </div>
                          {gaps.map(id => (
                            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', marginBottom: '6px' }}>
                              <ArrowRight size={13} style={{ color: '#dc2626', flexShrink: 0 }} />
                              <span style={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                                {FINDING_PLAIN_LABELS[id] ?? id}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {advantages.length > 0 && (
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                            🟢 You have this — they don't ({advantages.length})
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {advantages.map(id => (
                              <span key={id} style={{ fontSize: '12px', fontWeight: 600, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '99px', padding: '4px 12px' }}>
                                ✓ {FINDING_PLAIN_LABELS[id] ?? id}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {gaps.length === 0 && advantages.length === 0 && (
                        <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
                          You and this competitor are doing the same things — the score difference is in content depth and authority signals.
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Grouped bar chart */}
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '14px', marginTop: '8px' }}>
                  Side-by-side breakdown — each area of your site vs. theirs
                </div>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={categoryChartData} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Your Site" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                    {competitors.map((comp, i) => {
                      const domain = comp.url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
                      return <Bar key={comp.id} dataKey={domain} fill={COMPETITOR_COLORS[i % COMPETITOR_COLORS.length]} radius={[4, 4, 0, 0]} />;
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </div>

          {/* ── WHAT TO FIX NEXT ── */}
          {(failItems.length > 0 || warnItems.length > 0 || passItems.length > 0) && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '22px 24px', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={15} style={{ color: '#d97706' }} /> What to Fix Next
              </div>

              {failItems.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                    <AlertTriangle size={12} style={{ color: '#ef4444' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fix These First</span>
                  </div>
                  {failItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '10px', padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', marginBottom: '6px' }}>
                      <div style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', flexShrink: 0, marginTop: '5px' }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>{item.label}</div>
                        {item.suggestion && <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>{item.suggestion}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {warnItems.length > 0 && (
                <div style={{ marginBottom: passItems.length > 0 ? '16px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                    <AlertTriangle size={12} style={{ color: '#d97706' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Worth Improving</span>
                  </div>
                  {warnItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '10px', padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', marginBottom: '6px' }}>
                      <div style={{ width: '6px', height: '6px', background: '#d97706', borderRadius: '50%', flexShrink: 0, marginTop: '5px' }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>{item.label}</div>
                        {item.suggestion && <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>{item.suggestion}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {passItems.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                    <CheckCircle size={12} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Already Looking Good</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {passItems.map(item => (
                      <span key={item.id} style={{ fontSize: '11px', fontWeight: 600, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '99px', padding: '3px 10px' }}>
                        ✓ {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SCAN HISTORY ── */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '22px 24px', marginBottom: '20px' }}>
            <button
              onClick={() => setShowHistory(h => !h)}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0 }}
            >
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Award size={15} style={{ color: '#7c3aed' }} />
                Scan History
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#9ca3af', background: '#f3f4f6', borderRadius: '99px', padding: '1px 8px' }}>{scans.length}</span>
              </div>
              {showHistory ? <ChevronUp size={16} style={{ color: '#9ca3af' }} /> : <ChevronDown size={16} style={{ color: '#9ca3af' }} />}
            </button>

            {showHistory && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {scans.map(scan => {
                  const domain = scan.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                  const color = scoreColor(scan.score);
                  return (
                    <div
                      key={scan.id}
                      onClick={() => onViewScan(scan)}
                      style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', border: '1.5px solid #f3f4f6', borderRadius: '12px', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#ddd6fe')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#f3f4f6')}
                    >
                      <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: `${color}18`, border: `2.5px solid ${color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 900, color, lineHeight: 1 }}>{scan.score}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{domain}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{formatDate(scan.created_at)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color, background: `${color}14`, padding: '2px 8px', borderRadius: '99px' }}>{scoreLabel(scan.score)}</span>
                        <ExternalLink size={12} style={{ color: '#c4b5fd' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── PRO UPSELL (free only) ── */}
          {!isPro && (
            <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1.5px solid #ddd6fe', borderRadius: '18px', padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>⚡ Unlock everything with Pro</div>
                <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.55 }}>
                  Competitor tracking, score trends, content generators, and code snippets.
                </div>
              </div>
              <button onClick={onUpgrade} style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', padding: '10px 20px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                See Pro — $29/mo →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
