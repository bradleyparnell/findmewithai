import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Code2, Sparkles, TrendingUp, LogIn } from 'lucide-react';
import { analyzeWebsite } from '../utils/analyzer';
import type { AnalysisResult } from '../types';

const EXAMPLE_DOMAINS = [
  'spartantrail.com',
  'marysbakery.com',
  'acmeplumbing.com',
  'downtown-boutique.com',
  'rivercitydental.com',
  'shopbrightgear.com',
];

interface Props {
  onAnalyzed: (result: AnalysisResult, url: string) => void;
  user?: any;
  onSignIn?: (email: string) => Promise<void>;
  onGoToDashboard?: () => void;
}

const LOADING_MESSAGES = [
  { text: 'Checking if ChatGPT knows your business exists…', fear: '68% of businesses are completely invisible to AI search.' },
  { text: 'Looking at what your competitors tell AI about themselves…', fear: 'Your competitors may already be showing up where you aren\'t.' },
  { text: 'Finding the gaps that are quietly costing you customers…', fear: 'Most business owners don\'t know they have a visibility problem.' },
  { text: 'Counting how many AI questions you can\'t answer yet…', fear: 'Each unanswered question is a customer going elsewhere.' },
  { text: 'Building your personalized action plan…', fear: 'The good news: most fixes take less than 15 minutes.' },
];

