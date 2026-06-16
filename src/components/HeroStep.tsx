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

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 28px 80px', textAlign: 'center' }}>

        {/* Urgency badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#d97706', borderRadius: '100px', padding: '6px 16px', fontSize: '13px', fontWeight: 600, marginBottom: '28px', border: '1px solid #fde68a' }}>
          <TrendingUp size={13} />
          AI search is growing 400% per year — most businesses are invisible
        </div>

        {/* Main headline */}
        <h1 style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1.15, color: '#111827', marginBottom: '20px', letterSpacing: '-0.5px' }}>
          Right now, someone is asking AI<br />
          for exactly what you sell.{' '}
          <span style={{ color: '#7c3aed' }}>Do they find you?</span>
        </h1>

        {/* Subhead */}
        <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '14px', lineHeight: 1.65, maxWidth: '560px', margin: '0 auto 14px' }}>
          ChatGPT, Perplexity, and Google AI are replacing traditional search — and most small businesses don't show up at all.
        </p>
        <p style={{ fontSize: '17px', color: '#374151', marginBottom: '36px', lineHeight: 1.65, fontWeight: 500 }}>
          Enter your website below and find out exactly where you stand — <em>free, in under a minute.</em>
        </p>

        {/* AI platforms strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>We check visibility on:</span>
          {['ChatGPT', 'Perplexity', 'Google AI', 'Bing AI'].map(name => (
            <span key={name} style={{ display: 'inline-flex', alignItems: 'center', background: 'white', border: '1px solid #e5e7eb', borderRadius: '100px', padding: '4px 12px', fontSize: '12px', fontWeight: 600, color: '#374151', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {name}
            </span>
          ))}
        </div>

        {/* Animated search bar */}
        <div style={{ maxWidth: '580px', margin: '0 auto 10px' }}>
          {/* Outer glow wrapper */}
          <div style={{
            position: 'relative',
            borderRadius: '16px',
            padding: '3px',
            background: url ? 'linear-gradient(135deg, #7c3aed, #f59e0b)' : 'linear-gradient(135deg, #ddd6fe, #e5e7eb)',
            boxShadow: url ? '0 0 0 4px rgba(124,58,237,0.12), 0 6px 24px rgba(124,58,237,0.18)' : '0 2px 12px rgba(0,0,0,0.06)',
            transition: 'all 0.3s ease',
          }}>
            <div style={{ display: 'flex', background: 'white', borderRadius: '13px', overflow: 'hidden', alignItems: 'center' }}>
              {/* Search icon */}
              <div style={{ paddingLeft: '18px', color: url ? '#7c3aed' : '#9ca3af', flexShrink: 0, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}>
                <Search size={20} />
              </div>

              {/* Input + fake typewriter placeholder */}
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  ref={inputRef}
                  type="url"
                  style={{
                    width: '100%',
                    padding: '17px 14px',
                    border: 'none',
                    fontSize: '17px',
                    outline: 'none',
                    color: '#111827',
                    background: 'transparent',
                    fontWeight: 500,
                    caretColor: '#7c3aed',
                    boxSizing: 'border-box',
                  }}
                  placeholder=""
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onFocus={() => setPauseTyping(true)}
                  onBlur={() => { if (!url) setPauseTyping(false); }}
                  onKeyDown={e => e.key === 'Enter' && !loading && handleCheck()}
                  disabled={loading}
                />
                {/* Animated typewriter placeholder */}
                {!url && !loading && (
                  <div style={{
                    position: 'absolute', top: '50%', left: '14px',
                    transform: 'translateY(-50%)',
                    fontSize: '17px', color: '#9ca3af', fontWeight: 400,
                    pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '1px',
                    whiteSpace: 'nowrap',
                  }}>
                    <span>{typedDomain || 'yourbusiness'}</span>
                    {!pauseTyping && <span style={{ animation: 'caretBlink 1s step-end infinite', borderLeft: '2px solid #9ca3af', height: '18px', display: 'inline-block', marginLeft: '1px' }} />}
                    {!typedDomain && <span style={{ color: '#c4b5fd' }}>.com</span>}
                  </div>
                )}
              </div>

              {/* CTA button — inside the bar */}
              <button
                style={{
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '15px',
                  padding: '13px 24px',
                  margin: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: loading ? 0.7 : 1,
                  flexShrink: 0,
                  transition: 'background 0.2s, transform 0.1s',
                }}
                onClick={handleCheck}
                disabled={loading}
                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#6d28d9'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#7c3aed'; }}
              >
                {loading ? 'Scanning…' : 'Scan My Site →'}
              </button>
            </div>
          </div>
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
        {error && <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>{error}</p>}

        {/* Trust line */}
        <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '12px' }}>
          🔒 Free scan, no credit card. Takes about 30 seconds.
        </p>

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
