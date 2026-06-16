import React, { useState } from 'react';
import { Copy, Check, Code2 } from 'lucide-react';
import { LockOverlay } from './LockOverlay';
import type { AnalysisResult } from '../types';

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
      id: 'org_schema', badge: '🏆 High Impact', badgeColor: '#d97706',
      title: 'Tell AI Your Business Details',
      why: "This hidden code tells AI your business name, what you do, where you're located, and how to contact you — all in a language AI understands perfectly.",
      where: 'Paste this just before the </body> tag on every page of your website, especially your homepage.',
      isFile: false, proOnly: true,
      code: `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", "name": businessName, "description": businessDesc, "url": url, "telephone": "[Your phone number]", "address": { "@type": "PostalAddress", "streetAddress": "[Street]", "addressLocality": "[City]", "addressRegion": "[State]", "postalCode": "[ZIP]", "addressCountry": "US" } }, null, 2)}\n</script>`,
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
      id: 'website_schema', badge: '✅ Quick Win', badgeColor: '#6d28d9',
      title: 'Name Your Website for AI',
      why: "This tells AI the official name and purpose of your website. A small but meaningful signal that connects everything together.",
      where: 'Paste this inside the <head> tag on your homepage.',
      isFile: false, proOnly: true,
      code: `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", "name": businessName, "url": url, "description": businessDesc || "[One sentence about your business]" }, null, 2)}\n</script>`,
    },
    {
      id: 'ai_robots', badge: '🤖 Allow AI Crawlers', badgeColor: '#059691',
      title: 'Give AI Search Engines Permission to Find You',
      why: "ChatGPT, Perplexity, Claude, and Google AI ask permission before crawling your site. If you haven't said yes, many skip you entirely. This file snippet tells them they're welcome — it's one of the easiest wins available.",
      where: 'Add these lines to your existing robots.txt file. If you don\'t have one, create a file called robots.txt and upload it to your website so it lives at yourdomain.com/robots.txt.',
      isFile: true, proOnly: false,
      code: `# Allow AI search engine crawlers (added via findmewith.ai)\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nUser-agent: CCBot\nAllow: /\n\nUser-agent: Applebot-Extended\nAllow: /\n\nUser-agent: cohere-ai\nAllow: /`,
    },
    {
      id: 'local_business', badge: '📍 Local Business Boost', badgeColor: '#d97706',
      title: 'Tell AI Your Location, Hours, and Service Area',
      why: "If you serve customers in a specific area, this is one of the most powerful things you can add. When someone asks 'best [your service] near [city]', this is what gets you recommended over competitors.",
      where: 'Paste this just before the </body> tag on your homepage and contact page. Fill in your real details — accurate info beats empty placeholders every time.',
      isFile: false, proOnly: true,
      code: `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": "LocalBusiness", "name": businessName, "description": businessDesc || "[Describe your business]", "url": url, "telephone": "[Your phone number]", "email": "[Your business email]", "openingHours": ["Mo-Fr 09:00-17:00"], "priceRange": "$$", "address": { "@type": "PostalAddress", "streetAddress": "[Street address]", "addressLocality": "[City]", "addressRegion": "[State]", "postalCode": "[ZIP]", "addressCountry": "US" }, "areaServed": { "@type": "GeoCircle", "geoMidpoint": { "@type": "GeoCoordinates", "latitude": "[Your lat]", "longitude": "[Your lng]" }, "geoRadius": "50000" }, "sameAs": ["[Your Facebook URL]", "[Your LinkedIn URL]"] }, null, 2)}\n</script>`,
    },
    {
      id: 'service_schema', badge: '🛠️ Services Schema', badgeColor: '#7c3aed',
      title: 'List Your Services in AI Language',
      why: "This tells AI exactly what you offer, who it's for, and where you provide it. Duplicate this snippet once for each major service — the more specific you are, the more AI searches you can capture.",
      where: 'Paste one of these on each service page, just before the </body> tag. Customize the name and description for each service.',
      isFile: false, proOnly: true,
      code: `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": "Service", "name": "[Your Service Name — e.g. CDL Class A Training]", "provider": { "@type": "Organization", "name": businessName, "url": url }, "description": "[Describe this specific service in 1–2 sentences]", "areaServed": "[City, State or Region]", "serviceType": "[Category — e.g. Truck Driver Training]", "audience": { "@type": "Audience", "audienceType": "[Who this is for — e.g. Career changers, new drivers]" } }, null, 2)}\n</script>`,
    },
    {
      id: 'speakable', badge: '🎙️ Voice AI Ready', badgeColor: '#6366f1',
      title: 'Make Your Key Content Readable by Voice AI',
      why: "When someone asks Siri, Alexa, or Google Assistant a question, it reads aloud from the page it trusts most. This schema tells AI which sections of your page are most important to read. It's how you win voice search.",
      where: 'Add this inside the <head> tag on pages with your most important text. Update the cssSelector values to match real elements on your page.',
      isFile: false, proOnly: true,
      code: `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", "name": businessName, "url": url, "speakable": { "@type": "SpeakableSpecification", "cssSelector": ["h1", ".intro", ".description", ".summary", "article p:first-of-type"] } }, null, 2)}\n</script>`,
    },
    {
      id: 'managed_widget', badge: '⚡ Auto-Update Widget — Pro', badgeColor: '#7c3aed',
      title: 'Paste Once. Stay Found Forever.',
      why: "This is the most powerful thing on this page. One line of code on your website — and we automatically keep all your AI visibility signals current. Update your FAQ answers or business info here, and your website updates automatically. No developer, no manual copy-paste, no outdated schemas. As long as this line is on your site, you're covered.",
      where: 'Paste this single line inside the <head> tag on every page of your website. That\'s it. We handle everything else.',
      isFile: false, proOnly: true,
      code: `<!-- findmewith.ai Managed AEO Widget — updates automatically -->\n<script src="https://findmewith.ai/api/widget/${scanId || 'YOUR-SCAN-ID'}.js" defer></script>`,
    },
  ];
}