export const HeroStep: React.FC<Props> = ({ onAnalyzed, user, onSignIn, onGoToDashboard }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [error, setError] = useState('');
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInSent, setSignInSent] = useState(false);

  // Typewriter placeholder animation
  const [typedDomain, setTypedDomain] = useState('');
  const [domainIdx, setDomainIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pauseTyping, setPauseTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (url || loading || pauseTyping) return;
    const current = EXAMPLE_DOMAINS[domainIdx];
    if (!isDeleting && charIdx === current.length) {
      const t = setTimeout(() => setIsDeleting(true), 1600);
      return () => clearTimeout(t);
    }
    const speed = isDeleting ? 55 : 95;
    const t = setTimeout(() => {
      if (isDeleting) {
        setTypedDomain(current.slice(0, charIdx - 1));
        setCharIdx(c => c - 1);
        if (charIdx - 1 === 0) {
          setIsDeleting(false);
          setDomainIdx(i => (i + 1) % EXAMPLE_DOMAINS.length);
        }
      } else {
        setTypedDomain(current.slice(0, charIdx + 1));
        setCharIdx(c => c + 1);
      }
    }, speed);
    return () => clearTimeout(t);
  }, [url, loading, pauseTyping, charIdx, isDeleting, domainIdx]);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsg(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSignInSubmit = async () => {
    if (!signInEmail.trim() || !onSignIn) return;
    setSignInLoading(true);
    await onSignIn(signInEmail.trim());
    setSignInSent(true);
    setSignInLoading(false);
  };

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

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 28px 80px', textAlign: 'center' }}>

        {/* Main headline — big and clean */}
        <h1 style={{ fontSize: '60px', fontWeight: 900, lineHeight: 1.08, color: '#111827', marginBottom: '22px', letterSpacing: '-2px' }}>
          Does AI recommend<br />
          <span style={{ color: '#7c3aed' }}>your business?</span>
        </h1>

        {/* One-line subtext only */}
        <p style={{ fontSize: '20px', color: '#6b7280', marginBottom: '48px', lineHeight: 1.5, fontWeight: 400 }}>
          Find out in 30 seconds — free, no credit card.
        </p>

        {/* SEMrush-style: pill bar + separate pill button */}
        <div style={{ display: 'flex', gap: '12px', maxWidth: '740px', margin: '0 auto 18px', alignItems: 'center' }}>

          {/* Pill input */}
          <div style={{
            flex: 1,
            position: 'relative',
            background: 'white',
            borderRadius: '100px',
            boxShadow: url
              ? '0 0 0 3px rgba(124,58,237,0.25), 0 4px 20px rgba(124,58,237,0.12)'
              : '0 2px 16px rgba(0,0,0,0.10)',
            transition: 'box-shadow 0.25s ease',
            display: 'flex',
            alignItems: 'center',
            height: '68px',
          }}>
            <div style={{ paddingLeft: '24px', color: url ? '#7c3aed' : '#9ca3af', flexShrink: 0, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}>
              <Search size={22} />
            </div>

            <div style={{ flex: 1, position: 'relative' }}>
              <input
                ref={inputRef}
                type="url"
                style={{
                  width: '100%',
                  padding: '0 20px',
                  border: 'none',
                  fontSize: '19px',
                  outline: 'none',
                  color: '#111827',
                  background: 'transparent',
                  fontWeight: 500,
                  caretColor: '#7c3aed',
                  boxSizing: 'border-box',
                  height: '68px',
                  borderRadius: '100px',
                }}
                placeholder=""
                value={url}
                onChange={e => setUrl(e.target.value)}
                onFocus={() => setPauseTyping(true)}
                onBlur={() => { if (!url) setPauseTyping(false); }}
                onKeyDown={e => e.key === 'Enter' && !loading && handleCheck()}
                disabled={loading}
              />
              {/* Typewriter placeholder */}
              {!url && !loading && (
                <div style={{
                  position: 'absolute', top: '50%', left: '20px',
                  transform: 'translateY(-50%)',
                  fontSize: '19px', color: '#9ca3af', fontWeight: 400,
                  pointerEvents: 'none', display: 'flex', alignItems: 'center',
                  whiteSpace: 'nowrap',
                }}>
                  <span>{typedDomain || 'yourbusiness'}</span>
                  {!pauseTyping && <span style={{ animation: 'caretBlink 1s step-end infinite', borderLeft: '2px solid #c4b5fd', height: '20px', display: 'inline-block', marginLeft: '1px' }} />}
                  {!typedDomain && <span style={{ color: '#c4b5fd' }}>.com</span>}
                </div>
              )}
            </div>
          </div>

          {/* Separate pill CTA button — SEMrush style */}
          <button
            style={{
              background: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '100px',
              fontWeight: 800,
              fontSize: '17px',
              padding: '0 36px',
              height: '68px',
              cursor: loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              opacity: loading ? 0.75 : 1,
              flexShrink: 0,
              boxShadow: '0 4px 18px rgba(124,58,237,0.35)',
              transition: 'background 0.2s, transform 0.1s, box-shadow 0.2s',
              letterSpacing: '-0.2px',
            }}
            onClick={handleCheck}
            disabled={loading}
            onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.background = '#6d28d9'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(124,58,237,0.45)'; } }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#7c3aed'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 18px rgba(124,58,237,0.35)'; }}
          >
            {loading ? 'Scanning…' : 'Scan My Site →'}
          </button>
        </div>

        {/* Trust line below bar */}
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '20px' }}>
          🔒 Free scan · No credit card · Takes about 30 seconds
        </p>

        {/* Platform chips — below bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '0' }}>
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>Checks your visibility on:</span>
          {['ChatGPT', 'Perplexity', 'Google AI', 'Bing AI'].map(name => (
            <span key={name} style={{ display: 'inline-flex', alignItems: 'center', background: 'white', border: '1px solid #e5e7eb', borderRadius: '100px', padding: '5px 14px', fontSize: '13px', fontWeight: 600, color: '#374151', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {name}
            </span>
          ))}
        </div>

        {loading && (
          <div style={{ marginTop: '20px', background: '#0D0D1A', borderRadius: '20px', padding: '32px 28px', maxWidth: '480px', margin: '20px auto 0', textAlign: 'center', boxShadow: '0 8px 40px rgba(124,58,237,0.25)' }}>

            {/* Radar display */}
            <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 24px' }}>
              {/* Concentric rings */}
              {[140, 96, 52].map((size, i) => (
                <div key={i} style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: `${size}px`, height: `${size}px`,
                  borderRadius: '50%',
                  border: `1px solid rgba(124,58,237,${0.15 + i * 0.1})`,
                  transform: 'translate(-50%,-50%)',
                }} />
              ))}
              {/* Sweeping arm */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                width: '70px', height: '2px',
                transformOrigin: '0% 50%',
                background: 'linear-gradient(90deg, rgba(124,58,237,0.9), rgba(124,58,237,0))',
                animation: 'radarSweep 2.5s linear infinite',
                marginTop: '-1px',
              }} />
              {/* Amber ping — found signal */}
              <div style={{
                position: 'absolute', top: '28%', left: '64%',
                width: '10px', height: '10px',
                background: '#f59e0b',
                borderRadius: '50%',
                animation: 'pingPulse 1.8s ease-in-out infinite',
              }} />
              {/* Center dot */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                width: '7px', height: '7px',
                background: '#7c3aed',
                borderRadius: '50%',
                transform: 'translate(-50%,-50%)',
              }} />
            </div>

            {/* Scanning label */}
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(124,58,237,0.8)', marginBottom: '10px' }}>
              Signal scan in progress
            </div>

            {/* Message */}
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'white', lineHeight: 1.5, marginBottom: '18px', animation: 'fadeInUp 0.4s ease', minHeight: '46px' }}>
              {LOADING_MESSAGES[loadingMsg].text}
            </div>

            {/* Progress bar */}
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', marginBottom: '16px' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #7c3aed, #f59e0b)', borderRadius: '99px', width: `${((loadingMsg + 1) / LOADING_MESSAGES.length) * 100}%`, transition: 'width 0.6s ease' }} />
            </div>

            {/* Fear/hope fact */}
            <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#fbbf24', fontWeight: 500, textAlign: 'left' }}>
              ⚡ {LOADING_MESSAGES[loadingMsg].fear}
            </div>
          </div>
        )}
        {error && <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '16px' }}>{error}</p>}

        {/* Returning user sign-in */}
        {user ? (
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={onGoToDashboard}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f5f3ff', color: '#7c3aed', border: '1.5px solid #ddd6fe', borderRadius: '100px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >
              <LogIn size={13} /> Welcome back — go to your dashboard →
            </button>
          </div>
        ) : (
          <div style={{ marginTop: '16px' }}>
            {!showSignIn && !signInSent && (
              <button
                onClick={() => setShowSignIn(true)}
                style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}
              >
                Already a member? Sign in →
              </button>
            )}
            {showSignIn && !signInSent && (
              <div style={{ display: 'flex', gap: '8px', maxWidth: '400px', margin: '0 auto', alignItems: 'center' }}>
                <input
                  type="email"
                  autoFocus
                  placeholder="your@email.com"
                  value={signInEmail}
                  onChange={e => setSignInEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !signInLoading && handleSignInSubmit()}
                  style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #ddd6fe', borderRadius: '10px', fontSize: '14px', outline: 'none' }}
                />
                <button
                  onClick={handleSignInSubmit}
                  disabled={signInLoading}
                  style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 700, cursor: signInLoading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: signInLoading ? 0.7 : 1 }}
                >
                  {signInLoading ? 'Sending…' : 'Send link →'}
                </button>
              </div>
            )}
            {signInSent && (
              <p style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>
                ✅ Magic link sent! Check your inbox and click it to sign in.
              </p>
            )}
          </div>
        )}

        {/* Steps — below the fold, simplified */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '72px' }}>
          {steps.map(s => (
            <div key={s.num} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px 20px', textAlign: 'left', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '22px', marginBottom: '10px' }}>
                {s.num === '1' ? '📡' : s.num === '2' ? '🔍' : '✅'}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>{s.title}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
