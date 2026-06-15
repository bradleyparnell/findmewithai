import React, { useState } from 'react';
import { Mail, Search, AlertCircle, KeyRound } from 'lucide-react';
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
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
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

  const handleVerifyOtp = async () => {
    const code = otpCode.trim();
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setOtpError('Enter the 6-digit code from your email');
      return;
    }
    setVerifying(true);
    setOtpError('');
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    if (error) {
      setOtpError("That code didn't work. Double-check it, or request a new link below.");
      setVerifying(false);
    } else {
      setOtpVerified(true);
      // onAuthStateChange in App.tsx handles the redirect automatically
    }
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
          {otpVerified ? '✅ You\'re in!' : linkExpired && !resent ? 'Get a new login link' : 'Check your inbox ✉️'}
        </h1>
        {!otpVerified && (
          <>
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
          </>
        )}

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

        {/* OTP verified state */}
        {otpVerified ? (
          <p style={{ fontSize: '15px', color: '#059669', fontWeight: 700 }}>
            ✅ Verified! Loading your results…
          </p>
        ) : (
          <>
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
                  width: '100%',
                  marginBottom: '10px',
                }}
              >
                {resending ? 'Sending…' : linkExpired ? 'Send me a new link' : "Didn't get it? Resend the link"}
              </button>
            ) : (
              <p style={{ fontSize: '13px', color: '#059669', fontWeight: 600, marginBottom: '10px' }}>
                ✅ New link sent! Check your inbox (and spam, just in case).
              </p>
            )}

            {/* OTP fallback toggle */}
            {!showOtp && (
              <button
                onClick={() => setShowOtp(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '13px',
                  color: '#7c3aed',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: '4px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: '0 auto',
                }}
              >
                <KeyRound size={14} />
                Or enter the 6-digit code from the email
              </button>
            )}

            {/* OTP input */}
            {showOtp && (
              <div style={{
                background: '#f5f3ff',
                border: '1.5px solid #ddd6fe',
                borderRadius: '14px',
                padding: '18px',
                marginTop: '10px',
                textAlign: 'left',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <KeyRound size={16} color="#7c3aed" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#5b21b6' }}>Enter your code</span>
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', lineHeight: 1.5 }}>
                  Your email includes a 6-digit code you can type in here instead of clicking the link.
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1.5px solid ${otpError ? '#ef4444' : '#ddd6fe'}`,
                    borderRadius: '10px',
                    fontSize: '22px',
                    fontWeight: 800,
                    letterSpacing: '0.35em',
                    textAlign: 'center',
                    outline: 'none',
                    marginBottom: '8px',
                    boxSizing: 'border-box',
                  }}
                />
                {otpError && (
                  <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '8px' }}>{otpError}</p>
                )}
                <button
                  onClick={handleVerifyOtp}
                  disabled={verifying || otpCode.length !== 6}
                  style={{
                    width: '100%',
                    background: otpCode.length === 6 ? '#7c3aed' : '#e5e7eb',
                    color: otpCode.length === 6 ? 'white' : '#9ca3af',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: otpCode.length === 6 && !verifying ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                  }}
                >
                  {verifying ? 'Verifying…' : 'Verify code →'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Spam tip */}
        <div style={{ marginTop: '24px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', textAlign: 'left' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>📬 Not seeing it?</div>
          <div style={{ fontSize: '12px', color: '#78350f', lineHeight: 1.6 }}>
            Check your <strong>spam or junk folder</strong> — emails from new senders sometimes land there. Search for <em>"findmewith.ai"</em> if you're not sure.
          </div>
        </div>

        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '20px' }}>
          Links expire after 1 hour. Need help?{' '}
          <a href="mailto:hello@findmewithai.com" style={{ color: '#7c3aed' }}>hello@findmewithai.com</a>
        </p>
      </div>
    </div>
  );
};
