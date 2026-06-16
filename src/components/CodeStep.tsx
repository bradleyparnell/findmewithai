import React, { useState, useEffect } from 'react';
import { Copy, Check, Code2, Zap, RefreshCw, ShieldCheck, Lock } from 'lucide-react';
import { LockOverlay } from './LockOverlay';
import type { AnalysisResult } from '../types';

// ── Responsive hook ───────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

interface Props {
  siteUrl: string;
  result: AnalysisResult | null;
  scanId?: string;
  isPro: boolean;
  onUpgrade: () => void;
  onNewCheck: () => void;
}

function buildSnippets(siteUrl: string, result: AnalysisResult | null, scanId?: string) {
  const url = siteUrl || 'https://yourbusiness.com';
  const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const hasFaq = result?.findings.find(f => f.id === 'has_faq_schema' && f.status === 'pass');

  const si = result?.site_info;
  const businessName = si?.h1 || si?.title?.replace(/\s*[\|\-–—:].*/g, '').trim() || domain;
  const businessDesc = si?.metaDesc || '[What you do in 1–2 sentences]';
  const llmsAbout = si?.metaDesc
    ? `${businessName} — ${si.metaDesc}`
    : `${businessName} helps [who you serve] with [what you provide].`;

  return [
    {
      id: 'llms_txt', badge: '⭐ Most Important — Free', badgeColor: '#7c3aed',
      title: 'Introduce Your Business to AI Search Engines',
      why: "This is like a business card for AI. When ChatGPT or Perplexity visits your website, this file tells them exactly who you are and what you do. It's the single most impactful thing you can add.",
      where: 'Create a new text file called llms.txt and upload it to your website so it lives at yourdomain.com/llms.txt. Your web developer can do this in 2 minutes.',
      isFile: true, proOnly: false,
      code: `# ${domain}\n> ${si?.metaDesc || '[Describe your business in 1 sentence]'}\n\n## About\n${llmsAbout}\n\n## Services\n- [Your main service or product]\n- [Another service]\n\n## Contact\n- Website: ${url}\n- Location: [Your city, state]\n- Phone: [Your phone number]`,
    },
    {
      id: 'ai_robots', badge: '🤖 Allow AI Crawlers — Free', badgeColor: '#059691',
      title: 'Give AI Search Engines Permission to Find You',
      why: "ChatGPT, Perplexity, Claude, and Google AI ask permission before crawling your site. If you haven't said yes, many skip you entirely. This snippet tells them they're welcome.",
      where: 'Add these lines to your existing robots.txt file. If you don\'t have one, create a file called robots.txt at yourdomain.com/robots.txt.',
      isFile: true, proOnly: false,
      code: `# Allow AI search engine crawlers (added via findmewith.ai)\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nUser-agent: CCBot\nAllow: /\n\nUser-agent: Applebot-Extended\nAllow: /\n\nUser-agent: cohere-ai\nAllow: /`,
    },
    {
      id: 'org_schema', badge: '🏆 High Impact', badgeColor: '#d97706',
      title: 'Tell AI Your Business Details',
      why: "This hidden code tells AI your business name, what you do, where you're located, and how to contact you — all in a language AI understands perfectly.",
      where: 'Paste this just before the </body> tag on every page of your website, especially your homepage.',
      isFile: false, proOnly: true,
      code: `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", "name": businessName, "description": businessDesc, "url": url, "telephone": "[Your phone number]", "address": { "@type": "PostalAddress", "streetAddress": "[Street]", "addressLocality": "[City]", "addressRegion": "[State]", "postalCode": "[ZIP]", "addressCountry": "US" } }, null, 2)}\n</script>`,
    },
    {
      id: 'local_business', badge: '📍 Local Business Boost', badgeColor: '#d97706',
      title: 'Tell AI Your Location, Hours, and Service Area',
      why: "If you serve customers in a specific area, this is one of the most powerful things you can add. When someone asks 'best [your service] near [city]', this is what gets you recommended over competitors.",
      where: 'Paste this just before the </body> tag on your homepage and contact page.',
      isFile: false, proOnly: true,
      code: `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": "LocalBusiness", "name": businessName, "description": businessDesc || "[Describe your business]", "url": url, "telephone": "[Your phone number]", "email": "[Your business email]", "openingHours": ["Mo-Fr 09:00-17:00"], "priceRange": "$$", "address": { "@type": "PostalAddress", "streetAddress": "[Street address]", "addressLocality": "[City]", "addressRegion": "[State]", "postalCode": "[ZIP]", "addressCountry": "US" }, "areaServed": { "@type": "GeoCircle", "geoMidpoint": { "@type": "GeoCoordinates", "latitude": "[Your lat]", "longitude": "[Your lng]" }, "geoRadius": "50000" }, "sameAs": ["[Your Facebook URL]", "[Your LinkedIn URL]"] }, null, 2)}\n</script>`,
    },
    {
      id: 'faq_schema', badge: hasFaq ? '✅ Already Added' : '💡 Great Boost', badgeColor: hasFaq ? '#10b981' : '#6d28d9',
      title: 'Add a Q&A Section AI Can Read',
      why: 'When AI sees this code, it knows exactly what questions your customers ask and what answers you give. One of the best ways to get AI to recommend you.',
      where: 'Paste this on your FAQ page or homepage, just before the </body> tag.',
      isFile: false, proOnly: true,
      code: `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{ "@type": "Question", "name": "[Your most common customer question]", "acceptedAnswer": { "@type": "Answer", "text": "[Your answer]" } }] }, null, 2)}\n</script>`,
    },
    {
      id: 'service_schema', badge: '🛠️ Services Schema', badgeColor: '#7c3aed',
      title: 'List Your Services in AI Language',
      why: "This tells AI exactly what you offer, who it's for, and where you provide it. Duplicate once for each major service — the more specific, the more AI searches you capture.",
      where: 'Paste one of these on each service page, just before the </body> tag.',
      isFile: false, proOnly: true,
      code: `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": "Service", "name": "[Your Service Name — e.g. CDL Class A Training]", "provider": { "@type": "Organization", "name": businessName, "url": url }, "description": "[Describe this specific service in 1–2 sentences]", "areaServed": "[City, State or Region]", "serviceType": "[Category — e.g. Truck Driver Training]", "audience": { "@type": "Audience", "audienceType": "[Who this is for — e.g. Career changers, new drivers]" } }, null, 2)}\n</script>`,
    },
    {
      id: 'speakable', badge: '🎙️ Voice AI Ready', badgeColor: '#6366f1',
      title: 'Make Your Key Content Readable by Voice AI',
      why: "When someone asks Siri, Alexa, or Google Assistant a question, it reads aloud from the page it trusts most. This schema tells AI which sections of your page are most important to read.",
      where: 'Add this inside the <head> tag on pages with your most important text.',
      isFile: false, proOnly: true,
      code: `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", "name": businessName, "url": url, "speakable": { "@type": "SpeakableSpecification", "cssSelector": ["h1", ".intro", ".description", ".summary", "article p:first-of-type"] } }, null, 2)}\n</script>`,
    },
    {
      id: 'website_schema', badge: '✅ Quick Win', badgeColor: '#6d28d9',
      title: 'Name Your Website for AI',
      why: "This tells AI the official name and purpose of your website. A small but meaningful signal that connects everything together.",
      where: 'Paste this inside the <head> tag on your homepage.',
      isFile: false, proOnly: true,
      code: `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", "name": businessName, "url": url, "description": businessDesc || "[One sentence about your business]" }, null, 2)}\n</script>`,
    },
  ];
}

