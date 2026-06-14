import React from 'react';
import { CheckCircle, AlertCircle, ArrowRight, TrendingUp, Lightbulb, Star } from 'lucide-react';
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

function getTopPriority(failing: AnalysisResult['findings']) {
  const priorityOrder = ['has_schema_org', 'has_organization_schema', 'has_faq_schema', 'content_length', 'has_about_page', 'has_contact_info', 'has_meta_description', 'has_llms_txt'];
  for (const id of priorityOrder) {
    const found = failing.find(f => f.id === id);
    if (found) return found;
  }
  return failing[0] ?? null;
}

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
  const msg = getScoreMessage(score);
  const color = scoreColor(score);
  const failing = findings.filter(f => f.status !== 'pass');
  const passing = findings.filter(f => f.status === 'pass');
  const topPriority = getTopPriority(failing);
  const topPriorityInfo = topPriority ? FINDING_PLAIN_ENGLISH[topPriority.id] : null;

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

      {/* #1 Priority callout */}
      {topPriority && topPriorityInfo && (
        <div style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', borderRadius: '18px', padding: '24px', marginBottom: '20px', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Star size={16} color="#fbbf24" fill="#fbbf24" />
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#fbbf24' }}>Your #1 priority right now</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>
            {FINDING_QUESTIONS[topPriority.id] ?? topPriority.label}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.9, lineHeight: 1.6, marginBottom: '10px' }}>{topPriorityInfo.why}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#fbbf24' }}>
            <Lightbulb size={14} />
            {topPriorityInfo.fix}
          </div>
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

      {/* Things to fix */}
      {failing.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '26px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
            🔧 What to fix ({failing.length} {failing.length === 1 ? 'item' : 'items'})
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>Each of these is a gap that makes it harder for AI to recommend you. Fix them one at a time — you don't have to do it all at once.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {failing.map((f, i) => {
              const plain = FINDING_PLAIN_ENGLISH[f.id];
              return (
                <div key={f.id} style={{ padding: '13px 16px', background: i === 0 ? '#fef3c7' : '#fafafa', border: `1px solid ${i === 0 ? '#fde68a' : '#f0f0f0'}`, borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <AlertCircle size={16} style={{ color: i === 0 ? '#d97706' : '#9ca3af', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                        {FINDING_QUESTIONS[f.id] ?? f.label}
                        {i === 0 && <span style={{ marginLeft: '8px', fontSize: '11px', background: '#d97706', color: 'white', borderRadius: '6px', padding: '1px 7px', fontWeight: 700 }}>Start here</span>}
                      </div>
                      {plain && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px', lineHeight: 1.55 }}>{plain.why}</div>}
                      {!plain && f.suggestion && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>{f.suggestion}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
