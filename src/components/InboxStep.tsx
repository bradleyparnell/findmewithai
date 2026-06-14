import React, { useState } from 'react';
import { Mail, Search, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  email: string;
  siteUrl: string;
  score: number;
  linkExpired?: boolean;
  onResent?: () => void;
}

export const InboxStep: React.FC<Props> = ({ email, siteUrl, score, linkExpired = false, onResent }) => {
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const domain = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const handleResend = async () => {
    setResending(true);
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    }).catch(() => {});
    setResending(false);
    setResent(true);
    onResent?.();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #ede9fe 0%, #ffffff 60%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '48px' }}>
        <div style={{ width: '30px', height: '30px', background: '#7c3aed', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Search size={15} color="white" />
        </div>
        <span style={{ fontWeight: 800, fontSize: '16px', color: '#7c3aed' }}>findmewith.ai</span>
      </div>

      <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>

        {/* Expired banner */}
        {linkExpired && !resent && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textAlign: 'left',
          }}>
            <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400e' }}>That link expired</div>
              <div style={{ fontSize: '12px', color: '#78350f', marginTop: '2px' }}>
                Links are only valid for 1 hour. Hit the button below to get a fresh one.
              </div>
            </div>
          </div>
        )}

        {/* Envelope icon */}
        <div style={{
          width: '80px',
          height: '80px',
          background: 'white',
          border: '2px solid #ddd6fe',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 32px rgba(124,58,237,0.12)',
        }}>
          <Mail size={36} color="#7c3aed" />
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#111827', marginBottom: '10px', lineHeight: 1.25 }}>
          {linkExpired && !resent ? 'Get a new login link' : 'Check your inbox ✉️'}
        </h1>
        <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.65, marginBottom: '8px' }}>
          {resent ? 'New link sent to' : 'We sent a login link to'}
        </p>
        <p style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#7c3aed',
          background: '#f5f3ff',
          border: '1px solid #ddd6fe',
          borderRadius: '10px',
          padding: '8px 16px',
          display: 'inline-block',
          marginBottom: '16px',
        }}>
          {email}
        </p>
        <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.65, marginBottom: '32px' }}>
          Click the link in that email and we'll bring you straight back here to see exactly how{' '}
          {domain && <strong style={{ color: '#111827' }}>{domain}</strong>} scores — and what to fix first.
        </p>

        {/* Score teaser */}
        {score > 0 && (
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '20px',
            padding: '20px 24px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: '4px solid #7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#7c3aed' }}>{score}%</span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Your AI visibility score is ready</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Full breakdown, action plan, and fixes waiting inside</div>
            </div>
          </div>
        )}

        {/* Resend / sent */}
        {!resent ? (
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              background: linkExpired ? '#7c3aed' : 'transparent',
              border: linkExpired ? 'none' : '1.5px solid #e5e7eb',
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: '14px',
              color: linkExpired ? 'white' : '#6b7280',
              cursor: resending ? 'not-allowed' : 'pointer',
              fontWeight: 700,
            }}
          >
            {resending ? 'Sending…' : linkExpired ? 'Send me a new link' : "Didn't get it? Resend the link"}
          </button>
        ) : (
          <p style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>
            ✅ New link sent! Check your inbox (and your spam folder just in case).
          </p>
        )}

        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '20px' }}>
          Links expire after 1 hour. Need help?{' '}
          <a href="mailto:hello@genierocket.com" style={{ color: '#7c3aed' }}>hello@genierocket.com</a>
        </p>
      </div>
    </div>
  );
};
