import React, { useState } from 'react';
import { Lock, Search, Eye, EyeOff } from 'lucide-react';

interface Props {
  score: number;
  siteUrl: string;
  onSignUp: (email: string, password: string) => Promise<void>;
  onGoToLogin: () => void;
}

const PREVIEW_ROWS = [
  { label: 'What ChatGPT actually sees about you', pct: 40 },
  { label: 'Why competitors rank above you in AI results', pct: 65 },
  { label: 'Your quickest win — less than 15 mins', pct: 28 },
  { label: 'The one thing holding your score back', pct: 75 },
];

function getScoreColor(score: number) {
  if (score >= 71) return '#16a34a';
  if (score >= 41) return '#d97706';
  return '#dc2626';
}

function getScoreLabel(score: number) {
  if (score >= 71) return { emoji: '🟢', text: "You're being found!" };
  if (score >= 41) return { emoji: '🟡', text: 'Getting there — room to grow' };
  return { emoji: '🔴', text: 'Not found yet — lots of opportunity' };
}

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: '', color: '#e5e7eb', width: '0%' };
  if (pw.length < 6) return { label: 'Too short', color: '#ef4444', width: '25%' };
  if (pw.length < 10) return { label: 'Fair', color: '#f59e0b', width: '55%' };
  if (/[^a-zA-Z0-9]/.test(pw) || /[A-Z]/.test(pw)) return { label: 'Strong', color: '#16a34a', width: '100%' };
  return { label: 'Good', color: '#7c3aed', width: '75%' };
}

export const EmailGate: React.FC<Props> = ({ score, siteUrl, onSignUp, onGoToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const domain = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const { emoji, text } = getScoreLabel(score);
  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSignUp(email.trim(), password);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #ede9fe 0%, #ffffff 55%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '36px' }}>
        <div style={{ width: '30px', height: '30px', background: '#7c3aed', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Search size={15} color="white" />
        </div>
        <span style={{ fontWeight: 800, fontSize: '16px', color: '#7c3aed' }}>findmewith.ai</span>
      </div>

      <div style={{ maxWidth: '460px', width: '100%' }}>

        {/* Score preview card */}
        <div style={{
          background: 'white',
          border: '1px solid #ddd6fe',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '16px',
          textAlign: 'center',
          boxShadow: '0 8px 40px rgba(124,58,237,0.10)',
        }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
            Scan complete for <strong style={{ color: '#111827' }}>{domain}</strong>
          </div>
          <div style={{ fontSize: '72px', fontWeight: 900, color: getScoreColor(score), lineHeight: 1, margin: '8px 0 4px' }}>
            {score}<span style={{ fontSize: '28px', fontWeight: 600 }}>%</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
            {emoji} {text}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            AI search engines know <strong>{score}%</strong> of your business
          </div>

          {/* Blurred preview */}
          <div style={{ marginTop: '20px', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none', padding: '12px', background: '#f5f3ff' }}>
              {PREVIEW_ROWS.map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #ddd6fe' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>{row.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '70px', height: '6px', background: '#ddd6fe', borderRadius: '99px' }}>
                      <div style={{ width: `${row.pct}%`, height: '100%', background: '#7c3aed', borderRadius: '99px' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600, width: '28px' }}>{row.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Lock size={18} style={{ color: '#7c3aed' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed' }}>Unlock your full breakdown below</span>
            </div>
          </div>
        </div>

        {/* Signup card */}
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        }}>
          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex' }}>
              {['#f59e0b', '#7c3aed', '#059669', '#3b82f6'].map((color, i) => (
                <div key={i} style={{ width: '28px', height: '28px', borderRadius: '50%', background: color, border: '2px solid white', marginLeft: i > 0 ? '-8px' : '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'white', fontWeight: 700 }}>
                  {['J', 'M', 'S', 'A'][i]}
                </div>
              ))}
            </div>
            <div style={{ fontSize: '12px', color: '#374151', fontWeight: 600 }}>
              <strong style={{ color: '#7c3aed' }}>1,200+</strong> business owners already scanned
            </div>
            <div style={{ display: 'flex', gap: '1px' }}>
              {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ color: '#f59e0b', fontSize: '13px' }}>★</span>)}
            </div>
          </div>

          <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>
            Create your free account to unlock your results
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px', lineHeight: 1.55 }}>
            No credit card. We'll also check in weekly as your AI visibility score changes.
          </p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '10px 14px', color: '#991b1b', fontSize: '13px', marginBottom: '12px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="email"
              style={{ padding: '12px 16px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', width: '100%', transition: 'border-color 0.2s' }}
              placeholder="you@yourbusiness.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onFocus={e => e.currentTarget.style.borderColor = '#7c3aed'}
              onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              required
            />

            <div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  style={{ padding: '12px 44px 12px 16px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', width: '100%', transition: 'border-color 0.2s' }}
                  placeholder="Create a password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  onFocus={e => e.currentTarget.style.borderColor = '#7c3aed'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0', display: 'flex', alignItems: 'center' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength bar */}
              {password.length > 0 && (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ height: '3px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: '99px', transition: 'width 0.3s, background 0.3s' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: strength.color, fontWeight: 600, marginTop: '3px', display: 'block' }}>{strength.label}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '15px',
                height: '48px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 2px 12px rgba(124,58,237,0.25)',
                marginTop: '2px',
              }}
            >
              {loading ? 'Creating account…' : 'Show Me What to Fix →'}
            </button>
          </form>

          {/* Testimonial */}
          <div style={{ marginTop: '18px', background: '#f5f3ff', borderRadius: '12px', padding: '14px 16px', borderLeft: '3px solid #7c3aed' }}>
            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
              "I had no idea ChatGPT couldn't find my business. Fixed the top 3 things on the list and my phone started ringing differently within a week."
            </p>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#7c3aed', fontWeight: 700 }}>— Sarah M., interior designer</div>
          </div>

          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '14px', lineHeight: 1.5, textAlign: 'center' }}>
            🔒 Free account. No credit card. No spam.
          </p>

          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Already have an account? </span>
            <button
              onClick={onGoToLogin}
              style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '13px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              Log in →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
