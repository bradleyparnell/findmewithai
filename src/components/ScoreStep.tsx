import React, { useState } from 'react';
import { CheckCircle, ArrowRight, TrendingUp, Mail, Copy, Check, FileText } from 'lucide-react';
import type { AnalysisResult } from '../types';

const CATEGORY_INFO: Record<string, { label: string; desc: string; max: number }> = {
  structured_data:  { label: 'Business Info Cards',  desc: 'Can AI identify your business?',          max: 35 },
  content_quality:  { label: 'Your Content',          desc: 'Does your site give AI enough to read?',  max: 25 },
  entity_authority: { label: 'Your Online Identity',  desc: 'How confidently can AI vouch for you?',   max: 20 },
  technical_seo:    { label: 'Website Health',        desc: 'Is your site easy for AI to access?',     max: 15 },
  ai_bonus:         { label: 'AI Extras',             desc: 'Special signals that boost visibility',   max: 5  },
};

const FINDING_QUESTIONS: Record<string, string> = {
  https_enabled:           'Is your website secure?',
  has_title_tag:           'Does your website have a clear title?',
  has_meta_description:    'Does your site have a one-sentence summary?',
  has_h1:                  'Does each page have a clear main heading?',
  has_og_tags:             'Does your site look good when shared online?',
  content_length:          'Does your site have enough content for AI to read?',
  has_schema_org:          'Does your website tell AI who you are?',
  has_organization_schema: 'Does AI know your business name and details?',
  has_person_schema:       'Does AI know who runs this business?',
  has_faq_schema:          'Does your site answer common customer questions?',
  has_article_schema:      'Are your blog posts labeled for AI?',
  has_contact_info:        'Can AI find your contact information?',
  has_about_page:          'Do you have an About page?',
  has_llms_txt:            'Have you introduced yourself to AI search engines?',
  has_sitemap:             'Can AI easily find all your pages?',
  has_robots_txt:          'Does your site have navigation instructions for AI?',
};

const FINDING_PLAIN_ENGLISH: Record<string, { why: string; fix: string }> = {
  has_schema_org:          { why: "This is the single biggest thing you can do. Without it, AI tools have to guess what your business does — and they often get it wrong or skip you entirely.", fix: "Use our code snippet generator below to create this in 30 seconds." },
  has_organization_schema: { why: "AI needs to know your business name, what you do, and how to reach you. Right now it's piecing that together from hints — and probably missing things.", fix: "The code snippet below includes this automatically." },
  has_faq_schema:          { why: "When customers ask AI questions like 'who is the best [your business type] near me?', FAQ content is what gets you recommended.", fix: "Use the content writer below to generate great FAQ answers." },
  content_length:          { why: "AI tools need enough text on your site to understand what you do and who you serve. Thin pages are often ignored completely.", fix: "Add more detail to your homepage and key pages — who you help, how, and why you're different." },
  has_about_page:          { why: "AI tools look for About pages to understand who is behind a business. It makes you more trustworthy and recommendable.", fix: "Add a simple About page that tells your story in plain English." },
  has_meta_description:    { why: "This one-sentence summary helps AI quickly understand what each page is about.", fix: "Add a short description to each page in your website settings." },
  has_contact_info:        { why: "If AI can't find your phone, email, or address, it's less likely to recommend you for local searches.", fix: "Make sure your contact details are visible on your homepage and footer." },
  has_llms_txt:            { why: "A special file that directly tells AI tools who you are and what you want them to know — like handing them a business card.", fix: "We'll help you create this file in the code snippet section." },
  https_enabled:           { why: "Secure websites are trusted more by AI and search engines alike. An unsecured site gets ranked lower.", fix: "Contact your web host — most offer free SSL certificates." },
  has_sitemap:             { why: "A sitemap helps AI find every page on your site, not just the homepage.", fix: "Most website platforms generate this automatically — check your settings." },
};

