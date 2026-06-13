import React from 'react';
import { Lock, Star } from 'lucide-react';

interface Props {
  feature: string;
  onUpgrade: () => void;
}

export const LockOverlay: React.FC<Props> = ({ feature, onUpgrade }) => (
  <div style={{
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(245, 243, 255, 0.88)',
    backdropFilter: 'blur(5px)',
    borderRadius: '16px',
    zIndex: 10,
    padding: '24px',
    textAlign: 'center',
  }}>
    <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
      <Lock size={20} color="white" />
    </div>
    <div style={{ fontSize: '16px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>
      {feature} is a Pro feature
    </div>
    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px', maxWidth: '260px', lineHeight: 1.55 }}>
      Upgrade to Pro and get unlimited content writing, all code snippets, and weekly site monitoring.
    </div>
    <button
      onClick={onUpgrade}
      style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', padding: '10px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
    >
      <Star size={14} fill="white" /> Upgrade to Pro — $29/mo
    </button>
    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '10px' }}>7-day free trial · Cancel any time</div>
  </div>
);
