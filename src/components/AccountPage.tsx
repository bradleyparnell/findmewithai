import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Shield, Trash2, CheckCircle, AlertCircle, User, Mail, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://findmewithai-production.up.railway.app';

interface Props {
  user: { id?: string; email?: string };
  isPro: boolean;
  previewFree?: boolean;
  setPreviewFree?: (v: boolean) => void;
  onBack: () => void;
  onUpgrade: () => void;
  onSignOut: () => void;
}

export const AccountPage: React.FC<Props> = ({ user, isPro, previewFree, setPreviewFree, onBack, onUpgrade, onSignOut }) => {
  const isAdmin = user?.email === 'hello@genierocket.com';
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew]         = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);
    if (pwNew !== pwConfirm) {
      setPwMessage({ type: 'err', text: 'New passwords do not match.' });
      return;
    }
    if (pwNew.length < 8) {
      setPwMessage({ type: 'err', text: 'Password must be at least 8 characters.' });
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwNew });
    setPwLoading(false);
    if (error) {
      setPwMessage({ type: 'err', text: error.message });
    } else {
      setPwMessage({ type: 'ok', text: 'Password updated successfully!' });
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
    }
  };

  const handleManageBilling = async () => {
    const email = user.email;
    if (!email) return;
    setPortalLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Could not open billing portal. Email hello@findmewith.ai for help.');
      }
    } catch {
      alert('Could not open billing portal. Email hello@findmewith.ai for help.');
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f3f8' }}>

      {/* Top nav */}
      <div style={{ background: '#1e1b4b', padding: '0 32px', display: 'flex', alignItems: 'center', height: '60px', gap: '16px' }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#c4b5fd', fontSize: '14px', fontWeight: 600, padding: '7px 14px', cursor: 'pointer' }}
        >
          <ArrowLeft size={15} /> Back to Dashboard
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', background: '#7c3aed', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, color: 'white' }}>f</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: '14px', color: '#e2e8f0' }}>findmewith.ai</span>
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 100px' }}>

        {/* Page heading */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <h1 style={{ margin: '0 0 6px', fontSize: '30px', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>
              My Account
            </h1>
            {isAdmin && setPreviewFree && (
              <button
                onClick={() => setPreviewFree(!previewFree)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  background: previewFree ? '#fef3c7' : '#f3f4f6',
                  border: `1.5px solid ${previewFree ? '#f59e0b' : '#d1d5db'}`,
                  borderRadius: '999px', padding: '5px 14px',
                  fontSize: '12px', fontWeight: 700,
                  color: previewFree ? '#92400e' : '#6b7280',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '14px' }}>{previewFree ? '👁️' : '🔒'}</span>
                {previewFree ? 'Previewing as free user — click to exit' : 'Preview as free user'}
              </button>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '15px', color: '#6b7280' }}>
            Manage your plan, password, and account settings.
          </p>
        </div>

        {/* ── ACCOUNT INFO ── */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '28px 32px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <User size={18} style={{ color: '#7c3aed' }} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111827' }}>Account Info</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '14px 18px' }}>
            <Mail size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email address</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{user.email}</div>
            </div>
          </div>
        </div>

        {/* ── PLAN ── */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '28px 32px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <CreditCard size={18} style={{ color: '#7c3aed' }} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111827' }}>Plan &amp; Billing</h2>
          </div>

          {isPro ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1.5px solid #c4b5fd', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,0.2)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#5b21b6' }}>Pro Plan — Active</div>
                  <div style={{ fontSize: '13px', color: '#7c3aed', marginTop: '3px' }}>Weekly monitoring, competitor tracking, full code &amp; content tools.</div>
                </div>
                <span style={{ background: '#7c3aed', color: 'white', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '99px', letterSpacing: '0.05em' }}>PRO</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {['Weekly automated re-scans', 'Score change email alerts', 'Competitor tracking (up to 5)', 'AI content writer + code snippets'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#374151' }}>
                    <CheckCircle size={16} style={{ color: '#7c3aed', flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>

              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', color: '#7c3aed', border: '2px solid #7c3aed', borderRadius: '12px', padding: '12px 22px', fontSize: '14px', fontWeight: 700, cursor: portalLoading ? 'not-allowed' : 'pointer', opacity: portalLoading ? 0.6 : 1 }}
              >
                <CreditCard size={15} />
                {portalLoading ? 'Opening…' : 'Manage Billing & Subscription →'}
              </button>
              <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                Update payment method, view invoices, or cancel — all in the Stripe billing portal.
              </p>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#374151' }}>Free Plan</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '3px' }}>Basic scan and score. Upgrade to unlock the full toolkit.</div>
                </div>
                <span style={{ background: '#e5e7eb', color: '#6b7280', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '99px', letterSpacing: '0.05em' }}>FREE</span>
              </div>

              {/* Founding Member featured card */}
              <div style={{ background: 'linear-gradient(135deg, #2e1065 0%, #5b21b6 100%)', borderRadius: '16px', padding: '20px 22px', marginBottom: '12px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, background: '#f59e0b', color: '#1a0533', fontSize: '10px', fontWeight: 900, padding: '4px 10px', borderBottomLeftRadius: '10px', letterSpacing: '0.05em' }}>
                  LIMITED TIME
                </div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#fcd34d', letterSpacing: '0.1em', marginBottom: '6px' }}>
                  ⚡ FOUNDING MEMBER
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: 'white' }}>$249</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>one time · yours forever</span>
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '14px', lineHeight: 1.5 }}>
                  Full Pro access, no monthly bill, ever. Only 50 spots available — once they're gone, this price is gone.
                </div>
                <button
                  onClick={onUpgrade}
                  style={{ background: '#f59e0b', color: '#1a0533', border: 'none', borderRadius: '10px', padding: '11px 20px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(245,158,11,0.4)' }}
                >
                  <Zap size={15} fill="#1a0533" /> Claim Your Founding Member Spot →
                </button>
              </div>

              {/* Standard Pro upgrade card */}
              <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1.5px solid #ddd6fe', borderRadius: '14px', padding: '20px 24px', marginBottom: '4px' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#5b21b6', marginBottom: '12px' }}>Upgrade to Pro — $29/mo</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                  {['Weekly automated re-scans', 'Score change email alerts', 'Competitor tracking', 'AI content writer', 'Full code snippet library'].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#374151' }}>
                      <CheckCircle size={15} style={{ color: '#7c3aed', flexShrink: 0 }} />
                      {item}
                    </div>
                  ))}
                </div>
                <button
                  onClick={onUpgrade}
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', width: '100%' }}
                >
                  Upgrade to Pro →
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── CHANGE PASSWORD ── */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '28px 32px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Shield size={18} style={{ color: '#7c3aed' }} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111827' }}>Change Password</h2>
          </div>

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>New password</label>
              <input
                type="password"
                value={pwNew}
                onChange={e => setPwNew(e.target.value)}
                placeholder="At least 8 characters"
                required
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = '#7c3aed')}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Confirm new password</label>
              <input
                type="password"
                value={pwConfirm}
                onChange={e => setPwConfirm(e.target.value)}
                placeholder="Repeat your new password"
                required
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = '#7c3aed')}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>

            {pwMessage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '10px', background: pwMessage.type === 'ok' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${pwMessage.type === 'ok' ? '#86efac' : '#fca5a5'}` }}>
                {pwMessage.type === 'ok'
                  ? <CheckCircle size={15} style={{ color: '#16a34a', flexShrink: 0 }} />
                  : <AlertCircle size={15} style={{ color: '#dc2626', flexShrink: 0 }} />}
                <span style={{ fontSize: '13px', fontWeight: 600, color: pwMessage.type === 'ok' ? '#16a34a' : '#dc2626' }}>{pwMessage.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={pwLoading}
              style={{ alignSelf: 'flex-start', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', padding: '11px 22px', fontSize: '14px', fontWeight: 700, cursor: pwLoading ? 'not-allowed' : 'pointer', opacity: pwLoading ? 0.7 : 1 }}
            >
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* ── SIGN OUT ── */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '24px 32px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#374151' }}>Sign out</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>You'll need to sign back in to access your dashboard.</div>
          </div>
          <button
            onClick={onSignOut}
            style={{ background: 'white', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </div>

        {/* ── DANGER ZONE ── */}
        <div style={{ border: '1.5px solid #fca5a5', borderRadius: '20px', padding: '24px 32px', background: '#fff' }}>
          <button
            onClick={() => setShowDeleteZone(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%', textAlign: 'left' }}
          >
            <Trash2 size={17} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444' }}>Delete Account</span>
            <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#9ca3af' }}>{showDeleteZone ? 'Hide' : 'Show'}</span>
          </button>

          {showDeleteZone && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ margin: '0 0 14px', fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
                This will permanently delete your account and all scan history. This cannot be undone.
              </p>
              <p style={{ margin: '0 0 18px', fontSize: '14px', color: '#6b7280' }}>
                To delete your account, email us at{' '}
                <a href="mailto:hello@findmewith.ai" style={{ color: '#ef4444', fontWeight: 700, textDecoration: 'none' }}>
                  hello@findmewith.ai
                </a>{' '}
                and we'll take care of it within 24 hours.
              </p>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#b91c1c', fontWeight: 600 }}>All your scan history will be permanently erased.</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
