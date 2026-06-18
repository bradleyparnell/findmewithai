import React, { useState, useEffect } from 'react';
import { Check, ArrowLeft, Search, Star, Zap, Building2, Settings, Flame } from 'lucide-react';

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://findmewithai-production.up.railway.app';

interface Props {
  onBack: () => void;
  onProActivated: () => void;
  userEmail?: string;
  isPro?: boolean;
  onManageSubscription?: () => void;
}

export const PricingPage: React.FC<Props> = ({ onBack, onProActivated, userEmail, isPro, onManageSubscription }) => {
  const [annual, setAnnual] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [spotsLeft, setSpotsLeft] = useState<number>(50);
  const [spotsLoaded, setSpotsLoaded] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND}/api/founding-members-count`)
      .then(r => r.json())
      .then(d => { setSpotsLeft(d.spotsLeft ?? 50); setSpotsLoaded(true); })
      .catch(() => { setSpotsLeft(50); setSpotsLoaded(true); });
  }, []);

  const handleCheckout = async (planKey: string) => {
    setActivating(planKey);
    try {
      const res = await fetch(`${BACKEND}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey, email: userEmail || undefined }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      window.location.href = data.url;
    } catch {
      setActivating(null);
      alert('Payment setup failed. Please try again or email hello@findmewith.ai');
    }
  };

  const spotsFilled = 50 - spotsLeft;
  const fillPct = Math.min(100, Math.round((spotsFilled / 50) * 100));

  const plans = [
    {
      name: 'Free', icon: <Search size={20} />, price: '$0', period: 'forever',
      desc: 'See how you score and take your first step',
      cta: 'Current plan', ctaStyle: 'outline' as const, highlight: false,
      annualNote: '',
      note: '',
      features: [
        { text: 'AI visibility score for any website', ok: true },
        { text: "Plain-English breakdown of what's missing", ok: true },
        { text: 'Your AI introduction file (llms.txt)', ok: true },
        { text: 'FAQ content generator', ok: true },
        { text: 'About & How-To content generators', ok: false },
        { text: 'All 4 code snippets', ok: false },
        { text: 'Monitor up to 5 websites', ok: false },
        { text: 'Weekly score alerts by email', ok: false },
        { text: 'PDF report to share with developers', ok: false },
      ],
    },
    {
      name: 'Pro', icon: <Zap size={20} />,
      price: annual ? '$249' : '$29', period: annual ? 'per year' : 'per month',
      annualNote: annual ? 'Save $99 vs monthly' : 'Or $249/year — save $99',
      desc: 'Everything you need to get found by AI',
      cta: isPro ? 'Your current plan' : 'Start Pro — 7-day money-back',
      ctaStyle: 'primary' as const, highlight: true,
      note: '',
      features: [
        { text: 'Everything in Free', ok: true },
        { text: 'All content generators (FAQ, About, How-To)', ok: true },
        { text: 'All 4 code snippets', ok: true },
        { text: 'Monitor up to 5 websites', ok: true, soon: true },
        { text: 'Weekly score alerts by email', ok: true },
        { text: 'PDF report to share with developers', ok: true },
        { text: 'Priority support', ok: true },
        { text: 'White-label reports', ok: false },
        { text: 'Client dashboard', ok: false },
      ],
    },
    {
      name: 'Agency', icon: <Building2 size={20} />,
      price: annual ? '$999' : '$99', period: annual ? 'per year' : 'per month',
      annualNote: annual ? 'Save $189 vs monthly' : 'Or $999/year — save $189',
      desc: 'Run this for all your clients and resell it',
      cta: 'Join the waitlist', ctaStyle: 'amber' as const, highlight: false,
      note: 'Agency features are rolling out soon. Join the waitlist and lock in founding pricing.',
      features: [
        { text: 'Everything in Pro', ok: true },
        { text: 'Unlimited client websites', ok: true, soon: true },
        { text: 'White-label reports with your logo', ok: true, soon: true },
        { text: 'Client-sharing dashboard', ok: true, soon: true },
        { text: 'Bulk website scanning', ok: true, soon: true },
        { text: 'API access', ok: true, soon: true },
        { text: 'Dedicated account manager', ok: true, soon: true },
        { text: 'Custom integrations', ok: true, soon: true },
        { text: 'Team member seats', ok: true, soon: true },
      ],
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f5f3ff 0%, #ffffff 50%)', padding: '0 0 80px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 24px 0' }}>

        {/* Top nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#6b7280', fontSize: '14px', cursor: 'pointer', padding: 0 }}>
            <ArrowLeft size={16} /> Back
          </button>
          {isPro && onManageSubscription && (
            <button
              onClick={onManageSubscription}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '100px', padding: '6px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >
              <Settings size={13} /> Manage subscription
            </button>
          )}
        </div>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ width: '30px', height: '30px', background: '#7c3aed', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={15} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '16px', color: '#7c3aed' }}>findmewith.ai</span>
        </div>

        {/* ── FOUNDING MEMBER HERO ─────────────────────────────────────────── */}
        {!isPro && (
          <div style={{ background: 'linear-gradient(135deg, #1c0533 0%, #4c1d95 60%, #78350f 100%)', borderRadius: '24px', padding: '44px 40px', marginBottom: '48px', boxShadow: '0 16px 60px rgba(124,58,237,0.3)', position: 'relative', overflow: 'hidden' }}>

            {/* Background glow */}
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* Badge row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24', borderRadius: '100px', padding: '4px 14px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.6px' }}>
                <Flame size={11} /> FOUNDING MEMBER · LIMITED OFFER
              </span>
              {spotsLoaded && spotsLeft <= 10 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', borderRadius: '100px', padding: '4px 14px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.6px' }}>
                  🔥 Almost gone
                </span>
              )}
            </div>

            {/* Headline */}
            <h2 style={{ color: 'white', fontSize: '36px', fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              Get Pro access forever.<br />
              <span style={{ color: '#fbbf24' }}>One payment. $249.</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', margin: '0 0 28px', lineHeight: 1.6, maxWidth: '520px' }}>
              No monthly bills. No renewals. Lock in everything Pro includes right now, before the price changes. Founding members only.
            </p>

            {/* Features row */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '32px' }}>
              {['All Pro features', 'Weekly AI monitoring', 'All content generators', 'All code snippets', '7-day refund guarantee'].map(f => (
                <span key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.88)', fontWeight: 600 }}>
                  <Check size={13} color="#fbbf24" /> {f}
                </span>
              ))}
            </div>

            {/* Spots progress bar */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600 }}>
                  {spotsFilled} of 50 spots claimed
                </span>
                <span style={{ color: '#fbbf24', fontSize: '15px', fontWeight: 800 }}>
                  {spotsLoaded ? `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left` : 'Loading…'}
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${fillPct}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: '99px', transition: 'width 0.8s ease' }} />
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleCheckout('lifetime')}
                disabled={!!activating || spotsLeft === 0}
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', borderRadius: '14px', padding: '16px 36px', fontSize: '16px', fontWeight: 800, cursor: activating || spotsLeft === 0 ? 'wait' : 'pointer', whiteSpace: 'nowrap', opacity: activating ? 0.8 : 1, boxShadow: '0 4px 20px rgba(245,158,11,0.4)', letterSpacing: '-0.2px' }}
              >
                {activating === 'lifetime' ? 'Redirecting…' : spotsLeft === 0 ? 'Sold out' : 'Claim your founding member spot →'}
              </button>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                One payment · yours forever · 7-day refund guarantee
              </span>
            </div>
          </div>
        )}

        {/* ── Divider before regular plans ─────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
            {!isPro ? 'Prefer a monthly plan? Choose below.' : 'Simple, honest pricing'}
          </p>
        </div>

        {/* Monthly/Annual toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
          <span style={{ fontSize: '14px', fontWeight: annual ? 400 : 600, color: annual ? '#6b7280' : '#111827' }}>Monthly</span>
          <input type="checkbox" checked={annual} onChange={e => setAnnual(e.target.checked)} style={{ width: '40px', height: '22px', cursor: 'pointer', accentColor: '#7c3aed' }} />
          <span style={{ fontSize: '14px', fontWeight: annual ? 600 : 400, color: annual ? '#111827' : '#6b7280' }}>
            Annual{' '}
            <span style={{ display: 'inline-block', background: '#fef3c7', color: '#d97706', borderRadius: '100px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, marginLeft: '4px' }}>Save up to $99</span>
          </span>
        </div>

        {/* Plans grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'start' }}>
          {plans.map(plan => (
            <div key={plan.name} style={{ background: 'white', border: plan.highlight ? '2px solid #7c3aed' : '1px solid #e5e7eb', borderRadius: '20px', overflow: 'hidden', boxShadow: plan.highlight ? '0 8px 40px rgba(124, 58, 237, 0.15)' : '0 2px 12px rgba(0,0,0,0.04)' }}>
              {plan.highlight && (
                <div style={{ background: '#7c3aed', color: 'white', textAlign: 'center', padding: '7px', fontSize: '12px', fontWeight: 700 }}>⭐ Most Popular</div>
              )}
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ color: '#7c3aed' }}>{plan.icon}</div>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>{plan.name}</span>
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 900, color: '#111827' }}>{plan.price}</span>
                  <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '4px' }}>{plan.period}</span>
                </div>
                {plan.annualNote && <div style={{ fontSize: '12px', color: '#d97706', fontWeight: 600, marginBottom: '8px' }}>{plan.annualNote}</div>}
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5, marginBottom: '20px' }}>{plan.desc}</p>

                {plan.ctaStyle === 'primary' && (
                  isPro ? (
                    <button
                      onClick={onManageSubscription}
                      style={{ width: '100%', height: '40px', background: '#f3f0ff', color: '#7c3aed', border: '1.5px solid #ddd6fe', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Star size={14} fill="#7c3aed" /> Active plan — Manage
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleCheckout(annual ? 'pro_yearly' : 'pro_monthly')}
                        disabled={!!activating}
                        style={{ width: '100%', height: '40px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: activating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: activating ? 0.8 : 1 }}
                      >
                        {activating ? 'Redirecting to checkout…' : <><Star size={14} fill="white" /> {plan.cta}</>}
                      </button>
                      <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', marginTop: '8px', lineHeight: 1.5 }}>
                        Your free account stays active if you cancel — no bait and switch.
                      </p>
                    </>
                  )
                )}
                {plan.ctaStyle === 'outline' && (
                  <button disabled style={{ width: '100%', height: '40px', background: 'white', color: '#9ca3af', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontWeight: 600, cursor: 'not-allowed' }}>{plan.cta}</button>
                )}
                {plan.ctaStyle === 'amber' && (
                  <a
                    href="mailto:hello@findmewith.ai?subject=Agency%20Plan%20Waitlist&body=Hi%2C%20I%27d%20like%20to%20join%20the%20Agency%20waitlist%20for%20findmewith.ai."
                    style={{ display: 'block', width: '100%', height: '40px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', textAlign: 'center', lineHeight: '40px', textDecoration: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    {plan.cta}
                  </a>
                )}

                {plan.note && (
                  <p style={{ fontSize: '11px', color: '#92400e', background: '#fef3c7', borderRadius: '8px', padding: '8px 10px', margin: '12px 0 0', lineHeight: 1.5 }}>
                    {plan.note}
                  </p>
                )}

                <ul style={{ listStyle: 'none', margin: '20px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  {plan.features.map(f => (
                    <li key={f.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: f.ok ? '#374151' : '#9ca3af' }}>
                      <Check size={13} style={{ color: f.ok ? '#7c3aed' : '#d1d5db', flexShrink: 0, marginTop: '1px' }} />
                      <span style={{ flex: 1 }}>{f.text}</span>
                      {f.ok && (f as any).soon && (
                        <span style={{ background: '#f3f4f6', color: '#6b7280', borderRadius: '4px', padding: '1px 5px', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>SOON</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: '600px', margin: '48px auto 0' }}>
          <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '24px' }}>Questions we get asked a lot</h2>
          {[
            { q: 'What exactly is a Founding Member?', a: "You're one of the first 50 people to lock in full Pro access for a single one-time payment. When the 50 spots are gone, this offer disappears permanently. Your access never expires and never bills you again." },
            { q: 'Is the free plan really free?', a: 'Yes, completely. No credit card, no trial period — just a free account that stays free forever. You get your AI visibility score, a full breakdown of what\'s missing, and tools to start fixing it.' },
            { q: 'What happens after my 7-day Pro trial?', a: "If you don't cancel, you'll be charged the plan rate. If you do cancel, your account drops back to the free plan — your scan history and results stay right where you left them." },
            { q: 'Can I cancel any time?', a: 'Yes. No questions asked, no cancellation fees. Cancel from your account settings any time and you keep Pro access until the end of your billing period.' },
            { q: 'What does "weekly score alerts" actually mean?', a: 'Every Monday we re-scan your website and email you your new score, what changed since last week, and your #1 thing to fix. You can see your progress over time in your dashboard.' },
          ].map(({ q, a }) => (
            <div key={q} style={{ borderBottom: '1px solid #e5e7eb', padding: '18px 0' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '6px' }}>{q}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.7 }}>{a}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>7-day money-back guarantee · <strong>Your free account stays free forever</strong> · Cancel Pro any time</p>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>
            Questions? Email <a href="mailto:hello@findmewith.ai" style={{ color: '#7c3aed', fontWeight: 600 }}>hello@findmewith.ai</a>
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '20px', padding: '12px 24px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <svg width="44" height="18" viewBox="0 0 44 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Stripe">
              <path d="M4.9 6.8c0-.6.5-1 1.4-1 1.2 0 2.5.4 3.5 1l.6-3.6C9.3 2.7 7.9 2.3 6.3 2.3 3 2.3 .8 4 .8 6.9c0 4.5 5.4 3.8 5.4 5.8 0 .7-.6 1.1-1.6 1.1-1.3 0-2.9-.5-4-1.2l-.6 3.6c1.1.6 3 1 4.6 1 3.4 0 5.7-1.7 5.7-4.7C10.3 7.8 4.9 8.7 4.9 6.8zm13.8-4.3l-3.3.7-.4 1.9c-.6-.7-1.5-1-2.6-1-2.9 0-5.4 2.3-5.4 6.1 0 2.6 1.4 4 3.3 4 1.1 0 2-.5 2.7-1.3l-.2 1.1h3.5l2.4-11.5zm-3.5 7.8c-.3 1.4-1 2.1-1.9 2.1-.8 0-1.3-.6-1.3-1.7 0-1.8.8-3 2-3 .8 0 1.3.5 1.5 1.3l-.3 1.3zm5.1-7.8l-2.5 11.5h3.7l2.5-11.5h-3.7zm4.6 0l-2.5 11.5H26l.4-1.8c.7.8 1.6 1.2 2.7 1.2 2.9 0 5.1-2.5 5.1-6.3 0-2.3-1.3-3.8-3.2-3.8-1.1 0-2 .4-2.7 1.1l.3-1.9h-3.7zm3 8.2c-.8 0-1.4-.5-1.6-1.4l.3-1.4c.3-1.3 1-2 1.9-2 .9 0 1.4.6 1.4 1.7 0 1.7-.9 3.1-2 3.1zm12.1-8.5c-1.1 0-2 .5-2.7 1.4l.3-1.1h-3.5l-2.4 11.5h3.7l1.4-6.6c.3-1.3 1-2 2-2 .5 0 .9.1 1.2.3l.7-3.3c-.3-.2-.5-.2-.7-.2z" fill="#635BFF"/>
            </svg>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Payments secured by Stripe · 256-bit SSL encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};
