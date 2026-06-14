import React, { useState } from 'react';
import { Mail, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  email: string;
  siteUrl: string;
  score: number;
}

export const InboxStep: React.FC<Props> = ({ email, siteUrl, score }) => {
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

        {/* Envelope animation */}
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
          Check your inbox ✉️
        </h1>
        <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.65, marginBottom: '8px' }}>
          We sent a login link to
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
          Click the link in that email and we'll bring you straight back here to see exactly how <strong style={{ color: '#111827' }}>{domain}</strong> scores — and what to fix first.
        </p>

        {/* Score teaser */}
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
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Full breakdown, action plan, and fixes waiting for you inside</div>
          </div>
        </div>

        {/* Resend */}
        {!resent ? (
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              background: 'transparent',
              border: '1.5px solid #e5e7eb',
              borderRadius: '10px',
              padding: '10px 20px',
              fontSize: '13px',
              color: '#6b7280',
              cursor: resending ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {resending ? 'Sending…' : "Didn't get it? Resend the link"}
          </button>
        ) : (
          <p style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>
            ✅ Sent! Check your inbox again (and your spam folder just in case).
          </p>
        )}

        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '20px' }}>
          The link expires in 1 hour. Need help? <a href="mailto:hello@genierocket.com" style={{ color: '#7c3aed' }}>hello@genierocket.com</a>
        </p>
      </div>
    </div>
  );
};
