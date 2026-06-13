import React, { useState, useEffect } from 'react';
import { HeroStep } from './components/HeroStep';
import { EmailGate } from './components/EmailGate';
import { ScoreStep } from './components/ScoreStep';
import { ContentStep } from './components/ContentStep';
import { CodeStep } from './components/CodeStep';
import { PricingPage } from './components/PricingPage';
import { Nav } from './components/Nav';
import type { AnalysisResult } from './types';

type AppStep = 'home' | 'gate' | 'score' | 'content' | 'code' | 'pricing';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://findmewithai-production.up.railway.app';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('home');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [siteUrl, setSiteUrl] = useState('');
  const [isPro, setIsPro] = useState(() => localStorage.getItem('fmw_pro') === 'true');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('fmw_email') || '');

  // Scroll to top on every step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [step]);

  // On load: handle Stripe redirect OR verify existing subscription
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('payment') === 'success') {
      const sessionId = params.get('session_id');
      window.history.replaceState({}, '', '/');

      if (sessionId) {
        // Verify the real Stripe session
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
            // Fallback: trust the redirect if API fails
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

  // On load: if we have an email, re-verify subscription with server (catches cancellations + bypasses)
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
          // Subscription not active — clear pro status
          setIsPro(false);
          localStorage.setItem('fmw_pro', 'false');
        }
      })
      .catch(() => {}); // Silently ignore network errors — keep cached value
  }, []);

  useEffect(() => {
    localStorage.setItem('fmw_pro', String(isPro));
  }, [isPro]);

  useEffect(() => {
    localStorage.setItem('fmw_email', userEmail);
  }, [userEmail]);

  const handleAnalyzed = (r: AnalysisResult, url: string) => {
    setResult(r);
    setSiteUrl(url);
    setStep('gate');
  };

  const handleEmailSubmit = async (email: string) => {
    setUserEmail(email);
    localStorage.setItem('fmw_email', email);
    // Persist lead server-side
    fetch(`${BACKEND}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, url: siteUrl, score: result?.score ?? 0 }),
    }).catch(() => {});
    setStep('score');
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

  const showNav = step !== 'home' && step !== 'gate' && step !== 'pricing';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-white)' }}>
      {showNav && (
        <Nav
          step={step}
          isPro={isPro}
          siteUrl={siteUrl}
          onNavigate={(s) => setStep(s as AppStep)}
          onNewCheck={handleNewCheck}
          onUpgrade={handleUpgrade}
          onManageSubscription={handleManageSubscription}
        />
      )}
      {step === 'home' && <HeroStep onAnalyzed={handleAnalyzed} />}
      {step === 'gate' && result && (
        <EmailGate score={result.score} siteUrl={siteUrl} onSubmit={handleEmailSubmit} />
      )}
      {step === 'score' && result && (
        <ScoreStep
          result={result}
          onFixContent={() => setStep('content')}
          onGetCode={() => setStep('code')}
          onUpgrade={handleUpgrade}
          isPro={isPro}
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
