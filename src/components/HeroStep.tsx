import React, { useState, useEffect } from 'react';
import { Search, FileText, Code2, Sparkles } from 'lucide-react';
import { analyzeWebsite } from '../utils/analyzer';
import type { AnalysisResult } from '../types';

interface Props {
  onAnalyzed: (result: AnalysisResult, url: string) => void;
}

const LOADING_MESSAGES = [
  'Connecting to your website…',
  'Reading your content…',
  'Checking AI visibility signals…',
  'Calculating your score…',
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
    { icon: <Search size={20} />, num: '1', title: 'See Your Score', desc: "Find out exactly what AI knows — and doesn't know — about your business" },
    { icon: <FileText size={20} />, num: '2', title: 'Fix Your Content', desc: "We'll help write the right words so AI can understand and recommend you" },
    { icon: <Code2 size={20} />, num: '3', title: 'Add a Code Snippet', desc: 'One copy-paste and your site becomes fully readable by AI search engines' },
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

      <div style={{ maxWidth: '660px', margin: '0 auto', padding: '32px 28px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ede9fe', color: '#7c3aed', borderRadius: '100px', padding: '6px 16px', fontSize: '13px', fontWeight: 600, marginBottom: '28px' }}>
          <Sparkles size={13} />
          Free scan · Free account · Pro when you're ready
        </div>

        <h1 style={{ fontSize: '40px', fontWeight: 900, lineHeight: 1.15, color: '#111827', marginBottom: '16px', letterSpacing: '-0.5px' }}>
          When someone asks AI about<br />
          your business —{' '}
          <span style={{ color: '#7c3aed' }}>do you show up?</span>
        </h1>

        <p style={{ fontSize: '17px', color: '#6b7280', marginBottom: '36px', lineHeight: 1.65 }}>
          ChatGPT, Perplexity, and Google AI answer millions of questions every day.
          Enter your website and we'll show you exactly what they see — and how to change it.
        </p>

        <div style={{ display: 'flex', gap: '10px', maxWidth: '520px', margin: '0 auto 10px' }}>
          <input
            type="url"
            style={{ flex: 1, padding: '12px 16px', border: '1.5px solid #ddd6fe', borderRadius: '10px', fontSize: '15px', outline: 'none' }}
            placeholder="yourbusiness.com"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && handleCheck()}
            disabled={loading}
          />
          <button
            style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', padding: '12px 22px', cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: loading ? 0.7 : 1 }}
            onClick={handleCheck}
            disabled={loading}
          >
            {loading ? 'Checking…' : 'Check My Site →'}
          </button>
        </div>

        {loading && (
          <p style={{ color: '#7c3aed', fontSize: '14px', fontWeight: 500, marginTop: '8px' }}>
            {LOADING_MESSAGES[loadingMsg]}
          </p>
        )}
        {error && <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>{error}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginTop: '52px' }}>
          {steps.map(s => (
            <div key={s.num} style={{ background: 'white', border: '1px solid #ddd6fe', borderRadius: '16px', padding: '20px', textAlign: 'left' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>{s.icon}</div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#d97706', marginBottom: '4px' }}>Step {s.num}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>{s.title}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.55 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
