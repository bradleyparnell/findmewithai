import React, { useState } from 'react';
import { Search, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  onBack: () => void;
}

export const AuthPage: React.FC<Props> = ({ onBack }) => {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setError(
        error.message.toLowerCase().includes('invalid')
          ? 'Incorrect email or password. Try again or reset your password below.'
          : error.message
      );
    }
    // Successful login is handled by App's onAuthStateChange → navigates to dashboard
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Done! Check your inbox for a password reset link.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(150deg, #ede9fe 0%, #ffffff 60%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '40px' }}>
        <div style={{ width: '34px', height: '34px', background: '#7c3aed', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Search size={17} color="white" />
        </div>
        <span style={{ fontWeight: 800, fontSize: '18px', color: '#7c3aed', letterSpacing: '-0.3px' }}>findmewith.ai</span>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px 44px',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 8px 48px rgba(124,58,237,0.10)',
        border: '1px solid #ede9fe',
      }}>
        {mode === 'login' ? (
          <>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', marginBottom: '6px', letterSpacing: '-0.5px' }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '28px', lineHeight: 1.5 }}>
              Log in to your findmewith.ai account
            </p>

            {success && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '12px 14px', color: '#166534', fontSize: '14px', marginBottom: '16px' }}>
                {success}
              </div>
            )}
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 14px', color: '#991b1b', fontSize: '14px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Email address
                </label>
                <input
                  type="email"
                  autoFocus
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@yourbusiness.com"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#7c3aed'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '12px 44px 12px 14px',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#7c3aed'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0', display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '16px',
                  height: '50px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.75 : 1,
                  marginTop: '4px',
                  letterSpacing: '-0.2px',
                  boxShadow: '0 2px 12px rgba(124,58,237,0.25)',
                  transition: 'background 0.2s',
                }}
              >
                {loading ? 'Logging in…' : 'Log In →'}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px' }}>
              <button
                onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Forgot password?
              </button>
              <button
                onClick={onBack}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', padding: 0 }}
              >
                ← Back to home
              </button>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>New here? </span>
              <button
                onClick={onBack}
                style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '14px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                Scan your site free →
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', marginBottom: '6px', letterSpacing: '-0.5px' }}>
              Reset your password
            </h1>
            <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '28px', lineHeight: 1.5 }}>
              Enter your email and we'll send a link to set a new password.
            </p>

            {success && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '16px', color: '#166534', fontSize: '15px', lineHeight: 1.5 }}>
                ✅ {success}
              </div>
            )}
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 14px', color: '#991b1b', fontSize: '14px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {!success && (
              <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    autoFocus
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@yourbusiness.com"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#7c3aed'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '16px',
                    height: '50px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.75 : 1,
                    boxShadow: '0 2px 12px rgba(124,58,237,0.25)',
                  }}
                >
                  {loading ? 'Sending…' : 'Send Reset Link →'}
                </button>
              </form>
            )}

            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0, marginTop: '20px', display: 'block' }}
            >
              ← Back to login
            </button>
          </>
        )}
      </div>

      <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '24px', textAlign: 'center' }}>
        Questions? Email us at{' '}
        <a href="mailto:hello@findmewith.ai" style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: 600 }}>
          hello@findmewith.ai
        </a>
      </p>
    </div>
  );
};
