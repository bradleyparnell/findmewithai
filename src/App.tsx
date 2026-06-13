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

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('home');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [siteUrl, setSiteUrl] = useState('');
  const [isPro, setIsPro] = useState(() => localStorage.getItem('fmw_pro') === 'true');

  useEffect(() => {
    localStorage.setItem('fmw_pro', String(isPro));
  }, [isPro]);

  const handleAnalyzed = (r: AnalysisResult, url: string) => {
    setResult(r);
    setSiteUrl(url);
    setStep('gate');
  };

  const handleEmailSubmit = async (email: string) => {
    // Persist lead server-side
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, url: siteUrl, score: result?.score ?? 0 }),
    }).catch(() => {});
    setStep('score');
  };

  const handleUpgrade = () => setStep('pricing');

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