const FINDING_WEB_INSTRUCTIONS: Record<string, string> = {
  has_schema_org:          'Add Schema.org structured data markup to the website. This tells AI and search engines exactly what the business does, where it is, and how to contact it. Use schema type "LocalBusiness" or a more specific type (e.g. "Restaurant", "LawFirm"). A free generator is at https://technicalseo.com/tools/schema-markup-generator/',
  has_organization_schema: 'Add Organization schema markup including business name, URL, logo, phone, address, and social profiles. This should be added to every page in a <script type="application/ld+json"> tag.',
  has_faq_schema:          'Add FAQ schema markup to the homepage or a dedicated FAQ page. Write 5-8 questions customers commonly ask, with plain English answers. This dramatically increases AI recommendation visibility.',
  content_length:          'Add more text content to the homepage and main service pages. Each key page should have at least 500 words describing what the business does, who it helps, and how. AI tools need enough text to understand and recommend the business.',
  has_about_page:          'Create an About page at /about that tells the story of the business — who founded it, how long it\'s been running, the team, and what makes it different. Include the owner\'s name and a photo if possible.',
  has_meta_description:    'Add a unique meta description to every page (especially the homepage). It should be 150-160 characters and describe what the page is about in plain English. This shows up in search results and helps AI understand each page.',
  has_contact_info:        'Make sure the full contact details are visible on the homepage and in the footer: phone number, email address, and physical address (if applicable). These should be in plain HTML text, not just an image.',
  has_llms_txt:            'Create a file at the root of the website called llms.txt. This is a plain text file that introduces the business to AI tools. It should include: business name, what it does, who it serves, key services, location, and contact info. Format guidance at https://llmstxt.org',
  https_enabled:           'Enable SSL/HTTPS on the website. Contact the web host — most offer free SSL certificates via Let\'s Encrypt. The site should redirect all HTTP traffic to HTTPS automatically.',
  has_sitemap:             'Generate and submit an XML sitemap at /sitemap.xml. Most CMS platforms (WordPress, Squarespace, Wix) can do this automatically with a plugin or setting. Submit it to Google Search Console as well.',
  has_robots_txt:          'Create a robots.txt file at the root of the website. At minimum it should include: User-agent: * and Sitemap: [full URL to sitemap.xml]. Make sure it does not accidentally block search engine crawlers.',
  has_title_tag:           'Add a unique, descriptive title tag to every page. The homepage title should include the business name and primary service/location (e.g. "Smith Plumbing — Plumbers in Austin, TX"). Keep it under 60 characters.',
  has_h1:                  'Make sure every page has exactly one H1 heading tag that clearly describes what that page is about. It should be the main visible headline on the page.',
  has_og_tags:             'Add Open Graph meta tags to every page: og:title, og:description, og:image, and og:url. This controls how the page looks when shared on social media and in AI-generated summaries.',
};

// --- Orchard tier config ---
const TIER_1_IDS = ['has_llms_txt', 'has_meta_description', 'has_contact_info', 'has_robots_txt', 'has_title_tag', 'has_og_tags'];
const TIER_2_IDS = ['has_schema_org', 'has_organization_schema', 'has_faq_schema', 'has_about_page', 'has_sitemap', 'has_h1', 'https_enabled'];
const TIER_3_IDS = ['content_length', 'has_person_schema', 'has_article_schema'];

const FINDING_TIME: Record<string, string> = {
  has_llms_txt:            '5 min',
  has_meta_description:    '10 min',
  has_contact_info:        '5 min',
  has_robots_txt:          '10 min',
  has_title_tag:           '10 min',
  has_og_tags:             '15 min',
  has_schema_org:          '30 min',
  has_organization_schema: '20 min',
  has_faq_schema:          '45 min',
  has_about_page:          '1–2 hrs',
  has_sitemap:             '15 min',
  has_h1:                  '30 min',
  https_enabled:           '1 hr',
  content_length:          'Ongoing',
  has_person_schema:       '30 min',
  has_article_schema:      'Ongoing',
};

