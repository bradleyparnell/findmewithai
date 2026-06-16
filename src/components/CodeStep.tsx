import React, { useState } from 'react';
import { Copy, Check, Code2 } from 'lucide-react';
import { LockOverlay } from './LockOverlay';
import type { AnalysisResult } from '../types';

interface Props {
  siteUrl: string;
  result: AnalysisResult | null;
  isPro: boolean;
  onUpgrade: () => void;
  onNewCheck: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={copied
        ? { background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }
        : { background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
    >
      {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Code</>}
    </button>
  );
}

function buildSnippets(siteUrl: string, result: AnalysisResult | null) {
  const url = siteUrl || 'https://yourbusiness.com';
  const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const hasFaq = result?.findings.find(f => f.id === 'has_faq_schema' && f.status === 'pass');

  // Pre-fill from site_info if available
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
      code: `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", "name": "[Your Business Name]", "url": url, "description": "[One sentence about your business]" }, null, 2)}\n</script>`,
    },
  ];
}

export const CodeStep: React.FC<Props> = ({ siteUrl, result, isPro, onUpgrade, onNewCheck }) => {
  const snippets = buildSnippets(siteUrl, result);

  return (
    <div style={{ maxWidth: '100%', padding: '40px 0 60px' }}>
      <div style={{ marginBottom: '26px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 900, color: '#111827', marginBottom: '10px' }}>🏷️ Your code snippets</h1>
        <p style={{ color: '#6b7280', fontSize: '18px', lineHeight: 1.6 }}>
          Each snippet tells AI something important about your business. Not a developer? <strong>Forward this page to your web developer</strong> — every snippet is a 2-minute job.
        </p>
      </div>

      {!isPro && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', color: '#374151' }}>✨ <strong>Free:</strong> Your AI introduction file · Upgrade for all 4 snippets</div>
          <button onClick={onUpgrade} style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Upgrade →</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px' }}>
        <Code2 size={18} style={{ color: '#7c3aed', flexShrink: 0, marginTop: '1px' }} />
        <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>
          <strong>No website access?</strong> You can add these using <strong>Google Tag Manager</strong> — no developer needed. Paste each snippet as a Custom HTML tag.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {snippets.map(snippet => {
          const locked = snippet.proOnly && !isPro;
          return (
            <div key={snippet.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '18px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, color: snippet.badgeColor, border: `1px solid ${snippet.badgeColor}`, borderRadius: '100px', padding: '2px 10px', marginBottom: '8px' }}>{snippet.badge}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '5px' }}>{snippet.title}</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.55, margin: 0 }}>{snippet.why}</p>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>{snippet.isFile ? 'llms.txt' : 'HTML snippet'}</span>
                  {!locked && <CopyButton text={snippet.code} />}
                </div>
                <pre style={{ margin: 0, padding: '16px 20px', fontSize: '11.5px', lineHeight: 1.7, overflowX: 'auto', color: '#374151', background: 'white', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '220px', overflowY: 'auto', filter: locked ? 'blur(3px)' : 'none', userSelect: locked ? 'none' : 'text' }}>
                  {snippet.code}
                </pre>
              </div>
              {!locked && (
                <div style={{ padding: '11px 18px', background: '#fffbeb', borderTop: '1px solid #fde68a', fontSize: '12px', color: '#6b7280', lineHeight: 1.55 }}>
                  📌 <strong>Where to put it:</strong> {snippet.where}
                </div>
              )}
              {locked && <LockOverlay feature={snippet.title} onUpgrade={onUpgrade} />}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '40px', padding: '28px', background: 'linear-gradient(135deg, #f5f3ff, #ffffff)', border: '1px solid #ddd6fe', borderRadius: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>🚀</div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>You're all set!</div>
        <div style={{ fontSize: '13px', color: '#6b7280', maxWidth: '380px', margin: '0 auto', lineHeight: 1.65 }}>
          Once you've added these to your website, AI search engines will start learning about your business within a few days. Come back and check your score again after a week!
        </div>
        <button onClick={onNewCheck} style={{ marginTop: '20px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', padding: '8px 18px', cursor: 'pointer' }}>
          Check Another Website
        </button>
      </div>
    </div>
  );
};
