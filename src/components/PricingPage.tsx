import React, { useState } from 'react';
import { Check, ArrowLeft, Search, Star, Zap, Building2, Settings } from 'lucide-react';

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
      alert('Payment setup failed. Please try again or email hello@findmewithai.com');
    }
  };

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
      cta: isPro ? 'Your current plan' : 'Try Pro free for 7 days',
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f5f3ff 0%, #ffffff 50%)', padding: '0 0 60px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 24px 0' }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ width: '30px', height: '30px', background: '#7c3aed', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={15} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '16px', color: '#7c3aed' }}>findmewith.ai</span>
        </div>

        <h1 style={{ fontSize: '34px', fontWeight: 900, color: '#111827', textAlign: 'center', marginBottom: '10px', letterSpacing: '-0.4px' }}>Simple, honest pricing</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '16px', marginBottom: '28px' }}>Start free. Upgrade when you're ready. Cancel any time.</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '40px' }}>
          <span style={{ fontSize: '14px', fontWeight: annual ? 400 : 600, color: annual ? '#6b7280' : '#111827' }}>Monthly</span>
          <input type="checkbox" checked={annual} onChange={e => setAnnual(e.target.checked)} style={{ width: '40px', height: '22px', cursor: 'pointer', accentColor: '#7c3aed' }} />
          <span style={{ fontSize: '14px', fontWeight: annual ? 600 : 400, color: annual ? '#111827' : '#6b7280' }}>
            Annual{' '}
            <span style={{ display: 'inline-block', background: '#fef3c7', color: '#d97706', borderRadius: '100px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, marginLeft: '4px' }}>Save up to $99</span>
          </span>
        </div>

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
                    href="mailto:hello@findmewithai.com?subject=Agency%20Plan%20Waitlist&body=Hi%2C%20I%27d%20like%20to%20join%20the%20Agency%20waitlist%20for%20findmewith.ai."
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
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Try Pro free for 7 days · <strong>Your free account stays free forever</strong> · Cancel Pro any time</p>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>
            Questions? Email <a href="mailto:hello@findmewithai.com" style={{ color: '#7c3aed', fontWeight: 600 }}>hello@findmewithai.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};
