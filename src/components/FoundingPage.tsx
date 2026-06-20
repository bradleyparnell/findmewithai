import React, { useState, useEffect } from 'react';
import { Flame, Check, Lock, Zap, BarChart2, Users, Globe, Repeat, Shield, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://findmewithai-production.up.railway.app';
const TOTAL_SPOTS = 50;
const SEED = 4; // pre-seeded claimed count so it never shows 0

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

const INCLUDED: { icon: React.ReactNode; title: string; desc: string }[] = [
  { icon: <BarChart2 size={18} />, title: 'Full AI Visibility Score', desc: 'Complete breakdown of how ChatGPT, Gemini, and Perplexity see your business.' },
  { icon: <Zap size={18} />, title: 'Unlimited Site Scans', desc: 'Scan your site any time. Track changes as you make improvements.' },
  { icon: <Repeat size={18} />, title: 'Weekly Auto-Monitoring', desc: 'Your score is re-scanned every week automatically. Know the moment it changes.' },
  { icon: <Globe size={18} />, title: 'Full Snippet Library', desc: 'Every AI-optimized schema snippet and structured data block, ready to deploy.' },
  { icon: <Users size={18} />, title: 'Unlimited Team Members', desc: 'Share access with your whole team — no seat limits, ever.' },
  { icon: <Shield size={18} />, title: 'Every Future Feature', desc: 'Competitor intelligence, keyword gap reports, industry benchmarks, team dashboards — all yours automatically when they ship.' },
];

const COMING_SOON: string[] = [
  'Competitor intelligence — see how you rank vs. rivals in AI search',
  'Keyword gap reports — discover what topics you\'re missing',
  'Industry benchmarks — know how your score stacks up',
  'Team dashboards — manage multiple sites from one place',
  'WordPress plugin — one-click schema deployment',
  'Priority support channel',
];

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Is this really a one-time payment?',
    a: 'Yes. $249 once. No subscription, no renewal, no price increase — ever. Your access never expires.',
  },
  {
    q: 'What happens when you add new features?',
    a: 'As a Founding Member you are grandfathered into everything we ship. Competitor tracking, keyword gaps, industry benchmarks — they all get added to your account automatically.',
  },
  {
    q: 'What if I already have a Pro subscription?',
    a: 'Email us at hello@findmewith.ai and we will credit your remaining subscription toward the Founding Member price.',
  },
  {
    q: 'What happens when the 50 spots are gone?',
    a: 'This offer disappears permanently. Pro will continue at $29/month. The one-time deal will not come back.',
  },
  {
    q: 'Is there a refund policy?',
    a: 'If findmewith.ai stops operating within 60 days of your purchase, we will refund you in full. Otherwise all sales are final — this is lifetime access at a deep discount.',
  },
];

