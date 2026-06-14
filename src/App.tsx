import React, { useState, useEffect } from 'react';
import { HeroStep } from './components/HeroStep';
import { EmailGate } from './components/EmailGate';
import { InboxStep } from './components/InboxStep';
import { ScoreStep } from './components/ScoreStep';
import { ContentStep } from './components/ContentStep';
import { CodeStep } from './components/CodeStep';
import { PricingPage } from './components/PricingPage';
import { Dashboard } from './components/Dashboard';
import { Nav } from './components/Nav';
import { supabase } from './lib/supabase';
import type { AnalysisResult } from './types';

type AppStep = 'home' | 'gate' | 'inbox' | 'score' | 'content' | 'code' | 'pricing' | 'dashboard';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://findmewithai-production.up.railway.app';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('home');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [siteUrl, setSiteUrl] = useState('');
  const [isPro, setIsPro] = useState(() => localStorage.getItem('fmw_pro') === 'true');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('fmw_email') || '');
  const [user, setUser] = useState<any>(null);

  // Scroll to top on every step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [step]);

  // Supabase auth state listener
  useEffect(() => {
    // Get current session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setUserEmail(session.user.email || '');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setUserEmail(session.user.email || '');
        localStorage.setItem('fmw_email', session.user.email || '');

        // Save any pending scan
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
          } catch (_e) { /* silently ignore */ }
        }

        // If we landed here via magic link click, restore result and show score page
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState({}, '', '/');

          // Try to restore the pending scan result
          if (pendingRaw) {
            try {
              const pending = JSON.parse(pendingRaw);
              setResult(pending.result as AnalysisResult);
              setSiteUrl(pending.url);
              localStorage.removeItem('fmw_pending_scan');
              setStep('score');
              return;
            } catch (_e) { /* fall through to dashboard */ }
          }

          // No pending scan — go straight to dashboard
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

  const handleAnalyzed = (r: AnalysisResult, url: string) => {
    setResult(r);
    setSiteUrl(url);
    setStep('gate');
  };

  const handleEmailSubmit = async (email: string) => {
    setUserEmail(email);
    localStorage.setItem('fmw_email', email);

    // Store scan so it can be shown and saved after they click the magic link
    if (result) {
      localStorage.setItem('fmw_pending_scan', JSON.stringify({
        url: siteUrl,
        score: result.score,
        result,
      }));
    }

    // Send magic link
    supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    }).catch(() => {});

    // Persist lead server-side
    fetch(`${BACKEND}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, url: siteUrl, score: result?.score ?? 0 }),
    }).catch(() => {});

    // Show the "check your inbox" screen — results wait until login
    setStep('inbox');
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

  const showNav = !['home', 'gate', 'inbox', 'pricing'].includes(step);

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
      {step === 'home' && <HeroStep onAnalyzed={handleAnalyzed} />}
      {step === 'gate' && result && (
        <EmailGate score={result.score} siteUrl={siteUrl} onSubmit={handleEmailSubmit} />
      )}
      {step === 'inbox' && (
        <InboxStep email={userEmail} siteUrl={siteUrl} score={result?.score ?? 0} />
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
      {step === 'dashboard' && user && (
        <Dashboard
          user={user}
          isPro={isPro}
          onViewScan={handleViewScan}
          onNewScan={handleNewCheck}
          onUpgrade={handleUpgrade}
          onSignOut={handleSignOut}
        />
      )}
      <footer style={{
        textAlign: 'center',
        padding: '24px 16px',
        color: '#9ca3af',
        fontSize: '13px',
        borderTop: '1px solid #f3f4f6',
        marginTop: 'auto',
      }}>
        © {new Date().getFullYear()} findmewith.ai — All rights reserved.
      </footer>
    </div>
  );
};

export default App;
