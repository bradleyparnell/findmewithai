import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Search, Plus, LogOut, TrendingUp, ExternalLink, Zap, Target,
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Trash2,
  RefreshCw, Award, ArrowRight, Menu, X,
} from 'lucide-react';

function useWindowWidth() {
  const [w, setW] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  React.useEffect(() => {
    const handler = () => setW(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return w;
}
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
  previewFree?: boolean;
  setPreviewFree?: (v: boolean) => void;
  teamOwnerEmail?: string;
  teamOwnerScan?: any;
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

export const Dashboard: React.FC<Props> = ({ user, isPro, previewFree, setPreviewFree, teamOwnerEmail, teamOwnerScan, onViewScan, onNewScan, onUpgrade, onSignOut, onAccount }) => {
  const isAdmin = user?.email === 'hello@genierocket.com';
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (isPro) return;
    fetch(`${BACKEND}/api/founding-members-count`)
      .then(r => r.json())
      .then(d => setSpotsLeft(d.spotsLeft ?? 50))
      .catch(() => setSpotsLeft(50));
  }, [isPro]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [addingCompetitor, setAddingCompetitor] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [competitorError, setCompetitorError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [rescanLoading, setRescanLoading] = useState(false);
  const [expandedFix, setExpandedFix] = useState<Set<string>>(new Set());
  const [customTerm, setCustomTerm] = useState('');
  const [customKeywords, setCustomKeywords] = useState<{keyword: string; volume: number; custom?: boolean}[]>([]);
  const [checkingVolume, setCheckingVolume] = useState(false);
  const [activeSection, setActiveSection] = useState('score');
  const [widgetStatus, setWidgetStatus] = useState<'loading' | 'installed' | 'not_installed'>('loading');
  const [showMonitoringModal, setShowMonitoringModal] = useState(false);

  // Map each check ID → which fix tool it routes to
  const FIX_CTA: Record<string, { label: string; type: 'code' | 'content' }> = {
    has_schema_org:          { label: 'Get the code →', type: 'code' },
    has_organization_schema: { label: 'Get the code →', type: 'code' },
    has_person_schema:       { label: 'Get the code →', type: 'code' },
    has_faq_schema:          { label: 'Get the code →', type: 'code' },
    has_article_schema:      { label: 'Get the code →', type: 'code' },
    has_llms_txt:            { label: 'Get the code →', type: 'code' },
    has_robots_txt:          { label: 'Get the code →', type: 'code' },
    has_sitemap:             { label: 'Get the code →', type: 'code' },
    has_og_tags:             { label: 'Get the code →', type: 'code' },
    has_meta_description:    { label: 'Write it for me →', type: 'content' },
    content_length:          { label: 'Write it for me →', type: 'content' },
    has_h1:                  { label: 'Write it for me →', type: 'content' },
    has_about_page:          { label: 'Write it for me →', type: 'content' },
    has_contact_info:        { label: 'Write it for me →', type: 'content' },
    has_social_links:        { label: 'Write it for me →', type: 'content' },
    has_title_tag:           { label: 'Write it for me →', type: 'content' },
  };

  const toggleFix = (id: string) =>
    setExpandedFix(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const scrollToFix = (type: 'code' | 'content') => {
    if (type === 'code') codeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const [industryOverride, setIndustryOverride] = useState<string | null>(null);
  const [gaugeTooltip, setGaugeTooltip] = useState<{ label: string; range: string; desc: string; color: string } | null>(null);
  const scoreRef     = useRef<HTMLDivElement>(null);
  const signalRef    = useRef<HTMLDivElement>(null);
  const fixRef       = useRef<HTMLDivElement>(null);
  const contentRef   = useRef<HTMLDivElement>(null);
  const codeRef      = useRef<HTMLDivElement>(null);
  const competitorRef = useRef<HTMLDivElement>(null);
  const historyRef   = useRef<HTMLDivElement>(null);
  const benchmarkRef = useRef<HTMLDivElement>(null);

  // Track active nav section via IntersectionObserver
  useEffect(() => {
    const sections: { id: string; ref: React.RefObject<HTMLDivElement> }[] = [
      { id: 'score',      ref: scoreRef },
      { id: 'signal',     ref: signalRef },
      { id: 'benchmark',  ref: benchmarkRef },
      { id: 'fix',        ref: fixRef },
      { id: 'content',    ref: contentRef },
      { id: 'code',       ref: codeRef },
      { id: 'competitor', ref: competitorRef },
      { id: 'history',    ref: historyRef },
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the first entry that is intersecting (top-most visible)
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = visible[0].target.getAttribute('data-section');
          if (id) setActiveSection(id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );
    sections.forEach(({ id, ref }) => {
      if (ref.current) {
        ref.current.setAttribute('data-section', id);
        observer.observe(ref.current);
      }
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const latestScan = scans[0] ?? null;

  // Previous scan for the same site (for trend arrow)
  const prevScan = React.useMemo(() => {
    if (!latestScan) return null;
    const domain = latestScan.url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
    return scans.find((s, i) => i > 0 && s.url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0] === domain) ?? null;
  }, [scans, latestScan]);

  // All unique sites (for agency multi-site view)
  const uniqueSites = React.useMemo(() => {
    const seen = new Map<string, typeof scans[0]>();
    for (const s of scans) {
      const domain = s.url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
      if (!seen.has(domain)) seen.set(domain, s);
    }
    return Array.from(seen.values());
  }, [scans]);

  const loadData = useCallback(async () => {
    setLoading(true);
    // If viewing as a team member, use the owner's scan directly
    if (teamOwnerScan) {
      setScans([teamOwnerScan]);
      setLoading(false);
      return;
    }
    const [scansRes, compRes] = await Promise.all([
      supabase.from('scans').select('*').order('created_at', { ascending: false }),
      supabase.from('competitors').select('*').order('created_at', { ascending: false }),
    ]);
    setScans((scansRes.data as Scan[]) ?? []);
    setCompetitors((compRes.data as Competitor[]) ?? []);
    setLoading(false);
  }, [teamOwnerScan]);

  useEffect(() => { loadData(); }, [loadData]);

  // Check widget installation status whenever the latest scan URL changes
  useEffect(() => {
    const url = scans[0]?.url;
    if (!url) { setWidgetStatus('not_installed'); return; }
    setWidgetStatus('loading');
    fetch(`${BACKEND}/api/check-widget?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then(d => setWidgetStatus(d.installed ? 'installed' : 'not_installed'))
      .catch(() => setWidgetStatus('not_installed'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scans[0]?.url]);

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

  const NAV_ITEMS = [
    { id: 'score',      label: 'Score',       icon: '📊', ref: scoreRef },
    { id: 'signal',     label: 'AI Market',   icon: '⚡', ref: signalRef },
    { id: 'benchmark',  label: 'Benchmarks',  icon: '🏆', ref: benchmarkRef },
    { id: 'fix',        label: 'What to Fix', icon: '🔴', ref: fixRef },
    { id: 'content',    label: 'Content',     icon: '✍️',  ref: contentRef },
    { id: 'code',       label: 'Code',        icon: '💻', ref: codeRef },
    { id: 'competitor', label: 'Competitors', icon: '🏁', ref: competitorRef },
    { id: 'history',    label: 'History',     icon: '📋', ref: historyRef },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f3f8' }}>

      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
        />
      )}

      {/* ── LEFT SIDEBAR ── */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, height: '100vh',
        width: isMobile ? '280px' : '240px',
        background: '#1e1b4b', display: 'flex', flexDirection: 'column',
        zIndex: 100, overflowY: 'auto',
        transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.25s ease',
        boxShadow: isMobile && sidebarOpen ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
      }}>

        {/* Brand */}
        <div style={{ padding: '22px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <div style={{ width: '28px', height: '28px', background: '#7c3aed', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Search size={13} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '14px', color: '#e2e8f0', letterSpacing: '-0.01em', flex: 1 }}>findmewith.ai</span>
            {isMobile && (
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                <X size={18} />
              </button>
            )}
          </div>

          {/* Site card */}
          {latestScan ? (
            <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 13px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Current Site</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', wordBreak: 'break-all', lineHeight: 1.3 }}>
                {latestScan.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>
                Score: <span style={{ color: '#f59e0b', fontWeight: 800 }}>{latestScan.score}/100</span>
                {isPro && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#22c55e', fontWeight: 700 }}>● MONITORING</span>}
              </div>
              {widgetStatus !== 'loading' && (
                <button
                  onClick={() => codeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  style={{ marginTop: '7px', display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%' }}
                >
                  <div style={{
                    width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                    background: widgetStatus === 'installed' ? '#22c55e' : '#475569',
                    boxShadow: widgetStatus === 'installed' ? '0 0 0 2px rgba(34,197,94,0.25)' : 'none',
                    animation: widgetStatus === 'installed' ? 'pulse 2s infinite' : 'none',
                  }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: widgetStatus === 'installed' ? '#22c55e' : '#64748b' }}>
                    {widgetStatus === 'installed' ? 'Widget broadcasting' : 'Widget not detected'}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: '#64748b' }}>No scan yet</div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV_ITEMS.map(({ id, label, icon, ref }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveSection(id);
                  if (isMobile) setSidebarOpen(false);
                  setTimeout(() => {
                    if (ref?.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    else window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, isMobile ? 280 : 0);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '9px 12px', marginBottom: '2px',
                  background: isActive ? 'rgba(245,158,11,0.18)' : 'transparent',
                  border: isActive ? '1px solid rgba(245,158,11,0.35)' : '1px solid transparent',
                  borderRadius: '9px',
                  color: isActive ? '#fbbf24' : '#94a3b8',
                  fontSize: '14px', fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0'; } }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; } }}
              >
                <span style={{ fontSize: '15px', lineHeight: 1 }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>

        {/* Admin link — only for hello@genierocket.com */}
        {user.email === 'hello@genierocket.com' && (
          <div style={{ padding: '0 10px 8px' }}>
            <button
              onClick={() => window.location.href = '/admin'}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 12px', background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '9px', color: '#a78bfa', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: '15px', lineHeight: 1 }}>🛡️</span>
              Admin
            </button>
          </div>
        )}

        {/* Founding Member sidebar card */}
        {!isPro && spotsLeft !== null && (
          <div style={{ margin: '0 10px 10px', background: 'linear-gradient(135deg, #1c0533 0%, #4c1d95 100%)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '12px', padding: '14px', cursor: 'pointer' }} onClick={onUpgrade}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px' }}>⚡</span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.4px' }}>FOUNDING MEMBER</span>
            </div>
            <p style={{ color: 'white', fontSize: '12px', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.4 }}>Lock in Pro forever — $249 one time</p>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{50 - spotsLeft} of 50 claimed</span>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#fbbf24' }}>{spotsLeft} left</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '99px', height: '5px' }}>
                <div style={{ width: `${Math.min(100, Math.round(((50 - spotsLeft) / 50) * 100))}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: '99px', transition: 'width 0.8s ease' }} />
              </div>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.9)', borderRadius: '7px', padding: '7px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: 'white' }}>
              Claim your spot →
            </div>
          </div>
        )}

        {/* New Scan */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={onNewScan}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', width: '100%', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '9px', padding: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
          >
            <Plus size={14} /> New Scan
          </button>
        </div>

        {/* My Account */}
        <div style={{ padding: '0 10px 8px' }}>
          <button
            onClick={onAccount}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', color: '#94a3b8', fontSize: '14px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
          >
            <span style={{ fontSize: '15px', lineHeight: 1 }}>⚙️</span>
            My Account
            {isPro && <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700, color: '#a78bfa', background: 'rgba(124,58,237,0.2)', borderRadius: '5px', padding: '2px 7px' }}>PRO</span>}
          </button>
        </div>

        {/* Admin: preview as free user toggle */}
        {isAdmin && setPreviewFree && (
          <div style={{ padding: '8px 16px' }}>
            <button
              onClick={() => setPreviewFree(!previewFree)}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '8px',
                background: previewFree ? '#fef3c7' : 'rgba(255,255,255,0.06)',
                border: `1.5px solid ${previewFree ? '#f59e0b' : 'rgba(255,255,255,0.12)'}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 600,
                color: previewFree ? '#92400e' : '#94a3b8',
              }}
            >
              <span>{previewFree ? '👁️' : '🔒'}</span>
              {previewFree ? 'Exit free preview' : 'Preview as free user'}
            </button>
          </div>
        )}

        {/* User / sign out */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </div>
          <button onClick={onSignOut} title="Sign out" style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div style={{ marginLeft: isMobile ? 0 : '240px', flex: 1, padding: isMobile ? '16px 16px 80px' : '40px 48px 100px', minWidth: 0, overflowX: 'hidden' }}>
        {/* Team member read-only banner */}
        {teamOwnerEmail && (
          <div style={{ background: '#ede9fe', border: '1.5px solid #c4b5fd', borderRadius: '12px', padding: '12px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>👥</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#5b21b6' }}>Viewing shared results</span>
              <span style={{ fontSize: '13px', color: '#7c3aed', marginLeft: '8px' }}>from {teamOwnerEmail}</span>
            </div>
            <span style={{ fontSize: '12px', color: '#a78bfa', fontWeight: 500 }}>Read-only</span>
          </div>
        )}

        {/* Mobile top bar */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: '#1e1b4b', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}
            >
              <Menu size={18} />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Visibility Dashboard</div>
              {latestScan && (
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {latestScan.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Page header */}
        {!isMobile && latestScan && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>AI Visibility Dashboard</div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>
              {latestScan.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </h1>
          </div>
        )}

        {/* Site Monitoring banner — active for Pro, locked for free */}
        {isPro ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '1.5px solid #c4b5fd', borderRadius: '14px', padding: '13px 18px', marginBottom: '28px' }}>
            <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,0.2)', flexShrink: 0, animation: 'pulse 2s infinite' }} />
            <div>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#5b21b6' }}>🛰️ Site Monitoring Active</span>
              <span style={{ fontSize: '13px', color: '#7c3aed', marginLeft: '10px' }}>Your site is re-scanned weekly — we'll email you if your score changes.</span>
            </div>
          </div>
        ) : (
          <>
            <div
              onClick={() => setShowMonitoringModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '13px 18px', marginBottom: '28px', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#c4b5fd')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
            >
              {/* Toggle off */}
              <div style={{ width: '34px', height: '20px', borderRadius: '10px', background: '#d1d5db', flexShrink: 0, position: 'relative' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
              <div>
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#9ca3af' }}>🛰️ Site Monitoring</span>
                <span style={{ fontSize: '13px', color: '#9ca3af', marginLeft: '10px' }}>Weekly re-scan — turn on to get notified when your score changes.</span>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: '#7c3aed', background: '#ede9fe', borderRadius: '6px', padding: '3px 8px', flexShrink: 0 }}>PRO</div>
            </div>

            {/* Monitoring upsell modal */}
            {showMonitoringModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
                onClick={() => setShowMonitoringModal(false)}>
                <div style={{ background: 'white', borderRadius: '20px', padding: '36px 32px', maxWidth: '420px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.18)' }}
                  onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>🛰️</div>
                  <h2 style={{ margin: '0 0 10px', fontSize: '22px', fontWeight: 900, color: '#111827' }}>Stay on the radar</h2>
                  <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#6b7280', lineHeight: '1.6' }}>
                    With <strong>Pro</strong>, we re-scan your site every week and email you if your AI visibility score changes — so you always know where you stand.
                  </p>
                  <ul style={{ margin: '0 0 24px', padding: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {['Weekly automated re-scans', 'Score change alerts by email', 'Trend history so you can see progress', 'All Pro features unlocked'].map(item => (
                      <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#374151' }}>
                        <span style={{ color: '#7c3aed', fontWeight: 700 }}>✓</span> {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => { setShowMonitoringModal(false); onUpgrade(); }}
                    style={{ width: '100%', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', marginBottom: '10px' }}
                  >
                    Upgrade to Pro — $29/mo →
                  </button>
                  <button
                    onClick={() => setShowMonitoringModal(false)}
                    style={{ width: '100%', background: 'transparent', color: '#9ca3af', border: 'none', fontSize: '13px', cursor: 'pointer', padding: '6px' }}
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            )}
          </>
        )}

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
        <div style={{ maxWidth: '1100px' }}>
          {/* ── OVERVIEW: score + category bars ── */}
          <div ref={scoreRef} style={{ display: 'grid', gridTemplateColumns: '300px minmax(0,1fr)', gap: '24px', marginBottom: '32px' }}>

            {/* Score circle */}
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '24px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>AI Visibility Score</div>

              {/* ── Semicircle gauge ── */}
              {(() => {
                const score = latestScan.score;
                const cx = 110, cy = 115, r = 85;
                // Angle: score 0 → 180°, score 100 → 360° (SVG: 0=right,90=down,180=left,270=up)
                const endAngle = 180 + (score / 100) * 180;
                const endRad   = endAngle * Math.PI / 180;
                const ex = (cx + r * Math.cos(endRad)).toFixed(1);
                const ey = (cy + r * Math.sin(endRad)).toFixed(1);
                // Needle
                const nRad = endRad;
                const nx = (cx + 68 * Math.cos(nRad)).toFixed(1);
                const ny = (cy + 68 * Math.sin(nRad)).toFixed(1);
                const color = scoreColor(score);
                // Zone arc end-points (pre-computed)
                // Red end 252°: cos=-0.309 sin=-0.951
                const rx2 = (cx + r * -0.309).toFixed(1), ry2 = (cy + r * -0.951).toFixed(1);
                // Yellow end 306°: cos=0.588 sin=-0.809
                const yx2 = (cx + r *  0.588).toFixed(1), yy2 = (cy + r * -0.809).toFixed(1);
                const zoneHover = (label: string, range: string, desc: string, col: string) => ({
                  onMouseEnter: () => setGaugeTooltip({ label, range, desc, color: col }),
                  onMouseLeave: () => setGaugeTooltip(null),
                  style: { cursor: 'default' } as React.CSSProperties,
                });
                return (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    {/* Tooltip */}
                    {gaugeTooltip && (
                      <div style={{ position: 'absolute', top: '-72px', left: '50%', transform: 'translateX(-50%)', background: '#1e1b4b', color: 'white', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', textAlign: 'center', lineHeight: '1.5' }}>
                        <div style={{ fontWeight: 800, color: gaugeTooltip.color, fontSize: '13px' }}>{gaugeTooltip.label} · {gaugeTooltip.range}</div>
                        <div style={{ color: '#c4b5fd', marginTop: '2px' }}>{gaugeTooltip.desc}</div>
                        <div style={{ position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1e1b4b' }} />
                      </div>
                    )}
                    <svg width="220" height="120" viewBox="0 0 220 120" style={{ overflow: 'visible', marginBottom: '4px' }}>
                      {/* Zone backgrounds — hoverable */}
                      <path d={`M 25 115 A ${r} ${r} 0 0 1 ${rx2} ${ry2}`} fill="none" stroke="#fecaca" strokeWidth="14" strokeLinecap="butt"
                        {...zoneHover('🔴 NOT FOUND', '0 – 40', 'AI tools rarely mention you', '#ef4444')} />
                      <path d={`M ${rx2} ${ry2} A ${r} ${r} 0 0 1 ${yx2} ${yy2}`} fill="none" stroke="#fde68a" strokeWidth="14" strokeLinecap="butt"
                        {...zoneHover('🟡 GETTING FOUND', '41 – 70', 'AI sometimes mentions you, inconsistently', '#d97706')} />
                      <path d={`M ${yx2} ${yy2} A ${r} ${r} 0 0 1 195 115`} fill="none" stroke="#bbf7d0" strokeWidth="14" strokeLinecap="butt"
                        {...zoneHover('🟢 FOUND', '71 – 100', 'AI actively recommends you', '#16a34a')} />
                      {/* Progress arc */}
                      {score > 0 && (
                        <path d={`M 25 115 A ${r} ${r} 0 0 1 ${ex} ${ey}`} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
                      )}
                      {/* Needle */}
                      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="white" strokeWidth="3" strokeLinecap="round" />
                      <circle cx={cx} cy={cy} r="7" fill={color} />
                      {/* Score inside arc */}
                      <text x={cx} y="82" textAnchor="middle" fontSize="44" fontWeight="900" fill={color}>{score}</text>
                      <text x={cx} y="100" textAnchor="middle" fontSize="13" fontWeight="600" fill="#9ca3af">/ 100</text>
                      {/* Corner labels */}
                      <text x="16" y="128" textAnchor="middle" fontSize="11" fill="#d1d5db">0</text>
                      <text x="204" y="128" textAnchor="middle" fontSize="11" fill="#d1d5db">100</text>
                    </svg>
                  </div>
                );
              })()}

              <span style={{ fontSize: '18px', fontWeight: 800, color: scoreColor(latestScan.score) }}>{scoreLabel(latestScan.score)}</span>
              {prevScan && (() => {
                const delta = latestScan.score - prevScan.score;
                if (delta === 0) return null;
                const up = delta > 0;
                return (
                  <span style={{ fontSize: '13px', fontWeight: 700, color: up ? '#059669' : '#dc2626', background: up ? '#f0fdf4' : '#fef2f2', borderRadius: '99px', padding: '3px 10px', marginTop: '2px' }}>
                    {up ? '↑' : '↓'}{Math.abs(delta)} pts since last scan
                  </span>
                );
              })()}
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
          {latestScan && (() => {
            const amd = (latestScan.result?.ai_market_data ?? null) as AiMarketData | null;
            const isGrowing   = amd?.trend_direction === 'growing';
            const isDeclining = amd?.trend_direction === 'declining';
            const trendIcon  = isGrowing ? '📈' : isDeclining ? '📉' : '📊';
            const trendColor = isGrowing ? '#059669' : isDeclining ? '#ef4444' : '#6b7280';
            const trendBg    = isGrowing ? '#f0fdf4' : isDeclining ? '#fef2f2' : '#f9fafb';
            const trendText  = isGrowing
              ? `Growing +${amd?.trend_pct}% — the window to get found is right now`
              : isDeclining
              ? `Down ${amd?.trend_pct}% recently — act before competitors pull further ahead`
              : 'Steady volume — consistent improvements keep you visible';
            const score = latestScan.score;
            const isVisible = score >= 70;

            return (
              <div ref={signalRef} style={{ background: 'white', borderRadius: '24px', padding: '48px 52px', marginBottom: '24px', border: '1px solid #e5e7eb', borderLeft: '6px solid #7c3aed', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '24px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: '10px' }}>
                        ⚡ AI Market Activity
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: 900, color: '#111827', marginBottom: '8px', lineHeight: 1.15 }}>
                        People are asking AI about businesses like yours
                      </div>
                      <div style={{ fontSize: '17px', color: '#6b7280' }}>
                        Every month, in your market
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                        {[
                          { name: 'ChatGPT',    color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
                          { name: 'Perplexity', color: '#0891b2', bg: '#ecfeff', border: '#67e8f9' },
                          { name: 'Gemini',     color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
                          { name: 'Claude',     color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
                        ].map(({ name, color, bg, border }) => (
                          <span key={name} style={{ fontSize: '11px', fontWeight: 700, color, background: bg, border: `1px solid ${border}`, borderRadius: '6px', padding: '3px 9px', letterSpacing: '0.01em' }}>
                            {name}
                          </span>
                        ))}
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>+ more</span>
                      </div>
                    </div>
                    <div style={{ background: '#fdf4ff', border: '2px solid #e9d5ff', borderRadius: '20px', padding: '24px 36px', textAlign: 'center', minWidth: '180px' }}>
                      <div style={{ fontSize: (amd || customKeywords.length > 0) ? '72px' : '22px', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>
                        {(() => {
                          const base = amd?.total_volume ?? 0;
                          const custom = customKeywords.reduce((s, k) => s + k.volume, 0);
                          const total = base + custom;
                          if (!amd && custom === 0) return 'low volume';
                          return total.toLocaleString();
                        })()}
                      </div>
                      <div style={{ fontSize: '15px', color: '#7c3aed', fontWeight: 700, marginTop: '8px' }}>AI searches / mo</div>
                    </div>
                  </div>

                  {/* Top keywords */}
                  {(() => {
                    const checkVolume = async () => {
                      const term = customTerm.trim();
                      if (!term) return;
                      setCheckingVolume(true);
                      try {
                        const res = await fetch(`${BACKEND}/api/keyword-volume`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ keywords: [term] }),
                        });
                        const data = await res.json();
                        const found = data.keywords?.[0];
                        const entry = { keyword: found?.keyword || term, volume: found?.volume || 0, custom: true };
                        setCustomKeywords(prev => [entry, ...prev.filter(k => k.keyword !== entry.keyword)]);
                        setCustomTerm('');
                      } catch { /* silent */ } finally {
                        setCheckingVolume(false);
                      }
                    };

                    const allKeywords = [...(amd?.keywords ?? []), ...customKeywords];

                    return (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                          What people are searching
                        </div>
                        {allKeywords.length === 0 && (
                          <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '12px', color: '#6b7280', fontSize: '15px', textAlign: 'center' }}>
                            ⏳ Scan your site to see which searches you could be found in. Use the "Check volume" box below to look up any term right now.
                          </div>
                        )}
                        {allKeywords.map((kw, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < allKeywords.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '17px', fontWeight: 600, color: '#111827' }}>"{kw.keyword}"</span>
                              {(kw as any).custom && (
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '6px', padding: '2px 8px' }}>YOUR TERM</span>
                              )}
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: kw.volume > 0 ? '#d97706' : '#9ca3af', background: kw.volume > 0 ? '#fffbeb' : '#f9fafb', border: `1.5px solid ${kw.volume > 0 ? '#fde68a' : '#e5e7eb'}`, borderRadius: '10px', padding: '7px 18px', flexShrink: 0 }}>
                              {kw.volume > 0 ? `${kw.volume.toLocaleString()}/mo` : 'low volume'}
                            </span>
                          </div>
                        ))}

                        {/* Custom keyword input */}
                        <div style={{ marginTop: '20px', padding: '18px 20px', background: '#f9fafb', border: '1.5px dashed #d1d5db', borderRadius: '14px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>
                            🔍 Track your own search terms
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                              type="text"
                              value={customTerm}
                              onChange={e => setCustomTerm(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && checkVolume()}
                              placeholder='e.g. "trail races Texas" or "obstacle course near me"'
                              style={{ flex: 1, padding: '11px 16px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '14px', color: '#111827', outline: 'none', background: 'white' }}
                              disabled={checkingVolume}
                            />
                            <button
                              onClick={checkVolume}
                              disabled={checkingVolume || !customTerm.trim()}
                              style={{ padding: '11px 22px', background: checkingVolume ? '#e5e7eb' : '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: checkingVolume ? 'default' : 'pointer', whiteSpace: 'nowrap' }}
                            >
                              {checkingVolume ? 'Checking…' : 'Check volume →'}
                            </button>
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                            Type a phrase your customers might ask an AI assistant, then hit "Check volume" to see monthly search data.
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Trend */}
                  {amd && (
                    <div style={{ background: trendBg, borderRadius: '12px', padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>{trendIcon}</span>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: trendColor }}>{trendText}</span>
                    </div>
                  )}

                  {/* Platform data attribution */}
                  <div style={{ fontSize: '11px', color: '#d1d5db', textAlign: 'right', marginBottom: '12px' }}>
                    Search volume data powered by <strong style={{ color: '#9ca3af' }}>DataForSEO</strong>
                  </div>

                  {/* Visibility hook */}
                  {isVisible ? (
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '24px' }}>✅</span>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#15803d' }}>You're positioned to appear in these searches</div>
                        <div style={{ fontSize: '14px', color: '#16a34a', marginTop: '4px' }}>Keep your score above 70 and re-scan monthly to stay visible.</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '24px' }}>⚡</span>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>
                          {(() => {
                            const custom = customKeywords.reduce((s, k) => s + k.volume, 0);
                            const base = amd?.total_volume ?? 0;
                            const total = base + custom;
                            const n = (!amd && custom === 0) ? null : total;
                            return n ? `You're currently missing these ${n.toLocaleString()} AI searches per month` : "You're not showing up in AI searches yet";
                          })()}
                        </div>
                        <div style={{ fontSize: '14px', color: '#ef4444', marginTop: '4px' }}>
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
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '24px', padding: '40px 48px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={22} style={{ color: '#7c3aed' }} /> Your Progress Over Time
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
              <div style={{ textAlign: 'center', padding: '32px', background: '#f9fafb', borderRadius: '16px', fontSize: '16px', color: '#6b7280' }}>
                📈 Hit <strong>Re-scan now</strong> above to start tracking your progress here — your score history will appear in this chart.
              </div>
            ) : (
              <>
                <div style={!isPro ? { filter: 'blur(5px)', pointerEvents: 'none' } : {}}>
                  <ResponsiveContainer width="100%" height={220}>
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
              <div ref={benchmarkRef} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '24px', padding: '40px 48px', marginBottom: '24px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Award size={22} style={{ color: '#7c3aed' }} /> How You Compare to Your Industry
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
                <p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 24px' }}>
                  {activeKey !== detectedKey ? 'Comparing against your selected industry.' : `We detected this industry from your website.`} Change it above if it doesn't look right.
                </p>

                {/* Score comparison pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', background: isAhead ? '#f0fdf4' : '#fffbeb', border: `1.5px solid ${isAhead ? '#bbf7d0' : '#fde68a'}`, borderRadius: '20px', padding: '28px 32px', marginBottom: '28px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center', minWidth: '90px' }}>
                    <div style={{ fontSize: '56px', fontWeight: 900, color: scoreColor(score), lineHeight: 1 }}>{score}</div>
                    <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 600, marginTop: '4px' }}>Your score</div>
                  </div>
                  <div style={{ fontSize: '28px', color: '#d1d5db', fontWeight: 300 }}>vs</div>
                  <div style={{ textAlign: 'center', minWidth: '90px' }}>
                    <div style={{ fontSize: '56px', fontWeight: 900, color: '#6b7280', lineHeight: 1 }}>{bench.avg}</div>
                    <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 600, marginTop: '4px' }}>Industry avg</div>
                  </div>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: isAhead ? '#059669' : '#d97706', marginBottom: '8px' }}>
                      {isAhead ? `🎉 You're ahead of most ${bench.label}!` : `⚠️ You're below the ${bench.label} average`}
                    </div>
                    <div style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.6 }}>
                      {isAhead
                        ? `Only the top 25% of ${bench.label} score ${bench.top} or higher. ${score >= bench.top ? "You're already there — excellent work! 🚀" : `You're ${bench.top - score} points away from top-quartile.`}`
                        : `Fix the items below to close the ${Math.abs(delta)}-point gap and get ahead of your competition.`}
                    </div>
                  </div>
                </div>

                {/* Category comparison bars */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#374151', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Area by area breakdown</div>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                    const mine = myPct[key] ?? 0;
                    const ind  = bench.categories[key] ?? 50;
                    const gap  = mine - ind;
                    const color = gap >= 0 ? '#7c3aed' : '#ef4444';
                    return (
                      <div key={key} style={{ marginBottom: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '16px', color: '#374151', fontWeight: 600 }}>{label}</span>
                          <span style={{ fontSize: '14px', fontWeight: 700, color }}>
                            {gap >= 0 ? `+${gap}` : gap} pts vs avg
                          </span>
                        </div>
                        <div style={{ position: 'relative', background: '#f3f4f6', borderRadius: '99px', height: '12px' }}>
                          <div style={{ position: 'absolute', top: '-4px', bottom: '-4px', width: '3px', background: '#9ca3af', left: `${ind}%`, borderRadius: '99px' }} title={`${bench.label} avg: ${ind}%`} />
                          <div style={{ background: color, borderRadius: '99px', height: '12px', width: `${mine}%`, transition: 'width 0.7s ease', opacity: 0.85 }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                          <span style={{ fontSize: '13px', color: '#9ca3af' }}>You: {mine}%</span>
                          <span style={{ fontSize: '13px', color: '#9ca3af' }}>Industry avg: {ind}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Plain English gap analysis */}
                {(behind.length > 0 || ahead.length > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: behind.length && ahead.length ? '1fr 1fr' : '1fr', gap: '16px' }}>
                    {behind.length > 0 && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '16px', padding: '20px 24px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626', marginBottom: '12px' }}>🔴 Where you're falling behind</div>
                        {behind.map(c => (
                          <div key={c.key} style={{ fontSize: '15px', color: '#374151', marginBottom: '8px', paddingLeft: '12px', borderLeft: '3px solid #fca5a5' }}>
                            <strong>{c.label}</strong> — {Math.abs(c.gap)} points below the {bench.label} average
                          </div>
                        ))}
                      </div>
                    )}
                    {ahead.length > 0 && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '20px 24px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#16a34a', marginBottom: '12px' }}>🟢 Where you're winning</div>
                        {ahead.map(c => (
                          <div key={c.key} style={{ fontSize: '15px', color: '#374151', marginBottom: '8px', paddingLeft: '12px', borderLeft: '3px solid #86efac' }}>
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
          <div ref={competitorRef} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '24px', padding: '40px 48px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Target size={22} style={{ color: '#7c3aed' }} /> How Do You Compare?
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
            <p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 20px', lineHeight: 1.6 }}>Add a competitor's website and we'll show you exactly what they're doing that you're not — and where you're already winning.</p>

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
                  <div style={{ background: '#f5f3ff', border: '2px solid #7c3aed', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Your Site</div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {latestScan.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </div>
                    <div style={{ fontSize: '44px', fontWeight: 900, color: scoreColor(latestScan.score), lineHeight: 1 }}>{latestScan.score}</div>
                    <div style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>/ 100</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: scoreColor(latestScan.score), marginTop: '6px' }}>{scoreLabel(latestScan.score)}</div>
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
                        <div style={{ fontSize: '13px', fontWeight: 700, color: COMPETITOR_COLORS[i % COMPETITOR_COLORS.length], textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Competitor</div>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {comp.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </div>
                        <div style={{ fontSize: '44px', fontWeight: 900, color: scoreColor(comp.score), lineHeight: 1 }}>{comp.score}</div>
                        <div style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>/ 100</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '6px', color: diff > 0 ? '#16a34a' : diff < 0 ? '#dc2626' : '#6b7280' }}>
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
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                            🔴 They have this — you don't ({gaps.length})
                          </div>
                          {gaps.map(id => (
                            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', marginBottom: '8px' }}>
                              <ArrowRight size={15} style={{ color: '#dc2626', flexShrink: 0 }} />
                              <span style={{ fontSize: '15px', color: '#111827', fontWeight: 500 }}>
                                {FINDING_PLAIN_LABELS[id] ?? id}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {advantages.length > 0 && (
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                            🟢 You have this — they don't ({advantages.length})
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {advantages.map(id => (
                              <span key={id} style={{ fontSize: '14px', fontWeight: 600, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '99px', padding: '6px 16px' }}>
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
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#374151', marginBottom: '16px', marginTop: '8px' }}>
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
            <div ref={fixRef} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '24px', padding: '40px 48px', marginBottom: '24px' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={22} style={{ color: '#d97706' }} /> What to Fix Next
              </div>

              {failItems.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fix These First</span>
                  </div>
                  {failItems.map(item => {
                    const cta = FIX_CTA[item.id];
                    return (
                      <div key={item.id} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '18px', padding: '20px 24px' }}>
                        <div style={{ width: '11px', height: '11px', background: '#ef4444', borderRadius: '50%', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '17px', fontWeight: 700, color: '#111827' }}>{FINDING_PLAIN_LABELS[item.id] || item.label}</div>
                          {item.suggestion && <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px', lineHeight: 1.55 }}>{item.suggestion}</div>}
                        </div>
                        {cta && (
                          <button
                            onClick={() => scrollToFix(cta.type)}
                            style={{ flexShrink: 0, background: cta.type === 'content' ? '#f59e0b' : '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', padding: '11px 22px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                          >
                            {cta.label}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {warnItems.length > 0 && (
                <div style={{ marginBottom: passItems.length > 0 ? '24px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <AlertTriangle size={16} style={{ color: '#d97706' }} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Worth Improving</span>
                  </div>
                  {warnItems.map(item => {
                    const cta = FIX_CTA[item.id];
                    return (
                      <div key={item.id} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '18px', padding: '20px 24px' }}>
                        <div style={{ width: '11px', height: '11px', background: '#d97706', borderRadius: '50%', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '17px', fontWeight: 700, color: '#111827' }}>{FINDING_PLAIN_LABELS[item.id] || item.label}</div>
                          {item.suggestion && <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px', lineHeight: 1.55 }}>{item.suggestion}</div>}
                        </div>
                        {cta && (
                          <button
                            onClick={() => scrollToFix(cta.type)}
                            style={{ flexShrink: 0, background: cta.type === 'content' ? '#f59e0b' : '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', padding: '11px 22px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                          >
                            {cta.label}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {passItems.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <CheckCircle size={16} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Already Looking Good</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {passItems.map(item => (
                      <span key={item.id} style={{ fontSize: '14px', fontWeight: 600, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '99px', padding: '6px 16px' }}>
                        ✓ {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SECTION DIVIDER: CONTENT ── */}
          <div ref={contentRef} style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0 32px' }}>
            <div style={{ flex: 1, height: '2px', background: '#f3f4f6' }} />
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>✍️ Fix Your Content</span>
            <div style={{ flex: 1, height: '2px', background: '#f3f4f6' }} />
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

          {/* ── SECTION DIVIDER: CODE ── */}
          <div ref={codeRef} style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0 32px' }}>
            <div style={{ flex: 1, height: '2px', background: '#f3f4f6' }} />
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>🏷️ Your Code Snippets</span>
            <div style={{ flex: 1, height: '2px', background: '#f3f4f6' }} />
          </div>

          {/* ── CODE SNIPPETS (inline) ── */}
          {latestScan && (
            <CodeStep
              siteUrl={latestScan.url}
              result={latestScan.result}
              scanId={latestScan.id}
              isPro={isPro}
              onUpgrade={onUpgrade}
              onNewCheck={onNewScan}
            />
          )}

          {/* ── SECTION DIVIDER: HISTORY ── */}
          <div ref={historyRef} style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0 32px' }}>
            <div style={{ flex: 1, height: '2px', background: '#f3f4f6' }} />
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>📋 Scan History</span>
            <div style={{ flex: 1, height: '2px', background: '#f3f4f6' }} />
          </div>

          {/* ── MY SITES (shown when user has scanned 2+ unique domains) ── */}
          {uniqueSites.length > 1 && (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '24px', padding: '40px 48px', marginBottom: '24px' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Target size={22} style={{ color: '#7c3aed' }} />
                My Sites
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#9ca3af', background: '#f3f4f6', borderRadius: '99px', padding: '2px 12px' }}>{uniqueSites.length}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                {uniqueSites.map(site => {
                  const domain = site.url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
                  const color = scoreColor(site.score);
                  const isActive = latestScan?.url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0] === domain;
                  return (
                    <div
                      key={site.id}
                      onClick={() => onViewScan(site)}
                      style={{ border: isActive ? `2px solid #7c3aed` : '1.5px solid #f3f4f6', borderRadius: '18px', padding: '20px', cursor: 'pointer', background: isActive ? '#faf5ff' : 'white', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#c4b5fd'; e.currentTarget.style.background = '#faf5ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = isActive ? '#7c3aed' : '#f3f4f6'; e.currentTarget.style.background = isActive ? '#faf5ff' : 'white'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: `${color}18`, border: `3px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '15px', fontWeight: 900, color }}>{site.score}</span>
                        </div>
                        {isActive && <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', background: '#ede9fe', borderRadius: '99px', padding: '2px 8px' }}>ACTIVE</span>}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{domain}</div>
                      <div style={{ fontSize: '12px', color: color, fontWeight: 600, marginTop: '4px' }}>{scoreLabel(site.score)}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{formatDate(site.created_at)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SCAN HISTORY ── */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '24px', padding: '40px 48px', marginBottom: '24px' }}>
            <button
              onClick={() => setShowHistory(h => !h)}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0 }}
            >
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Award size={22} style={{ color: '#7c3aed' }} />
                Scan History
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#9ca3af', background: '#f3f4f6', borderRadius: '99px', padding: '2px 12px' }}>{scans.length}</span>
              </div>
              {showHistory ? <ChevronUp size={20} style={{ color: '#9ca3af' }} /> : <ChevronDown size={20} style={{ color: '#9ca3af' }} />}
            </button>

            {showHistory && (
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {scans.map(scan => {
                  const domain = scan.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                  const color = scoreColor(scan.score);
                  return (
                    <div
                      key={scan.id}
                      onClick={() => onViewScan(scan)}
                      style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '16px 20px', border: '1.5px solid #f3f4f6', borderRadius: '16px', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#ddd6fe')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#f3f4f6')}
                    >
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `${color}18`, border: `3px solid ${color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '16px', fontWeight: 900, color, lineHeight: 1 }}>{scan.score}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '17px', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{domain}</div>
                        <div style={{ fontSize: '14px', color: '#9ca3af', marginTop: '3px' }}>{formatDate(scan.created_at)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color, background: `${color}14`, padding: '4px 14px', borderRadius: '99px' }}>{scoreLabel(scan.score)}</span>
                        <ExternalLink size={16} style={{ color: '#c4b5fd' }} />
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
        </div>
      )}
      </div>
    </div>
  );
};