// --- Helpers ---
function getScoreMessage(score: number): { emoji: string; headline: string; sub: string; realWorld: string; urgency: string } {
  if (score >= 80) return {
    emoji: '🎉',
    headline: "AI knows your business well!",
    sub: "You're ahead of most businesses. A few final tweaks and you'll be near the top.",
    realWorld: "When someone asks ChatGPT or Google AI for a recommendation in your industry, there's a good chance your business comes up. You've already done the hard work — now it's about fine-tuning.",
    urgency: "You're in the top tier. Focus on staying there as AI search keeps evolving.",
  };
  if (score >= 60) return {
    emoji: '👍',
    headline: "You're on AI's radar — but you could be much more visible.",
    sub: "A few simple fixes and you'll show up far more often in AI recommendations.",
    realWorld: "Right now, AI tools sometimes find your business and sometimes don't — it depends on how the question is asked. Customers looking for exactly what you offer might still be sent to a competitor.",
    urgency: "You're close. The fixes below could move you from 'sometimes found' to 'consistently recommended.'",
  };
  if (score >= 40) return {
    emoji: '🌱',
    headline: "AI knows a little about you — but misses a lot.",
    sub: "The good news: you're not starting from zero. And what's missing is completely fixable.",
    realWorld: "If a potential customer asked ChatGPT who to hire in your field right now, your business probably wouldn't come up — even if you're the best option in town. That's what we're here to fix.",
    urgency: "Every improvement you make from here directly increases your chances of being recommended.",
  };
  return {
    emoji: '💪',
    headline: "AI can barely find you right now — but that changes today.",
    sub: "Almost every business starts here. The fixes are simpler than you think.",
    realWorld: "Right now, when someone asks an AI tool for a recommendation in your industry, your business is essentially invisible — even if you have a website. The AI doesn't have enough information to suggest you. That's the gap we're going to close.",
    urgency: "The upside is huge. Businesses starting from here see the biggest improvements, fastest.",
  };
}

function scoreColor(score: number) {
  if (score >= 80) return '#7c3aed';
  if (score >= 60) return '#6d28d9';
  if (score >= 40) return '#d97706';
  return '#ef4444';
}

function buildWebPersonEmail(url: string, score: number, failing: AnalysisResult['findings']): { subject: string; body: string } {
  const subject = `Website updates needed — AI search visibility report for ${url}`;
  const fixList = failing
    .map((f, i) => {
      const label = FINDING_QUESTIONS[f.id] ?? f.label;
      const instructions = FINDING_WEB_INSTRUCTIONS[f.id] ?? (f.suggestion ?? 'Please review and fix this item.');
      return `${i + 1}. ${label}\n   What to do: ${instructions}`;
    })
    .join('\n\n');

  const body = `Hi,

I ran our website (${url}) through an AI visibility scanner called findmewith.ai. It checks whether AI tools like ChatGPT, Google AI, and Perplexity can find and recommend our business.

Our score: ${score}%

This matters because more and more customers are using AI assistants to find businesses like ours. If we're not showing up in those recommendations, we're losing customers to competitors who are.

Here are the specific things the scan found that need to be fixed:

${fixList}

You don't need to fix everything at once — please start with item #1 and work through the list. Let me know if you have any questions about any of these.

You can run the scan yourself at https://findmewith.ai to verify improvements after each change.

Thanks!`;

  return { subject, body };
}

