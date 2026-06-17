import React, { useState, useEffect } from 'react';
import { HeroStep } from './components/HeroStep';
import { EmailGate } from './components/EmailGate';
import { InboxStep } from './components/InboxStep';
import { ScoreStep } from './components/ScoreStep';
import { ContentStep } from './components/ContentStep';
import { CodeStep } from './components/CodeStep';
import { PricingPage } from './components/PricingPage';
import { Dashboard } from './components/Dashboard';
import { AuthPage } from './components/AuthPage';
import { AccountPage } from './components/AccountPage';
import { Nav } from './components/Nav';
import { ChatBot } from './components/ChatBot';
import { supabase } from './lib/supabase';
import type { AnalysisResult } from './types';

type AppStep = 'home' | 'gate' | 'inbox' | 'score' | 'content' | 'code' | 'pricing' | 'dashboard' | 'auth' | 'account';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://findmewithai-production.up.railway.app';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('home');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [siteUrl, setSiteUrl] = useState('');
  const [isPro, setIsPro] = useState(() => localStorage.getItem('fmw_pro') === 'true');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('fmw_email') || '');
  const [user, setUser] = useState<any>(null);
  const [linkExpired, setLinkExpired] = useState(false);

  // Scroll to top on every step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [step]);

  // Supabase auth state listener
  useEffect(() => {
    // Detect error hash (e.g. expired magic link) before Supabase clears it
    const hash = window.location.hash;
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const errorCode = params.get('error_code') || '';
      window.history.replaceState({}, '', '/');
      if (errorCode === 'otp_expired' || params.get('error') === 'access_denied') {
        // Show inbox step with expired flag so user can request a new link
        setStep('inbox');
        setLinkExpired(true);
      }
      return;
    }

    // Get current session on load — if already logged in, go straight to dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setUserEmail(session.user.email || '');
        setStep('dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setUserEmail(session.user.email || '');
        localStorage.setItem('fmw_email', session.user.email || '');

        // SIGNED_IN fires when the user actually clicks a magic link
        // INITIAL_SESSION fires on page load when already logged in — don't redirect
        if (event === 'SIGNED_IN') {
          window.history.replaceState({}, '', '/');

          // Save any pending scan (from localStorage, same browser)
          const pendingRaw = localStorage.getItem('fmw_pending_scan');
          if (pendingRaw) {
            try {
              const pending = JSON.parse(pendingRaw);
              await supabase.from('scans').insert({
                user_id: session.user.id,
                email: session.user.email,
                url: pending.url,
                score: pending.score,
                result: pending.result,
              });
              localStorage.removeItem('fmw_pending_scan');
            } catch (_e) { /* fall through */ }
          }

          // Always land on dashboard — it loads the latest scan itself
          setStep('dashboard');
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // On load: handle Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('payment') === 'success') {
      const sessionId = params.get('session_id');
      window.history.replaceState({}, '', '/');

      if (sessionId) {
        fetch(`${BACKEND}/api/verify-session?session_id=${sessionId}`)
          .then(r => r.json())
          .then(data => {
            if (data.ok) {
              setIsPro(true);
              localStorage.setItem('fmw_pro', 'true');
              if (data.email) {
                setUserEmail(data.email);
                localStorage.setItem('fmw_email', data.email);
              }
            }
          })
          .catch(() => {
            setIsPro(true);
            localStorage.setItem('fmw_pro', 'true');
          });
      } else {
        setIsPro(true);
        localStorage.setItem('fmw_pro', 'true');
      }

      setStep('score');
      return;
    }

    if (params.get('payment') === 'cancelled') {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // On load: re-verify subscription with server
  useEffect(() => {
    const email = localStorage.getItem('fmw_email');
    if (!email) return;
    fetch(`${BACKEND}/api/check-subscription?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.active) {
          setIsPro(true);
          localStorage.setItem('fmw_pro', 'true');
        } else {
          setIsPro(false);
          localStorage.setItem('fmw_pro', 'false');
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => { localStorage.setItem('fmw_pro', String(isPro)); }, [isPro]);
  useEffect(() => { localStorage.setItem('fmw_email', userEmail); }, [userEmail]);

  const handleAnalyzed = async (r: AnalysisResult, url: string) => {
    setResult(r);
    setSiteUrl(url);

    // If already logged in, save the scan and go straight to score — no email gate
    if (user) {
      try {
        await supabase.from('scans').insert({
          user_id: user.id,
          email: user.email,
          url,
          score: r.score,
          result: r,
        });
      } catch { /* non-fatal */ }
      setStep('score');
    } else {
      setStep('gate');
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    setUserEmail(email);
    localStorage.setItem('fmw_email', email);

    // Store scan so it can be saved once the user is authenticated
    if (result) {
      localStorage.setItem('fmw_pending_scan', JSON.stringify({
        url: siteUrl,
        score: result.score,
        result,
      }));
    }

    // Persist lead server-side
    fetch(`${BACKEND}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, url: siteUrl, score: result?.score ?? 0 }),
    }).catch(() => {});

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      // Surface error to the EmailGate component
      throw signUpError;
    }

    // Send branded welcome email (fire-and-forget, non-blocking)
    fetch(`${BACKEND}/api/welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, url: siteUrl, score: result?.score ?? 0 }),
    }).catch(() => {});

    if (data.session) {
      // Email confirmation disabled — user is logged in immediately.
      // onAuthStateChange SIGNED_IN fires and handles navigation to dashboard.
    } else {
      // Email confirmation required — tell user to check inbox.
      setStep('inbox');
    }
  };

  const handleUpgrade = () => setStep('pricing');

  const handleManageSubscription = async () => {
    const email = localStorage.getItem('fmw_email');
    if (!email) { alert('Please re-scan your site first so we know your account email.'); return; }
    try {
      const res = await fetch(`${BACKEND}/api/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { alert('Could not open billing portal. Email hello@genierocket.com for help.'); }
    } catch {
      alert('Could not open billing portal. Email hello@genierocket.com for help.');
    }
  };

  const handleProActivated = () => {
    setIsPro(true);
    setStep(result ? 'score' : 'home');
  };

  const handleNewCheck = () => {
    setStep('home');
    setResult(null);
    setSiteUrl('');
  };

  const handleViewScan = (scan: any) => {
    setResult(scan.result as AnalysisResult);
    setSiteUrl(scan.url);
    setStep('score');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStep('home');
  };

  const showNav = !['home', 'gate', 'inbox', 'pricing', 'dashboard'].includes(step);

  // Account page — full screen, no App shell
  if (step === 'account' && user) {
    return (
      <AccountPage
        user={user}
        isPro={isPro}
        onBack={() => setStep('dashboard')}
        onUpgrade={handleUpgrade}
        onSignOut={handleSignOut}
      />
    );
  }

  // Dashboard gets its own full-screen layout — render it outside the App shell
  if (step === 'dashboard' && user) {
    return (
      <>
        <Dashboard
          user={user}
          isPro={isPro}
          onViewScan={handleViewScan}
          onNewScan={handleNewCheck}
          onUpgrade={handleUpgrade}
          onSignOut={handleSignOut}
          onAccount={() => setStep('account')}
        />
        <ChatBot />
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-white)' }}>
      {showNav && (
        <Nav
          step={step}
          isPro={isPro}
          siteUrl={siteUrl}
          user={user}
          onNavigate={(s) => setStep(s as AppStep)}
          onNewCheck={handleNewCheck}
          onUpgrade={handleUpgrade}
          onManageSubscription={handleManageSubscription}
          onDashboard={() => setStep('dashboard')}
        />
      )}
      {step === 'home' && (
        <HeroStep
          onAnalyzed={handleAnalyzed}
          user={user}
          onGoToDashboard={() => setStep('dashboard')}
          onGoToLogin={() => setStep('auth')}
        />
      )}
      {step === 'auth' && (
        <AuthPage onBack={() => setStep('home')} />
      )}
      {step === 'gate' && result && (
        <EmailGate
          score={result.score}
          siteUrl={siteUrl}
          onSignUp={handleSignUp}
          onGoToLogin={() => setStep('auth')}
        />
      )}
      {step === 'inbox' && (
        <InboxStep email={userEmail} siteUrl={siteUrl} score={result?.score ?? 0} linkExpired={linkExpired} onResent={() => setLinkExpired(false)} />
      )}
      {step === 'score' && result && (
        <ScoreStep
          result={result}
          onFixContent={() => setStep('content')}
          onGetCode={() => setStep('code')}
          onUpgrade={handleUpgrade}
          isPro={isPro}
          isAuthenticated={!!user}
        />
      )}
      {step === 'content' && (
        <ContentStep
          siteUrl={siteUrl}
          result={result}
          isPro={isPro}
          onUpgrade={handleUpgrade}
          onNext={() => setStep('code')}
        />
      )}
      {step === 'code' && (
        <CodeStep
          siteUrl={siteUrl}
          result={result}
          isPro={isPro}
          onUpgrade={handleUpgrade}
          onNewCheck={handleNewCheck}
        />
      )}
      {step === 'pricing' && (
        <PricingPage
          onBack={() => setStep(result ? 'score' : 'home')}
          onProActivated={handleProActivated}
          userEmail={userEmail}
          isPro={isPro}
          onManageSubscription={handleManageSubscription}
        />
      )}
      {/* Dashboard is rendered outside this shell (see early return above) */}
      <ChatBot />
      <footer style={{
        textAlign: 'center',
        padding: '24px 16px',
        color: '#9ca3af',
        fontSize: '13px',
        borderTop: '1px solid #f3f4f6',
        marginTop: 'auto',
      }}>
        © {new Date().getFullYear()} findmewith.ai — All rights reserved.
        <span style={{ margin: '0 8px' }}>·</span>
        <a href="mailto:hello@findmewith.ai" style={{ color: '#9ca3af', textDecoration: 'none' }}>hello@findmewith.ai</a>
        <span style={{ margin: '0 8px' }}>·</span>
        <a href="/privacy" style={{ color: '#9ca3af', textDecoration: 'none' }}>Privacy Policy</a>
        <span style={{ margin: '0 8px' }}>·</span>
        <a href="/terms" style={{ color: '#9ca3af', textDecoration: 'none' }}>Terms of Service</a>
      </footer>
    </div>
  );
};

export default App;
