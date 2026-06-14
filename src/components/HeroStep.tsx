import React, { useState, useEffect } from 'react';
import { Search, FileText, Code2, Sparkles, TrendingUp } from 'lucide-react';
import { analyzeWebsite } from '../utils/analyzer';
import type { AnalysisResult } from '../types';

interface Props {
  onAnalyzed: (result: AnalysisResult, url: string) => void;
}

const LOADING_MESSAGES = [
  'Connecting to your website…',
  'Reading your content through AI eyes…',
  'Checking what ChatGPT & Google AI can see…',
  'Calculating your visibility score…',
  'Almost there — putting it all together…',
];

export const HeroStep: React.FC<Props> = ({ onAnalyzed }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsg(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  const handleCheck = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setError('');
    setLoading(true);
    setLoadingMsg(0);
    try {
      const cleanUrl = trimmed.startsWith('http') ? trimmed : 'https://' + trimmed;
      const result = await analyzeWebsite(cleanUrl);
      onAnalyzed(result, cleanUrl);
    } catch {
      setError("We couldn't reach that website. Double-check the address and try again.");
      setLoading(false);
    }
  };

  const steps = [
    {
      icon: <Search size={20} />,
      num: '1',
      title: 'See Where You Stand',
      desc: 'Get a free score showing exactly what AI knows about your business right now — no jargon, just plain English.',
    },
    {
      icon: <FileText size={20} />,
      num: '2',
      title: 'Learn What to Fix',
      desc: 'We show you the specific gaps holding you back and give you the exact words to add to your website.',
    },
    {
      icon: <Code2 size={20} />,
      num: '3',
      title: 'Get Found by AI',
      desc: 'One simple addition to your site tells AI tools who you are, what you do, and why to recommend you.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(150deg, #ede9fe 0%, #ffffff 55%, #fef3c7 100%)' }}>
      {/* Logo bar */}
      <div style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '34px', height: '34px', background: '#7c3aed', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Search size={17} color="white" />
        </div>
        <span style={{ fontWeight: 800, fontSize: '18px', color: '#7c3aed', letterSpacing: '-0.3px' }}>findmewith.ai</span>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 28px 80px', textAlign: 'center' }}>

        {/* Urgency badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#d97706', borderRadius: '100px', padding: '6px 16px', fontSize: '13px', fontWeight: 600, marginBottom: '28px', border: '1px solid #fde68a' }}>
          <TrendingUp size={13} />
          AI search is growing 400% per year — most businesses are invisible
        </div>

        {/* Main headline */}
        <h1 style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1.15, color: '#111827', marginBottom: '20px', letterSpacing: '-0.5px' }}>
          Your customers are asking AI<br />
          who to hire.{' '}
          <span style={{ color: '#7c3aed' }}>Are they finding you?</span>
        </h1>

        {/* Subhead */}
        <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '14px', lineHeight: 1.65, maxWidth: '560px', margin: '0 auto 14px' }}>
          ChatGPT, Perplexity, and Google AI are replacing traditional search — and most small businesses don't show up at all.
        </p>
        <p style={{ fontSize: '17px', color: '#374151', marginBottom: '36px', lineHeight: 1.65, fontWeight: 500 }}>
          Enter your website below and find out exactly where you stand — <em>free, in under a minute.</em>
        </p>

        {/* URL input */}
        <div style={{ display: 'flex', gap: '10px', maxWidth: '540px', margin: '0 auto 10px' }}>
          <input
            type="url"
            style={{ flex: 1, padding: '14px 18px', border: '1.5px solid #ddd6fe', borderRadius: '12px', fontSize: '15px', outline: 'none', boxShadow: '0 1px 4px rgba(124,58,237,0.07)' }}
            placeholder="yourbusiness.com"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && handleCheck()}
            disabled={loading}
          />
          <button
            style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', padding: '14px 24px', cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}
            onClick={handleCheck}
            disabled={loading}
          >
            {loading ? 'Checking…' : 'Check My Site →'}
          </button>
        </div>

        {loading && (
          <p style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 500, marginTop: '10px' }}>
            {LOADING_MESSAGES[loadingMsg]}
          </p>
        )}
        {error && <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>{error}</p>}

        {/* Trust line */}
        <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '12px' }}>
          🔒 Free scan, no credit card. Takes about 30 seconds.
        </p>

        {/* Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginTop: '52px' }}>
          {steps.map(s => (
            <div key={s.num} style={{ background: 'white', border: '1px solid #ddd6fe', borderRadius: '16px', padding: '22px 18px', textAlign: 'left', boxShadow: '0 1px 6px rgba(124,58,237,0.06)' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>{s.icon}</div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#d97706', marginBottom: '4px' }}>Step {s.num}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>{s.title}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Bottom reassurance */}
        <div style={{ marginTop: '48px', padding: '20px 24px', background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '28px', flexShrink: 0 }}>💡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827', marginBottom: '3px' }}>You don't need to be technical to use this.</div>
            <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.55 }}>We built findmewith.ai for business owners, not developers. Every result comes with plain English explanations and step-by-step guidance you can actually follow — or hand off to someone else.</div>
          </div>
        </div>

      </div>
    </div>
  );
};