function generatePDFHtml(result: AnalysisResult, score: number, msg: ReturnType<typeof getScoreMessage>): string {
  const failing = result.findings.filter(f => f.status !== 'pass');
  const passing = result.findings.filter(f => f.status === 'pass');
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const color = scoreColor(score);

  const categoryRows = Object.entries(CATEGORY_INFO).map(([key, info]) => {
    const raw = (result.categories as Record<string, number>)[key] ?? 0;
    const pct = Math.min(100, Math.round((raw / info.max) * 100));
    const good = pct >= 60;
    return `
      <div style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
          <span style="font-size:13px;font-weight:600;color:#111827;">${info.label}</span>
          <span style="font-size:13px;font-weight:700;color:${good ? '#7c3aed' : '#d97706'};">${pct}%</span>
        </div>
        <div style="height:8px;background:#f3f0ff;border-radius:99px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${good ? '#7c3aed' : '#f59e0b'};border-radius:99px;"></div>
        </div>
        <div style="font-size:11px;color:#9ca3af;margin-top:3px;">${info.desc}</div>
      </div>`;
  }).join('');

  const fixRows = failing.map((f, i) => {
    const label = FINDING_QUESTIONS[f.id] ?? f.label;
    const plain = FINDING_PLAIN_ENGLISH[f.id];
    const instructions = FINDING_WEB_INSTRUCTIONS[f.id] ?? f.suggestion ?? '';
    return `
      <div style="margin-bottom:16px;padding:14px 16px;background:${i === 0 ? '#fffbeb' : '#fafafa'};border:1px solid ${i === 0 ? '#fde68a' : '#e5e7eb'};border-radius:12px;page-break-inside:avoid;">
        <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:6px;">
          ${i + 1}. ${label}${i === 0 ? ' <span style="font-size:11px;background:#d97706;color:white;border-radius:6px;padding:1px 7px;margin-left:6px;">Start here</span>' : ''}
        </div>
        ${plain ? `<div style="font-size:12px;color:#6b7280;margin-bottom:6px;line-height:1.6;">${plain.why}</div>` : ''}
        ${instructions ? `<div style="font-size:12px;color:#374151;background:white;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;line-height:1.6;"><strong>What to do:</strong> ${instructions}</div>` : ''}
      </div>`;
  }).join('');

  const passingChips = passing.map(f => `
    <span style="display:inline-flex;align-items:center;gap:5px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:100px;padding:4px 12px;font-size:12px;color:#7c3aed;font-weight:500;margin:3px;">
      ✓ ${(FINDING_QUESTIONS[f.id] ?? f.label).replace(/\?$/, '')}
    </span>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>AI Visibility Report — ${result.url}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: white; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    .page { max-width: 800px; margin: 0 auto; padding: 48px 40px; }
  </style>
</head>
<body>
<div class="page">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:36px;padding-bottom:20px;border-bottom:2px solid #f3f0ff;">
    <div>
      <div style="font-size:22px;font-weight:900;color:#7c3aed;letter-spacing:-0.5px;">findmewith.ai</div>
      <div style="font-size:13px;color:#9ca3af;margin-top:2px;">AI Search Visibility Report</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:12px;color:#9ca3af;">Generated ${date}</div>
      <div style="font-size:13px;font-weight:600;color:#374151;margin-top:2px;">${result.url}</div>
    </div>
  </div>
  <div style="background:linear-gradient(135deg,#f5f3ff,#ffffff);border:1px solid #ddd6fe;border-radius:20px;padding:32px;text-align:center;margin-bottom:24px;">
    <div style="font-size:72px;font-weight:900;color:${color};line-height:1;">${score}<span style="font-size:30px;font-weight:600;">%</span></div>
    <div style="font-size:14px;color:#6b7280;margin:8px 0 12px;">AI search engines can identify <strong>${score}%</strong> of what makes your business worth recommending</div>
    <div style="font-size:20px;font-weight:800;color:#111827;margin-bottom:6px;">${msg.emoji} ${msg.headline}</div>
    <div style="font-size:14px;color:#6b7280;max-width:480px;margin:0 auto;line-height:1.65;">${msg.sub}</div>
  </div>
  <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:14px;padding:20px 24px;margin-bottom:24px;">
    <div style="font-weight:700;font-size:14px;color:#92400e;margin-bottom:8px;">🗣️ What this means in plain English</div>
    <div style="font-size:14px;color:#78350f;line-height:1.7;margin-bottom:8px;">${msg.realWorld}</div>
    <div style="font-size:13px;color:#d97706;font-weight:600;">${msg.urgency}</div>
  </div>
  <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;padding:24px;margin-bottom:24px;">
    <div style="font-size:16px;font-weight:700;color:#111827;margin-bottom:4px;">📊 How you score in each area</div>
    <div style="font-size:13px;color:#9ca3af;margin-bottom:18px;">Each area shows how much of the picture AI has about your business.</div>
    ${categoryRows}
  </div>
  ${failing.length > 0 ? `
  <div class="page-break" style="background:white;border:1px solid #e5e7eb;border-radius:16px;padding:24px;margin-bottom:24px;">
    <div style="font-size:16px;font-weight:700;color:#111827;margin-bottom:4px;">🔧 What to fix (${failing.length} ${failing.length === 1 ? 'item' : 'items'})</div>
    <div style="font-size:13px;color:#9ca3af;margin-bottom:16px;">Fix these one at a time — start with #1 for the biggest impact.</div>
    ${fixRows}
  </div>` : ''}
  ${passing.length > 0 ? `
  <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;padding:24px;margin-bottom:24px;">
    <div style="font-size:16px;font-weight:700;color:#111827;margin-bottom:4px;">✅ Already working (${passing.length})</div>
    <div style="font-size:13px;color:#9ca3af;margin-bottom:12px;">These are things AI can already see about your business.</div>
    <div>${passingChips}</div>
  </div>` : ''}
  <div style="text-align:center;padding:24px;background:#f9fafb;border-radius:12px;border:1px solid #f0f0f0;">
    <div style="font-size:16px;font-weight:800;color:#7c3aed;margin-bottom:6px;">findmewith.ai</div>
    <div style="font-size:13px;color:#6b7280;line-height:1.65;">
      Questions about this report? Email us at <strong>hello@findmewithai.com</strong><br/>
      Re-scan your site anytime at <strong>findmewith.ai</strong> to track your progress.
    </div>
  </div>
</div>
<script>window.onload = function() { window.print(); };</script>
</body>
</html>`;
}

// Which findings link to which in-app tool
const FINDING_TOOL_LINK: Record<string, { label: string; dest: 'content' | 'code' }> = {
  has_faq_schema:          { label: '✍️ Generate FAQ answers →', dest: 'content' },
  has_llms_txt:            { label: '🏷️ Generate llms.txt →', dest: 'code' },
  has_schema_org:          { label: '🏷️ Get schema code snippet →', dest: 'code' },
  has_organization_schema: { label: '🏷️ Get organization schema →', dest: 'code' },
  has_about_page:          { label: '✍️ Write your About page →', dest: 'content' },
};

// --- Orchard Tier sub-component ---
interface OrchardTierProps {
  emoji: string;
  title: string;
  subtitle: string;
  items: AnalysisResult['findings'];
  checked: Set<string>;
  onToggle: (id: string) => void;
  onNavigate: (dest: 'content' | 'code') => void;
  accentColor: string;
  bgColor: string;
  borderColor: string;
}

const OrchardTier: React.FC<OrchardTierProps> = ({ emoji, title, subtitle, items, checked, onToggle, onNavigate, accentColor, bgColor, borderColor }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const allChecked = items.every(f => checked.has(f.id));
  const checkedCount = items.filter(f => checked.has(f.id)).length;

  return (
    <div style={{ marginBottom: '14px', border: `1.5px solid ${allChecked ? '#86efac' : borderColor}`, borderRadius: '16px', overflow: 'hidden', transition: 'border-color 0.3s' }}>
      {/* Tier header */}
      <div style={{ background: allChecked ? '#f0fdf4' : bgColor, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>{emoji}</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: allChecked ? '#15803d' : '#111827' }}>{title}</div>
            <div style={{ fontSize: '12px', color: allChecked ? '#16a34a' : '#9ca3af', marginTop: '1px' }}>{allChecked ? '✓ All done — nice work!' : subtitle}</div>
          </div>
        </div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: allChecked ? '#16a34a' : accentColor, background: allChecked ? '#dcfce7' : 'white', border: `1px solid ${allChecked ? '#86efac' : borderColor}`, borderRadius: '100px', padding: '4px 12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {checkedCount}/{items.length} done
        </div>
      </div>

      {/* Items */}
      <div style={{ background: 'white', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {items.map(f => {
          const isChecked = checked.has(f.id);
          const isExpanded = expanded === f.id;
          const timeLabel = FINDING_TIME[f.id];
          const plain = FINDING_PLAIN_ENGLISH[f.id];
          const webInstructions = FINDING_WEB_INSTRUCTIONS[f.id];
          const toolLink = FINDING_TOOL_LINK[f.id];

          return (
            <div
              key={f.id}
              style={{
                background: isChecked ? '#f0fdf4' : isExpanded ? '#faf8ff' : '#fafafa',
                border: `1px solid ${isChecked ? '#86efac' : isExpanded ? '#ddd6fe' : '#f0f0f0'}`,
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.2s',
              }}
            >
              {/* Row (click to expand, checkbox to mark done) */}
              <div
                style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', cursor: 'pointer' }}
                onClick={() => setExpanded(isExpanded ? null : f.id)}
              >
                {/* Checkbox — separate click to mark done */}
                <div
                  onClick={e => { e.stopPropagation(); onToggle(f.id); }}
                  style={{
                    width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0, marginTop: '2px',
                    background: isChecked ? '#16a34a' : 'white',
                    border: `2px solid ${isChecked ? '#16a34a' : '#d1d5db'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s', cursor: 'pointer',
                  }}
                >
                  {isChecked && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: isChecked ? '#6b7280' : '#111827', textDecoration: isChecked ? 'line-through' : 'none', lineHeight: 1.4 }}>
                    {FINDING_QUESTIONS[f.id] ?? f.label}
                  </div>
                  {!isExpanded && !isChecked && (
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '3px' }}>
                      Tap to see how →
                    </div>
                  )}
                </div>

                {/* Time badge + chevron */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {timeLabel && (
                    <div style={{
                      fontSize: '11px', fontWeight: 700, color: isChecked ? '#9ca3af' : accentColor,
                      background: isChecked ? '#f3f4f6' : bgColor,
                      border: `1px solid ${isChecked ? '#e5e7eb' : borderColor}`,
                      borderRadius: '100px', padding: '3px 10px', whiteSpace: 'nowrap',
                    }}>
                      {timeLabel}
                    </div>
                  )}
                  <div style={{ fontSize: '14px', color: '#9ca3af', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</div>
                </div>
              </div>

              {/* Expanded how-to panel */}
              {isExpanded && (
                <div style={{ padding: '0 14px 14px 46px', borderTop: '1px solid #f0f0f0' }}>
                  {plain && (
                    <div style={{ marginTop: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 14px', marginBottom: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>Why this matters</div>
                      <div style={{ fontSize: '13px', color: '#78350f', lineHeight: 1.6 }}>{plain.why}</div>
                    </div>
                  )}
                  {webInstructions && (
                    <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '10px', padding: '12px 14px', marginBottom: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#5b21b6', marginBottom: '4px' }}>How to fix it</div>
                      <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>{webInstructions}</div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {toolLink && (
                      <button
                        onClick={() => onNavigate(toolLink.dest)}
                        style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer' }}
                      >
                        {toolLink.label}
                      </button>
                    )}
                    <button
                      onClick={() => { onToggle(f.id); setExpanded(null); }}
                      style={{ fontSize: '12px', fontWeight: 700, color: isChecked ? '#6b7280' : '#16a34a', background: isChecked ? '#f3f4f6' : '#f0fdf4', border: `1.5px solid ${isChecked ? '#e5e7eb' : '#86efac'}`, borderRadius: '8px', padding: '6px 14px', cursor: 'pointer' }}
                    >
                      {isChecked ? '↩ Mark as not done' : '✓ Mark as done'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Main component ---
interface Props {
  result: AnalysisResult;
  onFixContent: () => void;
  onGetCode: () => void;
  onUpgrade: () => void;
  isPro?: boolean;
  isAuthenticated?: boolean;
}

export const ScoreStep: React.FC<Props> = ({ result, onFixContent, onGetCode, onUpgrade, isPro, isAuthenticated }) => {
  const { score, categories, findings } = result;
  const [copied, setCopied] = useState(false);
  const msg = getScoreMessage(score);

  const handleDownloadPDF = () => {
    const html = generatePDFHtml(result, score, msg);
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const color = scoreColor(score);
  const failing = findings.filter(f => f.status !== 'pass');
  const passing = findings.filter(f => f.status === 'pass');

  // Orchard state — persisted in localStorage keyed to URL
  const orchardKey = `orchard_${result.url}`;
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(orchardKey);
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  const toggleCheck = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(orchardKey, JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  // Split failing items into tiers; uncategorized items fall into tier 2
  const categorized = new Set([...TIER_1_IDS, ...TIER_2_IDS, ...TIER_3_IDS]);
  const tier1Items = TIER_1_IDS.map(id => failing.find(f => f.id === id)).filter(Boolean) as typeof failing;
  const tier2Items = [
    ...TIER_2_IDS.map(id => failing.find(f => f.id === id)).filter(Boolean),
    ...failing.filter(f => !categorized.has(f.id)),
  ] as typeof failing;
  const tier3Items = TIER_3_IDS.map(id => failing.find(f => f.id === id)).filter(Boolean) as typeof failing;

  const totalFixed = failing.filter(f => checked.has(f.id)).length;
  const allDone = failing.length > 0 && totalFixed === failing.length;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '36px 24px 60px' }}>

      {/* Score card */}
      <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #ffffff)', border: '1px solid #ddd6fe', borderRadius: '24px', padding: '36px', textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '24px', marginBottom: '6px' }}>{msg.emoji}</div>
        <div style={{ fontSize: '68px', fontWeight: 900, color, lineHeight: 1, marginBottom: '4px' }}>
          {score}<span style={{ fontSize: '28px', fontWeight: 600 }}>%</span>
        </div>
        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
          AI search engines can identify <strong style={{ color: '#111827' }}>{score}%</strong> of what makes your business worth recommending
        </div>
        <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>{msg.headline}</div>
        <div style={{ fontSize: '14px', color: '#6b7280', maxWidth: '440px', margin: '0 auto', lineHeight: 1.6 }}>{msg.sub}</div>
      </div>

      {/* Plain English "what this means" box */}
      <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '16px', padding: '22px 24px', marginBottom: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '22px', flexShrink: 0, marginTop: '2px' }}>🗣️</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#92400e', marginBottom: '6px' }}>What this means in plain English</div>
          <div style={{ fontSize: '14px', color: '#78350f', lineHeight: 1.65, marginBottom: '8px' }}>{msg.realWorld}</div>
          <div style={{ fontSize: '13px', color: '#d97706', fontWeight: 600 }}>{msg.urgency}</div>
        </div>
      </div>

      {/* 🌳 Orchard action plan */}
      {failing.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '24px', marginBottom: '20px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '18px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#111827', margin: 0 }}>🌳 Your Action Plan</h2>
              <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
                Sorted by how easy each fix is — start at the top, check them off as you go
              </p>
            </div>
            <div style={{
              background: allDone ? '#dcfce7' : '#f5f3ff',
              border: `1px solid ${allDone ? '#86efac' : '#ddd6fe'}`,
              borderRadius: '100px', padding: '6px 14px',
              fontSize: '13px', fontWeight: 700,
              color: allDone ? '#16a34a' : '#7c3aed',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {allDone ? '🎉 All done!' : `${totalFixed} of ${failing.length} fixed`}
            </div>
          </div>

          {/* All-done celebration */}
          {allDone && (
            <div style={{ background: 'linear-gradient(135deg, #dcfce7, #f0fdf4)', border: '1.5px solid #86efac', borderRadius: '14px', padding: '20px', marginBottom: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚜</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#15803d', marginBottom: '4px' }}>
                Nothing left to grab — you're farming AI traffic now!
              </div>
              <div style={{ fontSize: '13px', color: '#16a34a' }}>
                Re-scan your site to see your updated score.
              </div>
            </div>
          )}

          {/* Tier 1 */}
          {tier1Items.length > 0 && (
            <OrchardTier
              emoji="🍋"
              title="Grab these today"
              subtitle="No web person needed · 5–15 min each"
              items={tier1Items}
              checked={checked}
              onToggle={toggleCheck}
              onNavigate={(dest) => dest === 'content' ? onFixContent() : onGetCode()}
              accentColor="#d97706"
              bgColor="#fffbeb"
              borderColor="#fde68a"
            />
          )}

          {/* Tier 2 */}
          {tier2Items.length > 0 && (
            <OrchardTier
              emoji="🍊"
              title="Worth a quick call"
              subtitle="One session with your web person"
              items={tier2Items}
              checked={checked}
              onToggle={toggleCheck}
              onNavigate={(dest) => dest === 'content' ? onFixContent() : onGetCode()}
              accentColor="#7c3aed"
              bgColor="#f5f3ff"
              borderColor="#ddd6fe"
            />
          )}

          {/* Tier 3 */}
          {tier3Items.length > 0 && (
            <OrchardTier
              emoji="🍎"
              title="The bigger wins"
              subtitle="Higher effort, highest long-term payoff"
              items={tier3Items}
              checked={checked}
              onToggle={toggleCheck}
              onNavigate={(dest) => dest === 'content' ? onFixContent() : onGetCode()}
              accentColor="#6d28d9"
              bgColor="#f5f3ff"
              borderColor="#ddd6fe"
            />
          )}

          <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '10px', marginBottom: 0 }}>
            ✓ Your progress saves automatically — come back any time
          </p>
        </div>
      )}

      {/* Category breakdown */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '26px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <TrendingUp size={16} style={{ color: '#7c3aed' }} />
          How you score in each area
        </h2>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '18px' }}>Each area shows how much of the picture AI has about your business.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {Object.entries(CATEGORY_INFO).map(([key, info]) => {
            const raw = (categories as Record<string, number>)[key] ?? 0;
            const pct = Math.min(100, Math.round((raw / info.max) * 100));
            const good = pct >= 60;
            return (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{info.label}</span>
                    <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '7px' }}>{info.desc}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: good ? '#7c3aed' : '#d97706', flexShrink: 0, marginLeft: '8px' }}>{pct}%</span>
                </div>
                <div style={{ height: '7px', background: '#f5f3ff', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: good ? '#7c3aed' : '#f59e0b', borderRadius: '99px', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Send to web person */}
      {failing.length > 0 && (() => {
        const { subject, body } = buildWebPersonEmail(result.url ?? '', score, failing);
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        const handleCopy = () => {
          navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        };
        return (
          <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #ffffff)', border: '1.5px solid #86efac', borderRadius: '20px', padding: '26px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Mail size={18} style={{ color: '#16a34a' }} />
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>Don't do it yourself — send it to your web person</div>
            </div>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '18px', lineHeight: 1.65 }}>
              We've written a ready-to-send email with every fix listed in plain English, exactly what needs to be done, and why it matters. Just add your web person's email address and hit send — they'll know what to do.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href={mailtoLink}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 22px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}
              >
                <Mail size={15} />
                Open in my email app
              </a>
              <button
                onClick={handleCopy}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'white', color: '#374151', border: '1.5px solid #d1d5db', borderRadius: '12px', padding: '12px 22px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                {copied ? <Check size={15} style={{ color: '#16a34a' }} /> : <Copy size={15} />}
                {copied ? 'Copied!' : 'Copy email text'}
              </button>
            </div>
            <div style={{ marginTop: '14px', fontSize: '12px', color: '#9ca3af' }}>
              💡 The email includes all {failing.length} fixes with step-by-step instructions your web person can action immediately.
            </div>
          </div>
        );
      })()}

      {/* Download PDF */}
      <div style={{ background: 'white', border: '1.5px solid #ddd6fe', borderRadius: '20px', padding: '22px 26px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', background: '#f5f3ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={20} style={{ color: '#7c3aed' }} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>Download your full report</div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>Save or print a PDF with your score, every fix, and step-by-step instructions.</div>
          </div>
        </div>
        <button
          onClick={handleDownloadPDF}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 22px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
        >
          <FileText size={15} />
          Download PDF
        </button>
      </div>

      {/* Share your score */}
      <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '16px', padding: '18px 22px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>📣 Share your score</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Challenge your network — how does their business compare?</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just checked my business's AI visibility on findmewith.ai — I scored ${score}%. 🤖\n\nFind out if ChatGPT and Google AI can find your business:\nhttps://findmewith.ai`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#111827', color: 'white', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}
          >
            𝕏 Share on X
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://findmewith.ai')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0a66c2', color: 'white', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}
          >
            in LinkedIn
          </a>
        </div>
      </div>

      {/* Things working */}
      {passing.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '26px', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>✅ Already working ({passing.length})</h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '14px' }}>Nice work — these are things AI can already see about you.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {passing.map(f => (
              <span key={f.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '100px', padding: '4px 12px', fontSize: '12px', color: '#7c3aed', fontWeight: 500 }}>
                <CheckCircle size={12} />
                {(FINDING_QUESTIONS[f.id] ?? f.label).replace(/\?$/, '')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Next step CTAs */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Your next steps →</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <button onClick={onFixContent} style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '18px', padding: '24px', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ fontSize: '26px', marginBottom: '8px' }}>✍️</div>
            <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>Write Better Content</div>
            <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '16px', lineHeight: 1.5 }}>We'll write AI-friendly content for your FAQ page, About page, and more — you just copy and paste it.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700 }}>Start writing <ArrowRight size={14} /></div>
          </button>
          <button onClick={onGetCode} style={{ background: '#fef3c7', color: '#111827', border: '1.5px solid #f59e0b', borderRadius: '18px', padding: '24px', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ fontSize: '26px', marginBottom: '8px' }}>🏷️</div>
            <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>Get My Code Snippet</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px', lineHeight: 1.5 }}>One small addition to your site tells AI exactly who you are. Copy, paste, done — no tech skills needed.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700, color: '#d97706' }}>Get the code <ArrowRight size={14} /></div>
          </button>
        </div>
      </div>

      {/* Encouragement footer */}
      <div style={{ textAlign: 'center', padding: '20px', background: '#f9fafb', borderRadius: '14px', border: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.65 }}>
          💡 <strong style={{ color: '#111827' }}>You don't have to do this alone.</strong> Every suggestion above comes with step-by-step guidance written in plain English. Questions? Email us at <a href="mailto:hello@findmewithai.com" style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: 600 }}>hello@findmewithai.com</a>
        </div>
      </div>

    </div>
  );
};