export const FoundingPage: React.FC = () => {
  const width = useWindowWidth();
  const isMobile = width < 700;

  const [spotsLeft, setSpotsLeft] = useState<number>(TOTAL_SPOTS - SEED);
  const [spotsLoaded, setSpotsLoaded] = useState(false);
  const [activating, setActivating] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${BACKEND}/api/founding-members-count`)
      .then(r => r.json())
      .then(d => { setSpotsLeft(d.spotsLeft ?? (TOTAL_SPOTS - SEED)); setSpotsLoaded(true); })
      .catch(() => { setSpotsLeft(TOTAL_SPOTS - SEED); setSpotsLoaded(true); });
  }, []);

  const spotsFilled = TOTAL_SPOTS - spotsLeft;
  const fillPct = Math.min(100, Math.round((spotsFilled / TOTAL_SPOTS) * 100));
  const urgencyColor = spotsLeft <= 5 ? '#ef4444' : spotsLeft <= 15 ? '#f59e0b' : '#22c55e';

  const handleClaim = async () => {
    if (!email.trim() || !email.includes('@')) {
      setEmailError('Enter a valid email to continue.');
      return;
    }
    setEmailError('');
    setActivating(true);
    try {
      const res = await fetch(`${BACKEND}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'lifetime', userEmail: email.trim() }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setActivating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d0118', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── BACK LINK ───────────────────────────────────────────── */}
      <div style={{ padding: '20px 24px 0' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#9ca3af', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          <ArrowLeft size={14} /> Back to findmewith.ai
        </a>
      </div>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: isMobile ? '40px 20px 0' : '56px 24px 0', textAlign: 'center' }}>

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '100px', padding: '6px 14px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#fbbf24', marginBottom: '28px', textTransform: 'uppercase' }}>
          <Flame size={11} fill="#fbbf24" /> Founding Member &mdash; 50 spots only
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: isMobile ? '34px' : '56px', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-1.5px', margin: '0 0 20px', color: 'white' }}>
          Pay once.<br />
          <span style={{ color: '#fbbf24' }}>Get everything. Forever.</span>
        </h1>

        <p style={{ fontSize: isMobile ? '17px' : '20px', color: '#c4b5fd', lineHeight: 1.6, margin: '0 0 36px', maxWidth: '580px', marginLeft: 'auto', marginRight: 'auto' }}>
          Full Pro access, every feature we ever ship, zero monthly bills. One payment of $249 locks it in permanently.
        </p>

        {/* Spot counter */}
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px 24px', marginBottom: '32px', maxWidth: '440px', margin: '0 auto 36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', color: '#9ca3af' }}>{spotsFilled} of {TOTAL_SPOTS} spots claimed</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: urgencyColor }}>
              {spotsLoaded ? `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left` : 'Loading…'}
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '100px', height: '8px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${fillPct}%`, background: 'linear-gradient(90deg, #7c3aed, #fbbf24)', borderRadius: '100px', transition: 'width 0.8s ease' }} />
          </div>
          {spotsLoaded && spotsLeft <= 10 && (
            <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#ef4444', fontWeight: 700, textAlign: 'center' }}>
              Only {spotsLeft} spot{spotsLeft === 1 ? '' : 's'} remaining. This offer closes when spot 50 is claimed.
            </p>
          )}
        </div>

        {/* CTA form */}
        <div style={{ maxWidth: '460px', margin: '0 auto 16px' }}>
          <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleClaim()}
              disabled={activating || spotsLeft === 0}
              style={{
                flex: 1, padding: '15px 18px', fontSize: '16px', border: emailError ? '2px solid #ef4444' : '2px solid rgba(124,58,237,0.5)',
                borderRadius: '12px', background: 'rgba(255,255,255,0.08)', color: 'white', outline: 'none',
              }}
            />
            <button
              onClick={handleClaim}
              disabled={activating || spotsLeft === 0}
              style={{
                background: spotsLeft === 0 ? '#4b5563' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white', border: 'none', borderRadius: '12px', padding: '15px 28px',
                fontSize: '16px', fontWeight: 800, cursor: activating || spotsLeft === 0 ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap', boxShadow: spotsLeft === 0 ? 'none' : '0 4px 24px rgba(245,158,11,0.45)',
                opacity: activating ? 0.8 : 1, transition: 'opacity 0.2s',
              }}
            >
              {activating ? 'Redirecting…' : spotsLeft === 0 ? 'Sold out' : 'Claim my spot →'}
            </button>
          </div>
          {emailError && <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#ef4444' }}>{emailError}</p>}
          <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#6b7280' }}>
            Secure checkout via Stripe. No subscription. Cancel-free.
          </p>
        </div>
      </div>

      {/* ── WHAT'S INCLUDED ─────────────────────────────────────── */}
      <div style={{ maxWidth: '760px', margin: '64px auto 0', padding: '0 24px' }}>
        <h2 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800, textAlign: 'center', marginBottom: '8px', color: 'white' }}>
          Everything Pro includes
        </h2>
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '15px', marginBottom: '32px' }}>
          Plus every feature we ship in the future — automatically added to your account.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
          {INCLUDED.map((item, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ color: '#a78bfa', marginTop: '2px', flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'white', marginBottom: '4px' }}>{item.title}</div>
                <div style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── COMING SOON / GRANDFATHERED ─────────────────────────── */}
      <div style={{ maxWidth: '760px', margin: '48px auto 0', padding: '0 24px' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(245,158,11,0.12) 100%)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '20px', padding: isMobile ? '28px 20px' : '36px 40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '100px', padding: '5px 12px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: '#fbbf24', marginBottom: '16px', textTransform: 'uppercase' }}>
            <Zap size={11} fill="#fbbf24" /> On the roadmap — yours automatically
          </div>
          <h3 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: 'white', marginBottom: '20px' }}>
            You are not just buying what exists today.
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
            {COMING_SOON.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                  <Check size={11} color="#a78bfa" />
                </div>
                <span style={{ fontSize: '14px', color: '#d1d5db', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── URGENCY CALLOUT ─────────────────────────────────────── */}
      <div style={{ maxWidth: '760px', margin: '48px auto 0', padding: '0 24px' }}>
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '24px 28px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '24px', flexShrink: 0 }}>🔒</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: '#fca5a5', marginBottom: '6px' }}>The clock is real.</div>
            <div style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.6 }}>
              When spot 50 is claimed, this page goes dark. There is no waitlist. There is no second round.
              Pro will continue at $29 a month. The one-time deal will not come back.
            </div>
          </div>
        </div>
      </div>

      {/* ── SECOND CTA ──────────────────────────────────────────── */}
      <div style={{ maxWidth: '760px', margin: '56px auto 0', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ fontSize: isMobile ? '22px' : '30px', fontWeight: 800, color: 'white', marginBottom: '8px', lineHeight: 1.2 }}>
          {spotsLoaded ? `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left` : `${TOTAL_SPOTS - SEED} spots left`} at this price.
        </p>
        <p style={{ fontSize: '16px', color: '#9ca3af', marginBottom: '28px' }}>
          $249 once. Everything, forever. No bills, no renewals.
        </p>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', justifyContent: 'center', maxWidth: '460px', margin: '0 auto' }}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleClaim()}
            disabled={activating || spotsLeft === 0}
            style={{
              flex: 1, padding: '15px 18px', fontSize: '16px', border: '2px solid rgba(124,58,237,0.5)',
              borderRadius: '12px', background: 'rgba(255,255,255,0.08)', color: 'white', outline: 'none',
            }}
          />
          <button
            onClick={handleClaim}
            disabled={activating || spotsLeft === 0}
            style={{
              background: spotsLeft === 0 ? '#4b5563' : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white', border: 'none', borderRadius: '12px', padding: '15px 28px',
              fontSize: '16px', fontWeight: 800, cursor: activating || spotsLeft === 0 ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap', boxShadow: spotsLeft === 0 ? 'none' : '0 4px 24px rgba(245,158,11,0.45)',
            }}
          >
            {activating ? 'Redirecting…' : spotsLeft === 0 ? 'Sold out' : 'Claim my spot →'}
          </button>
        </div>
        <p style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>Secure checkout via Stripe. Need help? <a href="mailto:hello@findmewith.ai" style={{ color: '#a78bfa', textDecoration: 'none' }}>hello@findmewith.ai</a></p>
      </div>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '680px', margin: '64px auto 0', padding: '0 24px' }}>
        <h2 style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: 800, textAlign: 'center', marginBottom: '28px', color: 'white' }}>Common questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'white', fontWeight: 700, fontSize: '15px', gap: '12px' }}
              >
                <span>{faq.q}</span>
                {openFaq === i ? <ChevronUp size={16} color="#9ca3af" style={{ flexShrink: 0 }} /> : <ChevronDown size={16} color="#9ca3af" style={{ flexShrink: 0 }} />}
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 20px 18px', fontSize: '14px', color: '#9ca3af', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: '760px', margin: '64px auto 0', padding: '32px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: '#a78bfa', fontWeight: 700 }}>findmewith.ai</span>
          <span style={{ margin: '0 8px' }}>·</span>
          <a href="mailto:hello@findmewith.ai" style={{ color: '#6b7280', textDecoration: 'none' }}>hello@findmewith.ai</a>
          <span style={{ margin: '0 8px' }}>·</span>
          <a href="/privacy" style={{ color: '#6b7280', textDecoration: 'none' }}>Privacy</a>
          <span style={{ margin: '0 8px' }}>·</span>
          <a href="/terms" style={{ color: '#6b7280', textDecoration: 'none' }}>Terms</a>
        </div>
        <div>© {new Date().getFullYear()} findmewith.ai — All rights reserved.</div>
      </div>

    </div>
  );
};
