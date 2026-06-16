import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import type { AnalysisResult, AiMarketData } from '../types';
import { ContentStep } from './ContentStep';
import { CodeStep } from './CodeStep';

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

// ── Industry benchmarks ─────────────────────────────────────────────────────
// Avg scores based on sites scanned across industries
interface IndustryBenchmark {
  label: string;
  avg: number; // average total score
  top: number; // top-quartile score
  categories: Record<string, number>; // avg % per category
  keywords: string[];
}

const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmark> = {
  restaurant: {
    label: 'Restaurants & Food',
    avg: 31, top: 58,
    categories: { structured_data: 28, content_quality: 45, entity_authority: 30, technical_seo: 55, ai_bonus: 10 },
    keywords: ['restaurant', 'cafe', 'pizza', 'burger', 'sushi', 'diner', 'eatery', 'food', 'menu', 'dining', 'bistro', 'grill', 'bbq', 'bakery', 'catering'],
  },
  legal: {
    label: 'Law Firms & Legal',
    avg: 47, top: 72,
    categories: { structured_data: 35, content_quality: 60, entity_authority: 55, technical_seo: 65, ai_bonus: 15 },
    keywords: ['law', 'legal', 'attorney', 'lawyer', 'firm', 'counsel', 'litigation', 'solicitor', 'barrister', 'paralegal'],
  },
  dental: {
    label: 'Dental Practices',
    avg: 36, top: 62,
    categories: { structured_data: 30, content_quality: 50, entity_authority: 40, technical_seo: 60, ai_bonus: 10 },
    keywords: ['dental', 'dentist', 'orthodont', 'teeth', 'smile', 'braces', 'implant'],
  },
  medical: {
    label: 'Medical & Healthcare',
    avg: 41, top: 68,
    categories: { structured_data: 38, content_quality: 55, entity_authority: 50, technical_seo: 62, ai_bonus: 12 },
    keywords: ['medical', 'health', 'clinic', 'doctor', 'physician', 'care', 'therapy', 'chiropractic', 'optometry', 'vision'],
  },
  realEstate: {
    label: 'Real Estate',
    avg: 43, top: 67,
    categories: { structured_data: 40, content_quality: 55, entity_authority: 45, technical_seo: 65, ai_bonus: 10 },
    keywords: ['realty', 'realtor', 'real estate', 'homes', 'property', 'mortgage', 'realestate', 'housing', 'broker'],
  },
  fitness: {
    label: 'Fitness & Wellness',
    avg: 33, top: 57,
    categories: { structured_data: 25, content_quality: 50, entity_authority: 30, technical_seo: 55, ai_bonus: 10 },
    keywords: ['gym', 'fitness', 'yoga', 'pilates', 'crossfit', 'wellness', 'trainer', 'workout', 'studio', 'spa', 'massage'],
  },
  outdoorSports: {
    label: 'Outdoor Sports & Racing',
    avg: 30, top: 54,
    categories: { structured_data: 22, content_quality: 45, entity_authority: 28, technical_seo: 52, ai_bonus: 8 },
    keywords: ['trail', 'race', 'racing', 'spartan', 'obstacle', 'mud', 'run', 'running', 'triathlon', 'marathon', 'cycling', 'mtb', 'climb', 'climbing', 'kayak', 'hike', 'hiking', 'adventure', 'outdoor', 'endurance'],
  },
  retail: {
    label: 'Retail & E-commerce',
    avg: 39, top: 64,
    categories: { structured_data: 42, content_quality: 52, entity_authority: 35, technical_seo: 62, ai_bonus: 15 },
    keywords: ['shop', 'store', 'boutique', 'retail', 'ecommerce', 'buy', 'clothing', 'apparel', 'jewelry', 'furniture'],
  },
  automotive: {
    label: 'Automotive',
    avg: 29, top: 53,
    categories: { structured_data: 22, content_quality: 40, entity_authority: 28, technical_seo: 52, ai_bonus: 8 },
    keywords: ['auto', 'car', 'vehicle', 'dealer', 'mechanic', 'repair', 'tire', 'body shop', 'truck', 'collision'],
  },
  accounting: {
    label: 'Accounting & Finance',
    avg: 44, top: 70,
    categories: { structured_data: 32, content_quality: 58, entity_authority: 52, technical_seo: 66, ai_bonus: 12 },
    keywords: ['accounting', 'accountant', 'cpa', 'bookkeeping', 'tax', 'finance', 'financial', 'advisory', 'payroll'],
  },
  marketing: {
    label: 'Marketing & Agencies',
    avg: 56, top: 78,
    categories: { structured_data: 48, content_quality: 70, entity_authority: 55, technical_seo: 72, ai_bonus: 22 },
    keywords: ['marketing', 'agency', 'seo', 'advertising', 'branding', 'creative', 'digital', 'media', 'pr'],
  },
  tech: {
    label: 'Tech & SaaS',
    avg: 63, top: 84,
    categories: { structured_data: 55, content_quality: 75, entity_authority: 60, technical_seo: 80, ai_bonus: 30 },
    keywords: ['software', 'saas', 'app', 'tech', 'platform', 'developer', 'startup', 'cloud', 'api', 'data'],
  },
};

