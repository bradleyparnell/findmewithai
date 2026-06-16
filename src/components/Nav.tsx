import React from 'react';
import { Search, Star, Settings, LayoutDashboard } from 'lucide-react';

interface Props {
  step: string;
  isPro: boolean;
  siteUrl: string;
  user?: any;
  onNavigate: (step: string) => void;
  onNewCheck: () => void;
  onUpgrade: () => void;
  onManageSubscription: () => void;
  onDashboard: () => void;
}

export const Nav: React.FC<Props> = ({ step, isPro, siteUrl, user, onNavigate, onNewCheck, onUpgrade, onManageSubscription, onDashboard }) => {
  const steps = [
    { id: 'score', label: 'Score' },
    { id: 'content', label: 'Content' },
    { id: 'code', label: 'Code' },
  ];

  const domain = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <nav style={{ borderBottom: '1px solid #ddd6fe', background: 'white', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 12px rgba(124, 58, 237, 0.05)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={onNewCheck} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginRight: '4px' }}>
          <div style={{ width: '26px', height: '26px', background: '#7c3aed', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Search size={13} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '14px', color: '#7c3aed', letterSpacing: '-0.2px' }}>findmewith.ai</span>
        </button>

        <div style={{ display: 'flex', gap: '3px', flex: 1 }}>
          {steps.map(s => (
            <button
              key={s.id}
              onClick={() => onNavigate(s.id)}
              style={{
                padding: '5px 13px', borderRadius: '20px', border: 'none', fontSize: '12px',
                fontWeight: step === s.id ? 700 : 500, cursor: 'pointer',
                background: step === s.id ? '#7c3aed' : 'transparent',
                color: step === s.id ? 'white' : '#6b7280',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {domain && <span style={{ fontSize: '11px', color: '#9ca3af', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{domain}</span>}

          {/* Dashboard link for logged-in users */}
          {user && (
            <button
              onClick={onDashboard}
              title="My Dashboard"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                background: step === 'dashboard' ? '#7c3aed' : '#f5f3ff',
                color: step === 'dashboard' ? 'white' : '#7c3aed',
                borderRadius: '100px', padding: '4px 11px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer'
              }}
            >
              <LayoutDashboard size={11} /> My Dashboard
            </button>
          )}

          {isPro ? (
            <button
              onClick={onManageSubscription}
              title="Manage your subscription"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#d97706', borderRadius: '100px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              <Star size={10} fill="currentColor" /> PRO <Settings size={9} style={{ opacity: 0.7 }} />
            </button>
          ) : (
            <button onClick={onUpgrade} style={{ padding: '5px 13px', borderRadius: '20px', border: '1.5px solid #7c3aed', background: 'transparent', color: '#7c3aed', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Upgrade
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
