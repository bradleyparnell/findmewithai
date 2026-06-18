import React from 'react';
import { Lock, Zap } from 'lucide-react';

interface Props {
  feature: string;
  onUpgrade: () => void;
}

export const LockOverlay: React.FC<Props> = ({ feature, onUpgrade }) => (
  <div style={{
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(245, 243, 255, 0.92)',
    backdropFilter: 'blur(5px)',
    borderRadius: '16px',
    zIndex: 10,
    padding: '28px 24px',
    textAlign: 'center',
  }}>
    {/* Lock icon */}
    <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
      <Lock size={20} color="white" />
    </div>

    {/* Feature name */}
    <div style={{ fontSize: '16px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>
      {feature} is a Pro feature
    </div>

    {/* Founding member pitch */}
    <div style={{
      background: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 100%)',
      borderRadius: '14px',
      padding: '16px 20px',
      margin: '14px 0 16px',
      width: '100%',
      maxWidth: '300px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 800, color: '#fcd34d', letterSpacing: '0.1em', marginBottom: '6px' }}>
        ⚡ FOUNDING MEMBER — 50 SPOTS ONLY
      </div>
      <div style={{ fontSize: '22px', fontWeight: 900, color: 'white', marginBottom: '2px' }}>
        $249 <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>one time</span>
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginBottom: '14px' }}>
        Full Pro access, forever. No monthly bill.
      </div>
      <button
        onClick={onUpgrade}
        style={{
          background: '#f59e0b',
          color: '#1a0533',
          border: 'none',
          borderRadius: '10px',
          fontWeight: 800,
          fontSize: '14px',
          padding: '11px 20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          width: '100%',
          justifyContent: 'center',
        }}
      >
        <Zap size={14} fill="#1a0533" /> Claim Your Spot →
      </button>
    </div>

    {/* Secondary monthly option */}
    <div style={{ fontSize: '12px', color: '#6b7280' }}>
      Or start at{' '}
      <button
        onClick={onUpgrade}
        style={{ background: 'none', border: 'none', color: '#7c3aed', fontWeight: 700, fontSize: '12px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
      >
        $29/mo
      </button>
      {' '}— cancel any time
    </div>
  </div>
);