// ── Widget hero card ───────────────────────────────────────────────────────────
function WidgetHeroCard({ scanId, isPro, onUpgrade, isMobile }: {
  scanId?: string; isPro: boolean; onUpgrade: () => void; isMobile: boolean;
}) {
  const [copied, setCopied] = useState(false);

  // Free: basic 2-signal script. Pro: full 6-signal script.
  const scriptTag = isPro
    ? `<!-- findmewith.ai — paste once, stay found forever (Pro: 6 signals) -->\n<script src="https://findmewith.ai/api/widget/${scanId || 'YOUR-SCAN-ID'}.js" defer></script>`
    : `<!-- findmewith.ai — basic AI visibility (free) -->\n<script src="https://findmewith.ai/api/widget/${scanId || 'YOUR-SCAN-ID'}.js?tier=free" defer></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const freeSignals = ['Organization schema', 'WebSite identity', '2 FAQ answers'];
  const proSignals  = ['Full FAQ library', 'LocalBusiness + hours', 'Services schema', 'Voice AI (Speakable)', 'Weekly auto-updates'];

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)',
      borderRadius: isMobile ? '18px' : '24px',
      padding: isMobile ? '24px 20px' : '36px',
      marginBottom: '32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Radar glow */}
      <div style={{
        position: 'absolute', top: '-60px', right: '-60px',
        width: '240px', height: '240px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Tier badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          background: isPro ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.18)',
          border: `1.5px solid ${isPro ? 'rgba(16,185,129,0.5)' : 'rgba(245,158,11,0.5)'}`,
          borderRadius: '100px', padding: '5px 14px',
        }}>
          <span style={{
            display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
            background: isPro ? '#10b981' : '#f59e0b',
            boxShadow: `0 0 0 3px ${isPro ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
            animation: isPro ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: isPro ? '#6ee7b7' : '#fcd34d', letterSpacing: '0.04em' }}>
            {isPro ? 'PRO · LIVE — 6 SIGNALS ACTIVE' : 'FREE · 3 SIGNALS ACTIVE'}
          </span>
        </div>
      </div>

      {/* Headline */}
      <h2 style={{ fontSize: isMobile ? '22px' : '30px', fontWeight: 900, color: 'white', marginBottom: '10px', lineHeight: 1.2 }}>
        ⚡ Paste once. Stay updated forever.
      </h2>
      <p style={{ fontSize: isMobile ? '15px' : '17px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, marginBottom: '24px', maxWidth: '580px' }}>
        After you add the snippets above, paste this one line into your website header. Whenever you make changes here — new FAQs, updated services, new locations — your site updates automatically. Also boosts your traditional Google SEO.
        {!isPro && <><br /><span style={{ color: '#fcd34d', fontWeight: 600 }}> Free includes 3 signals. Pro unlocks all 6.</span></>}
      </p>

      {/* Signal breakdown: free vs pro */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '12px',
        marginBottom: '24px',
      }}>
        {/* What's free */}
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px 18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#fcd34d', letterSpacing: '0.08em', marginBottom: '10px' }}>✅ INCLUDED FREE</div>
          {freeSignals.map(s => (
            <div key={s} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10b981' }}>✓</span> {s}
            </div>
          ))}
        </div>
        {/* What's Pro */}
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px 18px', opacity: isPro ? 1 : 0.85 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: isPro ? '#6ee7b7' : '#f59e0b', letterSpacing: '0.08em', marginBottom: '10px' }}>
            {isPro ? '✅ PRO SIGNALS' : '🔒 UPGRADE TO UNLOCK'}
          </div>
          {proSignals.map(s => (
            <div key={s} style={{ fontSize: '14px', color: isPro ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: isPro ? '#10b981' : '#6b7280' }}>{isPro ? '✓' : '·'}</span> {s}
            </div>
          ))}
        </div>
      </div>

      {/* Three pillars — 3-col on desktop, 1-col on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '24px',
      }}>
        {[
          { icon: <Zap size={16} />, label: 'Paste once', sub: 'One line in your header' },
          { icon: <RefreshCw size={16} />, label: 'Auto-syncs', sub: 'Edit here, updates everywhere' },
          { icon: <ShieldCheck size={16} />, label: 'Boosts Google too', sub: 'Google renders JS — it sees all' },
        ].map(p => (
          <div key={p.label} style={{
            background: 'rgba(255,255,255,0.08)', borderRadius: '12px',
            padding: '14px 16px', display: 'flex',
            flexDirection: isMobile ? 'row' : 'column',
            alignItems: isMobile ? 'center' : 'flex-start',
            gap: isMobile ? '12px' : '6px',
          }}>
            <div style={{ color: '#fbbf24', flexShrink: 0 }}>{p.icon}</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{p.label}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{p.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Script block — always shown */}
      <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexWrap: 'wrap', gap: '8px',
        }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>
            HTML · paste in &lt;head&gt; on every page
          </span>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? '#10b981' : '#f59e0b',
              color: copied ? 'white' : '#1e1b4b',
              border: 'none', borderRadius: '8px',
              padding: '7px 16px', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'background 0.2s',
            }}
          >
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Script</>}
          </button>
        </div>
        <pre style={{
          margin: 0, padding: isMobile ? '14px 16px' : '18px 20px',
          fontFamily: '"Fira Mono","Cascadia Code","Courier New",monospace',
          fontSize: isMobile ? '11px' : '13px', lineHeight: 1.75, color: '#a5b4fc',
          overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        }}>{scriptTag}</pre>
      </div>

      {/* Upgrade nudge for free users */}
      {!isPro && (
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: 'rgba(245,158,11,0.12)', border: '1.5px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
            <strong style={{ color: 'white' }}>Want all 6 signals?</strong> Upgrade to Pro and your script auto-upgrades — no new code to paste.
          </div>
          <button
            onClick={onUpgrade}
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#1e1b4b', border: 'none', borderRadius: '10px',
              padding: '10px 22px', fontWeight: 800, fontSize: '14px',
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            Upgrade to Pro →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Supporting snippet card ───────────────────────────────────────────────────
function EditableSnippet({ snippet, isPro, onUpgrade, isMobile }: {
  snippet: ReturnType<typeof buildSnippets>[0]; isPro: boolean; onUpgrade: () => void; isMobile: boolean;
}) {
  const locked = snippet.proOnly && !isPro;
  const [code, setCode] = useState(snippet.code);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = code.split('\n').length;
  const textareaHeight = Math.max(140, Math.min(lineCount * 22 + 24, 380));

  return (
    <div style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '18px', overflow: 'hidden', position: 'relative' }}>
      <div style={{ padding: isMobile ? '18px 16px' : '22px 26px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'inline-block', fontSize: '12px', fontWeight: 700, color: snippet.badgeColor, border: `1.5px solid ${snippet.badgeColor}`, borderRadius: '100px', padding: '3px 12px', marginBottom: '10px' }}>
          {snippet.badge}
        </div>
        <h3 style={{ fontSize: isMobile ? '17px' : '20px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{snippet.title}</h3>
        <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.65, margin: 0 }}>{snippet.why}</p>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
        flexWrap: 'wrap', gap: '8px',
      }}>
        <span style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'monospace' }}>
          {snippet.isFile ? (snippet.id === 'ai_robots' ? 'robots.txt' : 'llms.txt') : 'HTML snippet'}{' '}
          <span style={{ color: '#7c3aed' }}>· Edit before copying</span>
        </span>
        {!locked && (
          <button
            onClick={handleCopy}
            style={{
              background: copied ? '#10b981' : '#7c3aed',
              color: 'white', border: 'none', borderRadius: '8px',
              padding: '8px 18px', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'background 0.2s',
            }}
          >
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Code</>}
          </button>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <textarea
          value={code}
          onChange={e => !locked && setCode(e.target.value)}
          readOnly={locked}
          spellCheck={false}
          style={{
            display: 'block', width: '100%', boxSizing: 'border-box',
            height: `${textareaHeight}px`,
            padding: isMobile ? '14px 16px' : '18px 22px',
            fontFamily: '"Fira Mono","Cascadia Code","Courier New",monospace',
            fontSize: isMobile ? '11px' : '13px', lineHeight: 1.75,
            color: '#1f2937', background: locked ? '#f9fafb' : 'white',
            border: 'none', outline: 'none', resize: 'vertical',
            whiteSpace: 'pre', overflowX: 'auto',
            filter: locked ? 'blur(3px)' : 'none',
            userSelect: locked ? 'none' : 'text',
          }}
        />
      </div>

      {!locked && (
        <div style={{ padding: '12px 18px', background: '#fffbeb', borderTop: '1px solid #fde68a', fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
          📌 <strong>Where to put it:</strong> {snippet.where}
        </div>
      )}

      {locked && <LockOverlay feature={snippet.title} onUpgrade={onUpgrade} />}
    </div>
  );
}

// ── Quick Start Card ──────────────────────────────────────────────────────────
function QuickStartCard({ siteUrl, result, scanId, isPro, isMobile }: {
  siteUrl: string; result: AnalysisResult | null; scanId?: string; isPro: boolean; isMobile: boolean;
}) {
  const [copiedLlms, setCopiedLlms] = useState(false);
  const [copiedWidget, setCopiedWidget] = useState(false);
  const [checkedLlms, setCheckedLlms] = useState(false);
  const [checkedWidget, setCheckedWidget] = useState(false);

  const url = siteUrl || 'https://yourbusiness.com';
  const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const si = result?.site_info;
  const businessName = si?.h1 || si?.title?.replace(/\s*[\|\-–—:].*/g, '').trim() || domain;

  const llmsCode = `# ${domain}\n> ${si?.metaDesc || '[Describe your business in 1 sentence]'}\n\n## About\n${si?.metaDesc ? `${businessName} — ${si.metaDesc}` : `${businessName} helps [who you serve] with [what you provide].`}\n\n## Services\n- [Your main service or product]\n- [Another service]\n\n## Contact\n- Website: ${url}\n- Location: [Your city, state]\n- Phone: [Your phone number]`;

  const widgetCode = isPro
    ? `<!-- findmewith.ai — paste once, stay found forever (Pro: 6 signals) -->\n<script src="https://findmewith.ai/api/widget/${scanId || 'YOUR-SCAN-ID'}.js" defer></script>`
    : `<!-- findmewith.ai — basic AI visibility (free) -->\n<script src="https://findmewith.ai/api/widget/${scanId || 'YOUR-SCAN-ID'}.js?tier=free" defer></script>`;

  const handleCopyLlms = () => {
    navigator.clipboard.writeText(llmsCode);
    setCopiedLlms(true); setCheckedLlms(true);
    setTimeout(() => setCopiedLlms(false), 2000);
  };
  const handleCopyWidget = () => {
    navigator.clipboard.writeText(widgetCode);
    setCopiedWidget(true); setCheckedWidget(true);
    setTimeout(() => setCopiedWidget(false), 2000);
  };

  const allDone = checkedLlms && checkedWidget;

  const row = (
    num: number,
    checked: boolean,
    label: string,
    sub: string,
    onCopy: () => void,
    copied: boolean,
    accent: string,
  ) => (
    <div style={{
      display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
      flexDirection: isMobile ? 'column' : 'row',
      gap: '14px', padding: '18px 20px',
      background: checked ? '#f0fdf4' : 'white',
      border: `1.5px solid ${checked ? '#bbf7d0' : '#e5e7eb'}`,
      borderRadius: '14px', transition: 'all 0.3s',
    }}>
      {/* Number / check */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        background: checked ? '#10b981' : accent,
        color: 'white', fontWeight: 800, fontSize: '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.3s',
      }}>
        {checked ? <Check size={18} /> : num}
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>{sub}</div>
      </div>

      {/* Copy button */}
      <button
        onClick={onCopy}
        style={{
          background: copied ? '#10b981' : checked ? '#f3f4f6' : accent,
          color: copied || checked ? (copied ? 'white' : '#374151') : 'white',
          border: 'none', borderRadius: '10px',
          padding: '10px 20px', fontWeight: 700, fontSize: '14px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
          whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0,
          alignSelf: isMobile ? 'flex-start' : 'center',
        }}
      >
        {copied ? <><Check size={14} /> Copied!</> : checked ? <><Check size={14} /> Done</> : <><Copy size={14} /> Copy</>}
      </button>
    </div>
  );

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      borderRadius: '20px', padding: isMobile ? '24px 18px' : '32px 36px',
      marginBottom: '36px', boxShadow: '0 8px 32px rgba(79,70,229,0.25)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '22px' }}>⚡</span>
          <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 900, color: 'white', margin: 0 }}>
            Your 2-minute setup
          </h2>
        </div>
        <p style={{ fontSize: '14px', color: '#c4b5fd', margin: 0, lineHeight: 1.5 }}>
          Copy these two things and you're done. Everything else below is optional but powerful.
        </p>
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {row(1, checkedLlms, 'Upload your llms.txt file', 'Introduces your business to ChatGPT, Perplexity & Claude. The single most impactful thing you can do.', handleCopyLlms, copiedLlms, '#7c3aed')}
        {row(2, checkedWidget, 'Add the auto-sync script to your website', 'Paste once in your header — keeps all your AI signals updated automatically.', handleCopyWidget, copiedWidget, '#d97706')}
      </div>

      {/* Done state */}
      <div style={{
        textAlign: 'center', padding: '12px',
        background: allDone ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.07)',
        borderRadius: '12px', transition: 'all 0.4s',
      }}>
        {allDone
          ? <span style={{ color: '#6ee7b7', fontWeight: 700, fontSize: '15px' }}>✅ Nice work! Scroll down to add more signals and boost your score even further.</span>
          : <span style={{ color: '#a5b4fc', fontSize: '14px' }}>Copy both → check them off → you're live. Scroll down to go further.</span>
        }
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export const CodeStep: React.FC<Props> = ({ siteUrl, result, scanId, isPro, onUpgrade, onNewCheck }) => {
  const width = useWindowWidth();
  const isMobile = width < 680;
  const snippets = buildSnippets(siteUrl, result, scanId);

  return (
    <div style={{ maxWidth: '100%', padding: isMobile ? '24px 0 48px' : '40px 0 60px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: isMobile ? '26px' : '38px', fontWeight: 900, color: '#111827', marginBottom: '10px' }}>
          Get found by AI search
        </h1>
        <p style={{ color: '#6b7280', fontSize: isMobile ? '16px' : '19px', lineHeight: 1.65, maxWidth: '640px' }}>
          Two things get you found. Everything else makes you impossible to miss.
        </p>
      </div>

      {/* ── QUICK START ── */}
      <QuickStartCard siteUrl={siteUrl} result={result} scanId={scanId} isPro={isPro} isMobile={isMobile} />

      {/* ── STEP 1: Snippets ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
        <div style={{
          background: '#7c3aed', color: 'white', fontWeight: 800, fontSize: '13px',
          borderRadius: '100px', padding: '5px 16px', whiteSpace: 'nowrap', letterSpacing: '0.03em',
        }}>
          Step 1 — Add to your website HTML
        </div>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
      </div>

      {/* Google Tag Manager tip */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: '14px', padding: '14px 18px', marginBottom: '24px' }}>
        <Code2 size={20} style={{ color: '#7c3aed', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.65 }}>
          <strong>No website access?</strong> You can add these using <strong>Google Tag Manager</strong> — no developer needed. Paste each snippet as a Custom HTML tag.
        </div>
      </div>

      {/* Snippets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
        {snippets.map(snippet => (
          <EditableSnippet key={snippet.id} snippet={snippet} isPro={isPro} onUpgrade={onUpgrade} isMobile={isMobile} />
        ))}
      </div>

      {/* ── STEP 2: Widget ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
        <div style={{
          background: '#1e1b4b', color: '#fcd34d', fontWeight: 800, fontSize: '13px',
          borderRadius: '100px', padding: '5px 16px', whiteSpace: 'nowrap', letterSpacing: '0.03em',
        }}>
          Step 2 — Keep everything updated automatically
        </div>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
      </div>

      {/* ── HERO: Managed widget ── */}
      <WidgetHeroCard scanId={scanId} isPro={isPro} onUpgrade={onUpgrade} isMobile={isMobile} />

      {/* Footer CTA */}
      <div style={{ marginTop: '48px', padding: isMobile ? '24px 20px' : '36px', background: 'linear-gradient(135deg, #f5f3ff, #ffffff)', border: '1.5px solid #ddd6fe', borderRadius: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '10px' }}>🚀</div>
        <div style={{ fontSize: isMobile ? '20px' : '22px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>You're all set!</div>
        <div style={{ fontSize: '15px', color: '#6b7280', maxWidth: '420px', margin: '0 auto', lineHeight: 1.7 }}>
          Once installed, AI search engines will start learning about your business within a few days. Check your score again after a week!
        </div>
        <button
          onClick={onNewCheck}
          style={{ marginTop: '22px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', padding: '12px 28px', cursor: 'pointer' }}
        >
          Check Another Website
        </button>
      </div>
    </div>
  );
};
