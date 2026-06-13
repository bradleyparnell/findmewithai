import React, { useState } from 'react';
import { Mail, Lock, Search } from 'lucide-react';

interface Props {
  score: number;
  siteUrl: string;
  onSubmit: (email: string) => void;
}

const PREVIEW_ROWS = [
  { label: 'Business Info Cards', pct: 40 },
  { label: 'Your Content', pct: 65 },
  { label: 'Your Online Identity', pct: 28 },
  { label: 'Website Health', pct: 75 },
];

function getScoreColor(score: number) {
  if (score >= 80) return '#7c3aed';
  if (score >= 60) return '#6d28d9';
  if (score >= 40) return '#d97706';
  return '#ef4444';
}

function getScoreLabel(score: number) {
  if (score >= 80) return { emoji: '🎉', text: "You're doing great!" };
  if (score >= 60) return { emoji: '👍', text: 'Room to improve' };
  if (score >= 40) return { emoji: '🌱', text: 'Some work to do' };
  return { emoji: '💪', text: 'Lots of opportunity here' };
}

export const EmailGate: React.FC<Props> = ({ score, siteUrl, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const domain = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const { emoji, text } = getScoreLabel(score);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    await onSubmit(email);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #ede9fe 0%, #ffffff 55%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '36px' }}>
        <div style={{ width: '30px', height: '30px', background: '#7c3aed', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Search size={15} color="white" />
        </div>
        <span style={{ fontWeight: 800, fontSize: '16px', color: '#7c3aed' }}>findmewith.ai</span>
      </div>

      <div style={{ maxWidth: '460px', width: '100%' }}>
        <div style={{ background: 'white', border: '1px solid #ddd6fe', borderRadius: '24px', padding: '32px', marginBottom: '16px', textAlign: 'center', boxShadow: '0 8px 40px rgba(124, 58, 237, 0.10)' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
            Scan complete for <strong style={{ color: '#111827' }}>{domain}</strong>
          </div>
          <div style={{ fontSize: '72px', fontWeight: 900, color: getScoreColor(score), lineHeight: 1, margin: '8px 0 4px' }}>
            {score}<span style={{ fontSize: '28px', fontWeight: 600 }}>%</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>{emoji} {text}</div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            AI search engines know <strong>{score}%</strong> of your business
          </div>

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

        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>See your full results — free</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px', lineHeight: 1.55 }}>
            We'll show you exactly what to fix and give you simple tools to do it.
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="email"
              style={{ padding: '12px 16px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none' }}
              placeholder="you@yourbusiness.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              required
            />
            {error && <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', height: '48px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Loading…' : 'See My Full Results →'}
            </button>
          </form>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px', lineHeight: 1.5, textAlign: 'center' }}>
            🔒 No spam. Occasional AI visibility tips only. Unsubscribe any time.
          </p>
        </div>
      </div>
    </div>
  );
};