function EditableSnippet({ snippet, isPro, onUpgrade }: { snippet: ReturnType<typeof buildSnippets>[0]; isPro: boolean; onUpgrade: () => void }) {
  const locked = snippet.proOnly && !isPro;
  const [code, setCode] = useState(snippet.code);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Estimate a reasonable textarea height based on line count
  const lineCount = code.split('\n').length;
  const textareaHeight = Math.max(160, Math.min(lineCount * 22 + 24, 400));

  return (
    <div style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '20px', overflow: 'hidden', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '22px 26px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'inline-block', fontSize: '13px', fontWeight: 700, color: snippet.badgeColor, border: `1.5px solid ${snippet.badgeColor}`, borderRadius: '100px', padding: '3px 14px', marginBottom: '12px' }}>
          {snippet.badge}
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{snippet.title}</h3>
        <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.65, margin: 0 }}>{snippet.why}</p>
      </div>

      {/* Code area header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <span style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'monospace' }}>
          {snippet.isFile ? 'llms.txt' : 'HTML snippet'} · <span style={{ color: '#7c3aed' }}>Edit directly before copying</span>
        </span>
        {!locked && (
          <button
            onClick={handleCopy}
            style={{
              background: copied ? '#10b981' : '#7c3aed',
              color: 'white', border: 'none', borderRadius: '10px',
              padding: '9px 20px', fontWeight: 700, fontSize: '14px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'background 0.2s',
            }}
          >
            {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Code</>}
          </button>
        )}
      </div>

      {/* Editable textarea */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={locked ? code : code}
          onChange={e => !locked && setCode(e.target.value)}
          readOnly={locked}
          spellCheck={false}
          style={{
            display: 'block', width: '100%', boxSizing: 'border-box',
            height: `${textareaHeight}px`,
            padding: '20px 24px',
            fontFamily: '"Fira Mono", "Cascadia Code", "Courier New", monospace',
            fontSize: '13px', lineHeight: 1.75,
            color: '#1f2937', background: locked ? '#f9fafb' : 'white',
            border: 'none', outline: 'none', resize: 'vertical',
            whiteSpace: 'pre', overflowX: 'auto',
            filter: locked ? 'blur(3px)' : 'none',
            userSelect: locked ? 'none' : 'text',
          }}
        />
      </div>

      {/* Where to put it */}
      {!locked && (
        <div style={{ padding: '14px 22px', background: '#fffbeb', borderTop: '1px solid #fde68a', fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
          📌 <strong>Where to put it:</strong> {snippet.where}
        </div>
      )}

      {locked && <LockOverlay feature={snippet.title} onUpgrade={onUpgrade} />}
    </div>
  );
}

export const CodeStep: React.FC<Props> = ({ siteUrl, result, scanId, isPro, onUpgrade, onNewCheck }) => {
  const snippets = buildSnippets(siteUrl, result, scanId);

  return (
    <div style={{ maxWidth: '100%', padding: '40px 0 60px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '38px', fontWeight: 900, color: '#111827', marginBottom: '12px' }}>🏷️ Your code snippets</h1>
        <p style={{ color: '#6b7280', fontSize: '19px', lineHeight: 1.65 }}>
          Each snippet tells AI something important about your business. <strong>Edit the placeholder text directly in each box</strong>, then copy and hand it to your web developer — every snippet is a 2-minute install.
        </p>
      </div>

      {!isPro && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '14px', padding: '14px 20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '15px', color: '#374151' }}>✨ <strong>Free:</strong> Your AI introduction file · Upgrade for all 4 snippets</div>
          <button onClick={onUpgrade} style={{ fontSize: '14px', fontWeight: 700, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Upgrade →</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: '14px', padding: '16px 20px', marginBottom: '28px' }}>
        <Code2 size={20} style={{ color: '#7c3aed', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '15px', color: '#374151', lineHeight: 1.65 }}>
          <strong>No website access?</strong> You can add these using <strong>Google Tag Manager</strong> — no developer needed. Paste each snippet as a Custom HTML tag.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {snippets.map(snippet => (
          <EditableSnippet key={snippet.id} snippet={snippet} isPro={isPro} onUpgrade={onUpgrade} />
        ))}
      </div>

      <div style={{ marginTop: '48px', padding: '36px', background: 'linear-gradient(135deg, #f5f3ff, #ffffff)', border: '1.5px solid #ddd6fe', borderRadius: '22px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🚀</div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>You're all set!</div>
        <div style={{ fontSize: '16px', color: '#6b7280', maxWidth: '420px', margin: '0 auto', lineHeight: 1.7 }}>
          Once you've added these to your website, AI search engines will start learning about your business within a few days. Come back and check your score again after a week!
        </div>
        <button onClick={onNewCheck} style={{ marginTop: '24px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '16px', padding: '12px 28px', cursor: 'pointer' }}>
          Check Another Website
        </button>
      </div>
    </div>
  );
};