function detectIndustry(url: string): string {
  const lower = url.toLowerCase();
  for (const [key, bench] of Object.entries(INDUSTRY_BENCHMARKS)) {
    if (bench.keywords.some(kw => lower.includes(kw))) return key;
  }
  return 'general';
}

const GENERAL_BENCHMARK: IndustryBenchmark = {
  label: 'Small Businesses',
  avg: 38, top: 63,
  categories: { structured_data: 32, content_quality: 50, entity_authority: 38, technical_seo: 58, ai_bonus: 10 },
  keywords: [],
};

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
  onNavigate: (step: 'content' | 'code') => void;
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
  const [rescanLoading, setRescanLoading] = useState(false);
  const [industryOverride, setIndustryOverride] = useState<string | null>(null);
  const codeRef = useRef<HTMLDivElement>(null);

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

  const handleRescan = async () => {
    if (!latestScan || rescanLoading) return;
    setRescanLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: latestScan.url }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      const result: AnalysisResult = await res.json();
      await supabase.from('scans').insert({
        user_id: user.id,
        email: user.email,
        url: latestScan.url,
        score: result.score,
        result,
      });
      await loadData();
    } catch {
      alert('Re-scan failed. Please try again.');
    } finally {
      setRescanLoading(false);
    }
  };

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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 48px 100px' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: '36px', height: '36px', background: '#7c3aed', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={17} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '18px', color: '#7c3aed' }}>findmewith.ai</span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#111827', margin: 0, lineHeight: 1.1 }}>Your Dashboard</h1>
          <p style={{ fontSize: '15px', color: '#6b7280', margin: '6px 0 0' }}>{user.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onNewScan}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 22px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
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
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', marginBottom: '24px' }}>

            {/* Score circle */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '24px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>AI Visibility Score</div>
              <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '16px' }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="68" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                  <circle
                    cx="80" cy="80" r="68"
                    fill="none"
                    stroke={scoreColor(latestScan.score)}
                    strokeWidth="12"
                    strokeDasharray={`${(latestScan.score / 100) * 427.26} 427.26`}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '60px', fontWeight: 900, color: scoreColor(latestScan.score), lineHeight: 1 }}>{latestScan.score}</span>
                  <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 600 }}>/ 100</span>
                </div>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: scoreColor(latestScan.score) }}>{scoreLabel(latestScan.score)}</span>
              <span style={{ fontSize: '13px', color: '#9ca3af', marginTop: '6px' }}>{formatDate(latestScan.created_at)}</span>
              <button
                onClick={() => onViewScan(latestScan)}
                style={{ marginTop: '16px', fontSize: '14px', fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', border: 'none', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', width: '100%' }}
              >
                See Action Plan →
              </button>
              <button
                onClick={handleRescan}
                disabled={rescanLoading}
                title="Re-scan your site to get a fresh score"
                style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: rescanLoading ? '#9ca3af' : '#6b7280', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '9px 16px', cursor: rescanLoading ? 'not-allowed' : 'pointer', width: '100%' }}
              >
                <RefreshCw size={13} style={{ animation: rescanLoading ? 'spin 1s linear infinite' : 'none' }} />
                {rescanLoading ? 'Scanning…' : 'Re-scan now'}
              </button>
            </div>

            {/* Category bars */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '24px', padding: '32px 36px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '24px' }}>How you score in each area</div>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                const pct = normalizePct(latestScan.result.categories)[key];
                const color = pct >= 70 ? '#7c3aed' : pct >= 40 ? '#d97706' : '#ef4444';
                return (
                  <div key={key} style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '15px', color: '#374151', fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: '15px', fontWeight: 800, color }}>{pct}%</span>
                    </div>
                    <div style={{ background: '#f3f4f6', borderRadius: '99px', height: '10px' }}>
                      <div style={{ background: color, borderRadius: '99px', height: '10px', width: `${pct}%`, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── AI SIGNAL STRENGTH (leads — most valuable data) ── */}
          {latestScan?.result?.ai_market_data && (() => {
            const amd = latestScan.result.ai_market_data as AiMarketData;
            const isGrowing   = amd.trend_direction === 'growing';
            const isDeclining = amd.trend_direction === 'declining';
            const trendIcon  = isGrowing ? '📈' : isDeclining ? '📉' : '📊';
            const trendColor = isGrowing ? '#059669' : isDeclining ? '#ef4444' : '#6b7280';
            const trendBg    = isGrowing ? '#f0fdf4' : isDeclining ? '#fef2f2' : '#f9fafb';
            const trendText  = isGrowing
              ? `Growing +${amd.trend_pct}% — the window to get found is right now`
              : isDeclining
              ? `Down ${amd.trend_pct}% recently — act before competitors pull further ahead`
              : 'Steady volume — consistent improvements keep you visible';
            const score = latestScan.score;
            const isVisible = score >= 70;

            return (
              <div style={{ background: '#0D0D1A', borderRadius: '20px', padding: '26px 28px', marginBottom: '20px', border: '1.5px solid rgba(124,58,237,0.4)', position: 'relative', overflow: 'hidden' }}>
                {/* Subtle radar ring */}
                <div style={{ position: 'absolute', top: '50%', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', border: '1px solid rgba(124,58,237,0.12)', transform: 'translateY(-50%)' }} />
                <div style={{ position: 'absolute', top: '50%', right: '-110px', width: '340px', height: '340px', borderRadius: '50%', border: '1px solid rgba(124,58,237,0.06)', transform: 'translateY(-50%)' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(124,58,237,0.9)', marginBottom: '10px' }}>
                        ⚡ Your Signal in AI Search
                      </div>
                      <div style={{ fontSize: '34px', fontWeight: 900, color: 'white', marginBottom: '8px', lineHeight: 1.15 }}>
                        People ask AI about businesses like yours
                      </div>
                      <div style={{ fontSize: '17px', color: 'rgba(255,255,255,0.5)' }}>
                        Every month, in your market
                      </div>
                    </div>
                    <div style={{ background: 'rgba(124,58,237,0.2)', border: '1.5px solid rgba(124,58,237,0.4)', borderRadius: '20px', padding: '24px 32px', textAlign: 'center', minWidth: '160px' }}>
                      <div style={{ fontSize: '72px', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>
                        {amd.total_volume.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: '8px' }}>AI searches / mo</div>
                    </div>
                  </div>

                  {/* Top keywords */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                      What people are searching
                    </div>
                    {amd.keywords.slice(0, 4).map((kw, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: i < Math.min(amd.keywords.length, 4) - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                        <span style={{ fontSize: '17px', color: 'rgba(255,255,255,0.85)' }}>"{kw.keyword}"</span>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '6px 16px' }}>
                          {kw.volume.toLocaleString()}/mo
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Trend */}
                  <div style={{ background: trendBg, borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{trendIcon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: trendColor }}>{trendText}</span>
                  </div>

                  {/* Visibility hook */}
                  {isVisible ? (
                    <div style={{ background: 'rgba(5,150,105,0.15)', border: '1.5px solid rgba(5,150,105,0.4)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '22px' }}>✅</span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#34d399' }}>You're positioned to appear in these searches</div>
                        <div style={{ fontSize: '13px', color: 'rgba(52,211,153,0.7)', marginTop: '3px' }}>Keep your score above 70 and re-scan monthly to stay visible.</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(220,38,38,0.12)', border: '1.5px solid rgba(220,38,38,0.35)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '22px' }}>⚡</span>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#f87171' }}>
                          You're currently missing these {amd.total_volume.toLocaleString()} searches
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(248,113,113,0.7)', marginTop: '3px' }}>
                          Your competitors are getting found instead. Fix the items below to change that.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* AI Signal leads — see above */}

          {/* ── SCORE TREND ── */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '22px 24px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={15} style={{ color: '#7c3aed' }} /> Your Progress Over Time
            </div>
            {/* Plain English progress summary */}
            {(() => {
              if (trendData.length < 2) return null;
              const first = trendData[0].Score as number;
              const latest = trendData[trendData.length - 1].Score as number;
              const delta = latest - first;
              const firstDate = trendData[0].date;
              if (delta > 0) return (
                <p style={{ fontSize: '13px', color: '#059669', fontWeight: 600, margin: '0 0 14px', background: '#f0fdf4', borderRadius: '8px', padding: '8px 12px', display: 'inline-block' }}>
                  🚀 You've improved <strong>{delta} points</strong> since {firstDate} — keep going!
                </p>
              );
              if (delta < 0) return (
                <p style={{ fontSize: '13px', color: '#d97706', fontWeight: 600, margin: '0 0 14px', background: '#fffbeb', borderRadius: '8px', padding: '8px 12px', display: 'inline-block' }}>
                  ⚠️ Your score has dipped {Math.abs(delta)} points since {firstDate}. Re-scan to see what changed.
                </p>
              );
              return (
                <p style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, margin: '0 0 14px' }}>
                  📊 Your score has stayed steady since {firstDate}. Try fixing an item below to move it up!
                </p>
              );
            })()}
            {trendData.length < 2 ? (
              <div style={{ textAlign: 'center', padding: '24px', background: '#f9fafb', borderRadius: '12px', fontSize: '13px', color: '#6b7280' }}>
                📈 Hit <strong>Re-scan now</strong> above (or check back Monday!) to start tracking your progress here.
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

          {/* ── INDUSTRY BENCHMARKS ── */}
          {(() => {
            const detectedKey = latestScan ? detectIndustry(latestScan.url) : 'general';
            const activeKey = industryOverride ?? detectedKey;
            const bench = INDUSTRY_BENCHMARKS[activeKey] ?? GENERAL_BENCHMARK;
            const score = latestScan?.score ?? 0;
            const delta = score - bench.avg;
            const isAhead = delta >= 0;
            const myPct = latestScan ? normalizePct(latestScan.result.categories) : {};

            // Find biggest category gaps vs industry avg
            const catGaps = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
              key, label,
              mine: myPct[key] ?? 0,
              industry: bench.categories[key] ?? 50,
              gap: (myPct[key] ?? 0) - (bench.categories[key] ?? 50),
            })).sort((a, b) => a.gap - b.gap); // worst first

            const behind = catGaps.filter(c => c.gap < -8);
            const ahead  = catGaps.filter(c => c.gap >  8);

            return (
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '22px 24px', marginBottom: '20px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '4px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={15} style={{ color: '#7c3aed' }} /> How You Compare to Your Industry
                  </div>
                  {/* Industry selector */}
                  <select
                    value={activeKey}
                    onChange={e => setIndustryOverride(e.target.value)}
                    style={{ fontSize: '12px', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', background: 'white', fontFamily: 'inherit' }}
                  >
                    {Object.entries(INDUSTRY_BENCHMARKS).map(([key, b]) => (
                      <option key={key} value={key}>{b.label}</option>
                    ))}
                    <option value="general">Small Businesses (General)</option>
                  </select>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px' }}>
                  {activeKey !== detectedKey ? 'Comparing against your selected industry.' : `We detected this industry from your website.`} Change it above if it doesn't look right.
                </p>

                {/* Score comparison pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: isAhead ? '#f0fdf4' : '#fffbeb', border: `1.5px solid ${isAhead ? '#bbf7d0' : '#fde68a'}`, borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center', minWidth: '70px' }}>
                    <div style={{ fontSize: '36px', fontWeight: 900, color: scoreColor(score), lineHeight: 1 }}>{score}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginTop: '2px' }}>Your score</div>
                  </div>
                  <div style={{ fontSize: '22px', color: '#d1d5db' }}>vs</div>
                  <div style={{ textAlign: 'center', minWidth: '70px' }}>
                    <div style={{ fontSize: '36px', fontWeight: 900, color: '#6b7280', lineHeight: 1 }}>{bench.avg}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, marginTop: '2px' }}>Industry avg</div>
                  </div>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: isAhead ? '#059669' : '#d97706', marginBottom: '4px' }}>
                      {isAhead ? `🎉 You're ahead of most ${bench.label}!` : `⚠️ You're below the ${bench.label} average`}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {isAhead
                        ? `Only the top 25% of ${bench.label} score ${bench.top} or higher. ${score >= bench.top ? "You're already there — excellent work! 🚀" : `You're ${bench.top - score} points away from top-quartile.`}`
                        : `Fix the items below to close the ${Math.abs(delta)}-point gap and get ahead of your competition.`}
                    </div>
                  </div>
                </div>

                {/* Category comparison bars */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Area by area breakdown</div>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                    const mine = myPct[key] ?? 0;
                    const ind  = bench.categories[key] ?? 50;
                    const gap  = mine - ind;
                    const color = gap >= 0 ? '#7c3aed' : '#ef4444';
                    return (
                      <div key={key} style={{ marginBottom: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>{label}</span>
                          <span style={{ fontSize: '11px', fontWeight: 700, color }}>
                            {gap >= 0 ? `+${gap}` : gap} pts vs avg
                          </span>
                        </div>
                        <div style={{ position: 'relative', background: '#f3f4f6', borderRadius: '99px', height: '8px' }}>
                          {/* Industry avg marker */}
                          <div style={{ position: 'absolute', top: '-3px', bottom: '-3px', width: '2px', background: '#9ca3af', left: `${ind}%`, borderRadius: '99px' }} title={`${bench.label} avg: ${ind}%`} />
                          {/* Your bar */}
                          <div style={{ background: color, borderRadius: '99px', height: '8px', width: `${mine}%`, transition: 'width 0.7s ease', opacity: 0.85 }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                          <span style={{ fontSize: '10px', color: '#9ca3af' }}>You: {mine}%</span>
                          <span style={{ fontSize: '10px', color: '#9ca3af' }}>Industry avg: {ind}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Plain English gap analysis */}
                {(behind.length > 0 || ahead.length > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: behind.length && ahead.length ? '1fr 1fr' : '1fr', gap: '12px' }}>
                    {behind.length > 0 && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', marginBottom: '8px' }}>🔴 Where you're falling behind</div>
                        {behind.map(c => (
                          <div key={c.key} style={{ fontSize: '12px', color: '#374151', marginBottom: '5px', paddingLeft: '8px', borderLeft: '2px solid #fca5a5' }}>
                            <strong>{c.label}</strong> — {Math.abs(c.gap)} points below the {bench.label} average
                          </div>
                        ))}
                      </div>
                    )}
                    {ahead.length > 0 && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', marginBottom: '8px' }}>🟢 Where you're winning</div>
                        {ahead.map(c => (
                          <div key={c.key} style={{ fontSize: '12px', color: '#374151', marginBottom: '5px', paddingLeft: '8px', borderLeft: '2px solid #86efac' }}>
                            <strong>{c.label}</strong> — {c.gap} points above average
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

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

          {/* ── SECTION DIVIDER ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '8px 0 28px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>✍️ Fix Your Content</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          {/* ── CONTENT WRITER (inline) ── */}
          {latestScan && (
            <ContentStep
              siteUrl={latestScan.url}
              result={latestScan.result}
              isPro={isPro}
              onUpgrade={onUpgrade}
              onNext={() => codeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            />
          )}

          {/* ── SECTION DIVIDER ── */}
          <div ref={codeRef} style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '8px 0 28px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>🏷️ Your Code Snippets</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          {/* ── CODE SNIPPETS (inline) ── */}
          {latestScan && (
            <CodeStep
              siteUrl={latestScan.url}
              result={latestScan.result}
              isPro={isPro}
              onUpgrade={onUpgrade}
              onNewCheck={onNewScan}
            />
          )}

          {/* ── SECTION DIVIDER ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '8px 0 28px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>📋 Scan History</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

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
